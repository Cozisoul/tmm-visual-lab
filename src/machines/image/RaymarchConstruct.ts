
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

export const RaymarchConstruct: Machine = {
    id: 'raymarch-construct',
    name: 'Raymarch Construct',
    department: MachineDepartment.IMAGE,
    description: 'Constructive Solid Geometry (CSG) renderer.',
    controls: [
        { id: 'res', label: 'Resolution', type: 'number', min: 4, max: 20, step: 1, defaultValue: 8 },
        { id: 'shapeA', label: 'Shape A', type: 'select', options: ['Sphere', 'Box', 'Torus'], defaultValue: 'Sphere' },
        { id: 'shapeB', label: 'Shape B', type: 'select', options: ['Sphere', 'Box', 'Torus'], defaultValue: 'Box' },
        { id: 'op', label: 'Operation', type: 'select', options: ['Union', 'Subtract', 'Intersect', 'Smooth'], defaultValue: 'Smooth' },
        { id: 'blend', label: 'Smoothness', type: 'number', min: 0.1, max: 2.0, step: 0.1, defaultValue: 0.5 },
        { id: 'dist', label: 'Separation', type: 'number', min: 0, max: 3.0, step: 0.1, defaultValue: 1.2 },
        { id: 'rotSpeed', label: 'Rotation', type: 'number', min: 0, max: 5, step: 0.1, defaultValue: 1 },
        { id: 'scale', label: 'Scale', type: 'number', min: 0.5, max: 2.0, step: 0.1, defaultValue: 1.0 },
        { id: 'color', label: 'Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { res, shapeA, shapeB, op, blend, dist, rotSpeed, scale, color, bg } = params;
        const vol = globalState?.audio.volume || 0;
        fillBackground(ctx, width, height, bg, globalState);

        const t = time * 0.001 * rotSpeed;
        const cx = width / 2;
        const cy = height / 2;
        const minDim = Math.min(width, height);
        
        // Audio Separation
        const activeDist = dist + (vol * 1.5);
        
        const hex2rgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        };
        const [cr, cg, cb] = hex2rgb(color);

        const sdSphere = (p: number[], r: number) => {
            return Math.sqrt(p[0]*p[0] + p[1]*p[1] + p[2]*p[2]) - r;
        };
        const sdBox = (p: number[], b: number[]) => {
            const dx = Math.abs(p[0]) - b[0];
            const dy = Math.abs(p[1]) - b[1];
            const dz = Math.abs(p[2]) - b[2];
            const mcx = Math.max(dx, 0);
            const mcy = Math.max(dy, 0);
            const mcz = Math.max(dz, 0);
            return Math.sqrt(mcx*mcx + mcy*mcy + mcz*mcz) + Math.min(Math.max(dx, Math.max(dy, dz)), 0.0);
        };
        const sdTorus = (p: number[], t: number[]) => {
            const qx = Math.sqrt(p[0]*p[0] + p[2]*p[2]) - t[0];
            return Math.sqrt(qx*qx + p[1]*p[1]) - t[1];
        };

        const smin = (a: number, b: number, k: number) => {
            const h = Math.max(k - Math.abs(a - b), 0.0) / k;
            return Math.min(a, b) - h * h * k * (1.0 / 4.0);
        };

        const map = (p: number[]) => {
            const sp = [p[0]/scale, p[1]/scale, p[2]/scale];
            const ca = Math.cos(t);
            const sa = Math.sin(t);
            const pA = [sp[0]*ca + sp[2]*sa, sp[1], -sp[0]*sa + sp[2]*ca];
            const cb = Math.cos(t * 0.5);
            const sb = Math.sin(t * 0.5);
            const pB = [sp[0], sp[1]*cb - sp[2]*sb, sp[1]*sb + sp[2]*cb];
            pB[0] -= Math.sin(t)*activeDist;
            
            let d1 = 0, d2 = 0;
            if(shapeA === 'Sphere') d1 = sdSphere(pA, 1.0);
            else if(shapeA === 'Box') d1 = sdBox(pA, [0.8, 0.8, 0.8]);
            else if(shapeA === 'Torus') d1 = sdTorus(pA, [0.8, 0.3]);
            if(shapeB === 'Sphere') d2 = sdSphere(pB, 0.8);
            else if(shapeB === 'Box') d2 = sdBox(pB, [0.7, 0.7, 0.7]);
            else if(shapeB === 'Torus') d2 = sdTorus(pB, [0.6, 0.25]);

            let result = d1;
            if(op === 'Union') result = Math.min(d1, d2);
            else if(op === 'Subtract') result = Math.max(d1, -d2);
            else if(op === 'Intersect') result = Math.max(d1, d2);
            else if(op === 'Smooth') result = smin(d1, d2, blend);
            return result * scale;
        };

        const calcNormal = (p: number[]) => {
            const e = 0.001;
            const d = map(p);
            const nx = map([p[0]+e, p[1], p[2]]) - d;
            const ny = map([p[0], p[1]+e, p[2]]) - d;
            const nz = map([p[0], p[1], p[2]+e]) - d;
            const l = Math.sqrt(nx*nx + ny*ny + nz*nz);
            return [nx/l, ny/l, nz/l];
        };

        for(let y = 0; y < height; y += res) {
            for(let x = 0; x < width; x += res) {
                // GoL: Skip Pixel
                if(isGridAlive(x, y, width, height, globalState)) continue;
                
                const uvx = (x - cx) / minDim;
                const uvy = (y - cy) / minDim;
                const ro = [0, 0, -3.5];
                const rd = [uvx, uvy, 1]; 
                const rdl = Math.sqrt(rd[0]*rd[0] + rd[1]*rd[1] + rd[2]*rd[2]);
                rd[0]/=rdl; rd[1]/=rdl; rd[2]/=rdl;

                let d = 0;
                let tDist = 0;
                let hit = false;
                
                for(let i=0; i<32; i++) {
                    const p = [ro[0] + rd[0]*tDist, ro[1] + rd[1]*tDist, ro[2] + rd[2]*tDist];
                    d = map(p);
                    if(d < 0.01) { hit = true; break; }
                    tDist += d;
                    if(tDist > 10) break;
                }

                if(hit) {
                    const p = [ro[0] + rd[0]*tDist, ro[1] + rd[1]*tDist, ro[2] + rd[2]*tDist];
                    const n = calcNormal(p);
                    const light = [0.577, 0.577, -0.577];
                    const diff = Math.max(0, n[0]*light[0] + n[1]*light[1] + n[2]*light[2]);
                    const br = 0.2 + 0.8 * diff;
                    ctx.fillStyle = `rgb(${cr*br}, ${cg*br}, ${cb*br})`;
                    ctx.fillRect(x, y, res, res);
                }
            }
        }
    }
};
