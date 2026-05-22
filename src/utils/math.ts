/**
 * Math utilities: Noise, random, easing functions
 */

// --- Perlin Noise Implementation ---

const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;

let perlin_octaves = 4;
let perlin_amp_falloff = 0.5;
let perlin: number[] | null = null;

const scaled_cosine = (i: number) => 0.5 * (1.0 - Math.cos(i * Math.PI));

/**
 * Perlin noise function
 */
export const noise = (x: number, y: number = 0, z: number = 0): number => {
  if (perlin == null) {
    perlin = new Array(PERLIN_SIZE + 1);
    for (let i = 0; i < PERLIN_SIZE + 1; i++) {
      perlin[i] = Math.random();
    }
  }

  if (x < 0) x = -x;
  if (y < 0) y = -y;
  if (z < 0) z = -z;

  let xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z);
  let xf = x - xi,
    yf = y - yi,
    zf = z - zi;
  let rxf, ryf;

  let r = 0;
  let ampl = 0.5;

  let n1, n2, n3;

  for (let o = 0; o < perlin_octaves; o++) {
    let of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

    rxf = scaled_cosine(xf);
    ryf = scaled_cosine(yf);

    n1 = perlin![of & PERLIN_SIZE];
    n1 += rxf * (perlin![(of + 1) & PERLIN_SIZE] - n1);
    n2 = perlin![(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n2 += rxf * (perlin![(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
    n1 += ryf * (n2 - n1);

    of += PERLIN_ZWRAP;
    n2 = perlin![of & PERLIN_SIZE];
    n2 += rxf * (perlin![(of + 1) & PERLIN_SIZE] - n2);
    n3 = perlin![(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n3 += rxf * (perlin![(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
    n2 += ryf * (n3 - n2);

    r += n1 + scaled_cosine(zf) * (n2 - n1) * ampl;
    ampl *= perlin_amp_falloff;
    xi <<= 1;
    xf *= 2;
    yi <<= 1;
    yf *= 2;
    zi <<= 1;
    zf *= 2;

    if (xf >= 1.0) {
      xi++;
      xf--;
    }
    if (yf >= 1.0) {
      yi++;
      yf--;
    }
    if (zf >= 1.0) {
      zi++;
      zf--;
    }
  }
  return r;
};

/**
 * Seeded random number generator
 */
export const random = (seed: number): number => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

/**
 * Linear interpolation
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

/**
 * Smooth step easing (cubic hermite)
 */
export const smoothstep = (t: number): number => {
  return t * t * (3 - 2 * t);
};

/**
 * Euclidean distance between two points
 */
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.hypot(dx, dy);
};
