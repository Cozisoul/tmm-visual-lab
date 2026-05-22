
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

// --- Deterministic RNG ---
function hash(x: number, y: number, seed: number) {
     let n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
}

// --- Isometric Projection Helper ---
// Converts 3D (x, y, z) to 2D screen coordinates
// World: X=Right-Down, Z=Left-Down, Y=Up
function isoProject(x: number, y: number, z: number, tileW: number, tileH: number, centerX: number, centerY: number) {
    // Standard Isometric:
    // ScreenX = (X - Z) * cos(30)
    // ScreenY = (X + Z) * sin(30) - Y
    // We approximate for pixel art style tiles:
    // Move X: +W, +H
    // Move Z: -W, +H
    const sx = (x - z) * tileW + centerX;
    const sy = (x + z) * tileH - y * tileH * 1.5 + centerY; // Y scale adjusted for height illusion
    return { x: sx, y: sy };
}

export const IsometricCity: Machine = {
    id: 'isometric-city',
    name: 'Isometric City',
    department: MachineDepartment.GRID,
    description: 'Authentic 3D isometric architecture with seismic structures.',
    controls: [
        { id: 'scale', label: 'Tile Size', type: 'number', min: 10, max: 100, step: 5, defaultValue: 40 },
        { id: 'height', label: 'Max Height', type: 'number', min: 1, max: 20, step: 1, defaultValue: 8 },
        { id: 'density', label: 'Density', type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 0.5 },
        { id: 'color', label: 'Building Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#0b0f19' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { scale, height: heightLimit, density, color, bg } = params;
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;

        fillBackground(ctx, width, height, bg, globalState);

        // Tile Dimensions
        const tileW = scale;
        const tileH = scale * 0.5; // Isometric 2:1 ratio

        // Calculate Grid Bounds to cover screen
        // Center of world
        const centerX = width / 2;
        const centerY = height / 4; // Start higher up to fit tall buildings

        // How many tiles?
        const range = Math.ceil((width + height) / scale) * 0.8;
       
        // We need a list of buildings to sort
        interface Building {
            x: number;
            z: number;
            h: number;
            dist: number; // For sorting
        }
        
        const buildings: Building[] = [];
        const seedBase = 999;

        // Populate Grid
        // Increasing range to ensure screen coverage
        const gridSize = 30; // 30x30 grid should be enough
        for (let z = -gridSize; z < gridSize; z++) {
            for (let x = -gridSize; x < gridSize; x++) {
                 // Cull invisible
                 // Rough check
                 const p = isoProject(x, 0, z, tileW, tileH, centerX, centerY);
                 // If clearly out of bounds, skip
                 // Relaxed bounds to prevent popping at edges
                 if (p.y > height + 200 || p.y < -500 || p.x < -200 || p.x > width + 200) continue; 
                 
                 // Seismic Floor
                 const seismicY = Math.sin(x * 0.2 + z * 0.2 + time * 0.002) * (bass * 50);

                 // Deterministic building
                 const hVal = hash(x, z, seedBase);
                 
                 // GoL Interaction (Nuke building)
                 const alive = isGridAlive(p.x, p.y, width, height, globalState);
                 if (alive) {
                     // Empty lot (grid floor is still drawn implicitly by empty space? No, let's draw a floor plate)
                     buildings.push({ x, z, h: 0.1, dist: x + z });
                     continue;
                 }

                 if (hVal < density) {
                     // Height Calculation
                     const buildingH = Math.floor(hVal * 100) % heightLimit + 1;
                     // Add Bass Pulse to height
                     const pulse = Math.floor(bass * 5);
                     
                     buildings.push({
                         x,
                         z,
                         h: buildingH + pulse,
                         dist: x + z // Depth for sorting
                     });
                 } else {
                     // Draw floor plate for empty tiles so it looks like a continuous grid
                     buildings.push({ x, z, h: 0.1, dist: x+z });
                 }
            }
        }
        
        // PAINTER'S ALGORITHM: Sort by depth (x + z)
        // Background first (lowest x+z)
        buildings.sort((a, b) => a.dist - b.dist);

        // Render Loop
        const topColor = color;
        const leftColor = adjustBrightness(color, -20);
        const rightColor = adjustBrightness(color, -40);

        ctx.lineJoin = 'round';
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000'; // Outline for definition

        buildings.forEach(b => {
             // Calculate Vertices
             // We draw a prism from y=0 to y=b.h
             // Actually, we can just draw the 3 Visible Faces
             
             // Base Center (x, 0, z) -> projected
             const base = isoProject(b.x, 0, b.z, tileW, tileH, centerX, centerY);
             // Top Center (x, h, z) -> projected
             const top = isoProject(b.x, b.h, b.z, tileW, tileH, centerX, centerY);
             
             // Vertices relative to center:
             // Top: (0, -h)
             // Right: (+w, 0)
             // Bottom: (0, +h)
             // Left: (-w, 0)
             
             // TOP FACE (Quad)
             ctx.fillStyle = topColor;
             ctx.beginPath();
             ctx.moveTo(top.x, top.y - tileH);       // Top Corner
             ctx.lineTo(top.x + tileW, top.y);       // Right Corner
             ctx.lineTo(top.x, top.y + tileH);       // Bottom Corner
             ctx.lineTo(top.x - tileW, top.y);       // Left Corner
             ctx.closePath();
             ctx.fill();
             ctx.stroke();

            // Only draw sides if it has height > 0.1
             if (b.h > 0.15) {
                 // RIGHT FACE (Quad) - Visible side
                 ctx.fillStyle = rightColor;
                 ctx.beginPath();
                 ctx.moveTo(top.x + tileW, top.y);       // Top-Right
                 ctx.lineTo(top.x, top.y + tileH);       // Top-Bottom
                 ctx.lineTo(top.x, base.y + tileH);      // Base-Bottom
                 ctx.lineTo(base.x + tileW, base.y);     // Base-Right
                 ctx.closePath();
                 ctx.fill();
                 ctx.stroke();

                 // LEFT FACE (Quad) - Visible side
                 ctx.fillStyle = leftColor;
                 ctx.beginPath();
                 ctx.moveTo(top.x - tileW, top.y);       // Top-Left
                 ctx.lineTo(top.x, top.y + tileH);       // Top-Bottom
                 ctx.lineTo(top.x, base.y + tileH);      // Base-Bottom
                 ctx.lineTo(base.x - tileW, base.y);     // Base-Left
                 ctx.closePath();
                 ctx.fill();
                 ctx.stroke();
             }
        });
    }
};

// --- Helper for shading ---
function adjustBrightness(hex: string, percent: number) {
    // strip the leading # if it's there
    hex = hex.replace(/^\s*#|\s*$/g, '');
    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, '$1$1');
    }
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    return '#' +
       ((0|(1<<8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
}
