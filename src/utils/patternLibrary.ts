/**
 * Pattern Library Utilities
 * Pre-built pattern generators and texture synthesis
 */

export interface Pattern {
  id: string;
  name: string;
  category: 'geometric' | 'organic' | 'noise' | 'texture';
  generate: (ctx: CanvasRenderingContext2D, width: number, height: number, params: PatternParams) => void;
}

export interface PatternParams {
  scale?: number;
  color?: string;
  opacity?: number;
  [key: string]: any;
}

// Noise Patterns
export const perlinNoise: Pattern = {
  id: 'perlin-noise',
  name: 'Perlin Noise',
  category: 'noise',
  generate: (ctx, width, height, params) => {
    const scale = params.scale || 50;
    const color = params.color || '#ffffff';
    const opacity = params.opacity || 1;

    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const n = noise(x / scale, y / scale);
        const brightness = Math.floor(n * 255);
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${opacity})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  },
};

// Simple noise function (would use proper Perlin in production)
const noise = (x: number, y: number): number => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

// Geometric Patterns
export const gridPattern: Pattern = {
  id: 'grid',
  name: 'Grid',
  category: 'geometric',
  generate: (ctx, width, height, params) => {
    const scale = params.scale || 20;
    const color = params.color || '#ffffff';
    const opacity = params.opacity || 1;

    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  },
};

export const dotsPattern: Pattern = {
  id: 'dots',
  name: 'Dots',
  category: 'geometric',
  generate: (ctx, width, height, params) => {
    const scale = params.scale || 20;
    const size = params.size || 2;
    const color = params.color || '#ffffff';
    const opacity = params.opacity || 1;

    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;

    for (let y = scale; y < height; y += scale) {
      for (let x = scale; x < width; x += scale) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
};

export const hexagonPattern: Pattern = {
  id: 'hexagon',
  name: 'Hexagon',
  category: 'geometric',
  generate: (ctx, width, height, params) => {
    const scale = params.scale || 30;
    const color = params.color || '#ffffff';
    const opacity = params.opacity || 1;

    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 1;

    const hexRadius = scale / 2;
    const hexHeight = hexRadius * Math.sqrt(3);

    for (let y = 0; y < height + hexHeight; y += hexHeight) {
      for (let x = 0; x < width + scale; x += scale * 1.5) {
        const offsetX = (y / hexHeight) % 2 === 0 ? 0 : scale * 0.75;
        drawHexagon(ctx, x + offsetX, y, hexRadius);
      }
    }
  },
};

const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
};

// Organic Patterns
export const cellularPattern: Pattern = {
  id: 'cellular',
  name: 'Cellular',
  category: 'organic',
  generate: (ctx, width, height, params) => {
    const scale = params.scale || 50;
    const color = params.color || '#ffffff';
    const opacity = params.opacity || 1;

    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;

    const cells: Array<{ x: number; y: number }> = [];
    const cellCount = Math.floor((width * height) / (scale * scale));

    // Generate random cell centers
    for (let i = 0; i < cellCount; i++) {
      cells.push({
        x: Math.random() * width,
        y: Math.random() * height,
      });
    }

    // Draw Voronoi-like cells
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        let minDist = Infinity;
        let closestCell = 0;

        cells.forEach((cell, i) => {
          const dist = Math.sqrt((x - cell.x) ** 2 + (y - cell.y) ** 2);
          if (dist < minDist) {
            minDist = dist;
            closestCell = i;
          }
        });

        const brightness = Math.floor((minDist / scale) * 255) % 255;
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${opacity})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  },
};

export const wavePattern: Pattern = {
  id: 'wave',
  name: 'Wave',
  category: 'organic',
  generate: (ctx, width, height, params) => {
    const frequency = params.frequency || 10;
    const amplitude = params.amplitude || 20;
    const color = params.color || '#ffffff';
    const opacity = params.opacity || 1;

    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 2;

    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      for (let x = 0; x < width; x += 2) {
        const waveY = y + Math.sin((x / width) * Math.PI * frequency) * amplitude;
        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }
  },
};

// Texture Patterns
export const gradientTexture: Pattern = {
  id: 'gradient-texture',
  name: 'Gradient Texture',
  category: 'texture',
  generate: (ctx, width, height, params) => {
    const color1 = params.color1 || '#000000';
    const color2 = params.color2 || '#ffffff';
    const angle = params.angle || 0;

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  },
};

export const allPatterns: Pattern[] = [
  perlinNoise,
  gridPattern,
  dotsPattern,
  hexagonPattern,
  cellularPattern,
  wavePattern,
  gradientTexture,
];

export const getPatternsByCategory = (category: Pattern['category']): Pattern[] => {
  return allPatterns.filter(p => p.category === category);
};

