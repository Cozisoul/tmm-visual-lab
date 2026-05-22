
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { random } from '../../utils/math';

export const DataStream: Machine = {
    id: 'data-stream',
    name: 'Data Stream',
    department: MachineDepartment.TYPE,
    description: 'Financial & operational data flow.',
    controls: [
        { id: 'cols', label: 'Signal Lanes', type: 'number', min: 4, max: 60, step: 1, defaultValue: 20 },
        { id: 'mode', label: 'Data Protocol', type: 'select', options: ['Matrix', 'Financial', 'Cyberpunk', 'Binary'], defaultValue: 'Financial' },
        { id: 'density', label: 'Packet Density', type: 'number', min: 0.1, max: 1, step: 0.1, defaultValue: 0.75 },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#10b981' }, 
        { id: 'bg', label: 'Void Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { cols, mode, density, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        const fontSize = 14;
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'center';

        const colWidth = width / cols;
        const rows = Math.ceil(height / fontSize);
        const t = time * 0.001;

        for (let x = 0; x < cols; x++) {
            const colSeed = x * 1337;
            const r = (n: number) => random(colSeed + n);
            const colSpeed = (0.5 + r(x) * 1.5) * (1 + mid);
            const offset = Math.floor(t * 10 * colSpeed);

            for (let y = 0; y < rows; y++) {
                const px = x * colWidth + colWidth / 2;
                const py = y * fontSize + fontSize / 2;

                if (isGridAlive(px, py, width, height, globalState)) {
                    ctx.save();
                    ctx.fillStyle = '#ff0000';
                    ctx.globalAlpha = 0.3 * vol;
                    ctx.fillRect(x * colWidth, y * fontSize, colWidth, fontSize);
                    ctx.restore();
                    continue;
                }

                // Data Generation Logic
                const dataSeed = x * 100 + (y + offset);
                const dataHash = r(dataSeed);
                if (dataHash > density) continue;

                let char = '';
                let charColor = color;

                if (mode === 'Matrix') {
                    char = String.fromCharCode(0x30A0 + Math.floor(dataHash * 96));
                } else if (mode === 'Financial') {
                    const symbols = ['$', '€', '¥', '£', '↑', '↓', '%'];
                    char = dataHash > 0.8 ? symbols[Math.floor(dataHash * symbols.length)] : (dataHash * 100).toFixed(0);
                    charColor = dataHash > 0.5 ? '#10b981' : '#f87171'; // Green/Red
                } else if (mode === 'Cyberpunk') {
                    char = dataHash > 0.5 ? '>>' : '::';
                    charColor = '#f0abfc'; // Pink
                } else {
                    char = dataHash > 0.5 ? '1' : '0';
                }

                ctx.save();
                ctx.translate(px, py);
                
                // Highlight scanlines and bass hits
                const isScanline = (y + offset) % rows === Math.floor(t * 2 % rows);
                const isHit = dataHash < bass * 0.2;

                if (isHit || isScanline) {
                    ctx.fillStyle = '#ffffff';
                    if (glow) {
                        ctx.shadowColor = '#ffffff';
                        ctx.shadowBlur = 15;
                    }
                } else {
                    ctx.fillStyle = charColor;
                    ctx.globalAlpha = 0.2 + (1 - (y / rows)) * 0.8;
                    if (glow) {
                        ctx.shadowColor = charColor;
                        ctx.shadowBlur = treble * 10;
                    }
                }

                ctx.fillText(char, 0, 0);
                ctx.restore();
            }
        }

        // Add Vertical Data Strips
        if (vol > 0.4) {
            ctx.save();
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.1;
            ctx.fillRect(width - 40, 0, 40, height);
            ctx.globalAlpha = 0.5;
            ctx.font = '8px monospace';
            ctx.translate(width - 20, height / 2);
            ctx.rotate(Math.PI / 2);
            ctx.fillText(`STREAM_BUFFER_DATA_PACKET_0x${(vol * 0xFFFF).toString(16).toUpperCase()}`, 0, 0);
            ctx.restore();
        }
    }
};
