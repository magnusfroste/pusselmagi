import { Theme } from '../types';

/**
 * Lokal bildverkstad: varje pussel får en egen tecknad bild som skapas i
 * webbläsaren som SVG (data-URI). Inga externa bildtjänster, inga nätanrop,
 * inga foton som kan visa olämpligt innehåll för barn.
 */

type Rng = () => number;

const rng = (seed: number): Rng => {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const pick = <T,>(r: Rng, arr: T[]): T => arr[Math.floor(r() * arr.length) % arr.length];
const between = (r: Rng, a: number, b: number) => a + r() * (b - a);

const PALETTES: Record<Theme, { sky: [string, string]; ground: string; ink: string; accents: string[] }> = {
  animals: { sky: ['#bff0d4', '#e8f7c9'], ground: '#7ec86a', ink: '#1d3b2a', accents: ['#f4a259', '#e76f51', '#f6bd60', '#8ab17d'] },
  space: { sky: ['#0b1033', '#2a1a5e'], ground: '#1b1140', ink: '#e8e6ff', accents: ['#ffd166', '#8ecae6', '#ff70a6', '#b8b8ff'] },
  fantasy: { sky: ['#c9b6ff', '#ffd9e8'], ground: '#8f7bd6', ink: '#2b1a4a', accents: ['#ffd166', '#ff8fab', '#8ecae6', '#9ae6b4'] },
  nature: { sky: ['#9ad9ff', '#e6f7ff'], ground: '#5fae5f', ink: '#173d2b', accents: ['#2a9d8f', '#e9c46a', '#f4a261', '#a7c957'] },
};

function stars(r: Rng, n: number, w: number, h: number, color: string) {
  let out = '';
  for (let i = 0; i < n; i += 1) {
    out += `<circle cx="${between(r, 0, w).toFixed(1)}" cy="${between(r, 0, h * 0.8).toFixed(1)}" r="${between(r, 0.8, 2.4).toFixed(1)}" fill="${color}" opacity="${between(r, 0.4, 0.95).toFixed(2)}"/>`;
  }
  return out;
}

function animal(r: Rng, w: number, h: number, accents: string[]) {
  const cx = between(r, w * 0.25, w * 0.75);
  const cy = between(r, h * 0.55, h * 0.72);
  const body = between(r, 34, 52);
  const color = pick(r, accents);
  const ear = between(r, 12, 22);
  return `
    <ellipse cx="${cx}" cy="${cy + body * 0.75}" rx="${body * 1.05}" ry="${body * 0.55}" fill="${pick(r, accents)}" opacity="0.55"/>
    <circle cx="${cx}" cy="${cy}" r="${body}" fill="${color}"/>
    <circle cx="${cx - body * 0.72}" cy="${cy - body * 0.7}" r="${ear}" fill="${color}"/>
    <circle cx="${cx + body * 0.72}" cy="${cy - body * 0.7}" r="${ear}" fill="${color}"/>
    <circle cx="${cx - body * 0.34}" cy="${cy - body * 0.12}" r="${body * 0.13}" fill="#1b1b1b"/>
    <circle cx="${cx + body * 0.34}" cy="${cy - body * 0.12}" r="${body * 0.13}" fill="#1b1b1b"/>
    <circle cx="${cx - body * 0.3}" cy="${cy - body * 0.18}" r="${body * 0.045}" fill="#fff"/>
    <circle cx="${cx + body * 0.38}" cy="${cy - body * 0.18}" r="${body * 0.045}" fill="#fff"/>
    <path d="M ${cx - body * 0.2} ${cy + body * 0.3} Q ${cx} ${cy + body * 0.52} ${cx + body * 0.2} ${cy + body * 0.3}" stroke="#1b1b1b" stroke-width="${body * 0.08}" fill="none" stroke-linecap="round"/>
  `;
}

function rocket(r: Rng, w: number, h: number, accents: string[]) {
  const x = between(r, w * 0.3, w * 0.7);
  const y = between(r, h * 0.35, h * 0.6);
  const s = between(r, 0.8, 1.25);
  return `
    <g transform="translate(${x} ${y}) scale(${s})">
      <path d="M 0 -70 C 30 -30 30 30 20 60 L -20 60 C -30 30 -30 -30 0 -70 Z" fill="${accents[1]}"/>
      <circle cx="0" cy="-10" r="16" fill="#dff3ff" stroke="${accents[3]}" stroke-width="5"/>
      <path d="M -20 40 L -46 70 L -18 62 Z" fill="${accents[0]}"/>
      <path d="M 20 40 L 46 70 L 18 62 Z" fill="${accents[0]}"/>
      <path d="M -12 62 L 0 100 L 12 62 Z" fill="#ffb703"/>
      <path d="M -6 62 L 0 84 L 6 62 Z" fill="#fb8500"/>
    </g>
    <circle cx="${between(r, w * 0.15, w * 0.85)}" cy="${between(r, h * 0.2, h * 0.6)}" r="${between(r, 18, 40)}" fill="${accents[3]}" opacity="0.5"/>
  `;
}

function castle(r: Rng, w: number, h: number, accents: string[]) {
  const baseY = h * 0.78;
  const bw = between(r, w * 0.34, w * 0.5);
  const bh = between(r, h * 0.32, h * 0.44);
  const x = (w - bw) / 2;
  const towers = [0, 1, 2]
    .map((i) => {
      const tw = bw * 0.2;
      const tx = x + (bw - tw) * (i / 2);
      return `<rect x="${tx}" y="${baseY - bh - 26}" width="${tw}" height="${bh + 26}" fill="${accents[i % accents.length]}"/>
        <path d="M ${tx - 6} ${baseY - bh - 26} L ${tx + tw / 2} ${baseY - bh - 70} L ${tx + tw + 6} ${baseY - bh - 26} Z" fill="${accents[(i + 1) % accents.length]}"/>`;
    })
    .join('');
  return `
    <rect x="${x}" y="${baseY - bh * 0.7}" width="${bw}" height="${bh * 0.7}" fill="${accents[2]}"/>
    ${towers}
    <path d="M ${w / 2 - 16} ${baseY} L ${w / 2 - 16} ${baseY - 46} A 16 16 0 0 1 ${w / 2 + 16} ${baseY - 46} L ${w / 2 + 16} ${baseY} Z" fill="#5b3b1f"/>
  `;
}

function landscape(r: Rng, w: number, h: number, accents: string[]) {
  let out = '';
  for (let i = 0; i < 4; i += 1) {
    const peak = between(r, h * 0.25, h * 0.62);
    const cx = between(r, 0, w);
    out += `<path d="M ${cx - between(r, 90, 180)} ${h * 0.86} L ${cx} ${peak} L ${cx + between(r, 90, 180)} ${h * 0.86} Z" fill="${accents[i % accents.length]}" opacity="0.85"/>`;
  }
  for (let i = 0; i < 7; i += 1) {
    const tx = between(r, 10, w - 10);
    out += `<circle cx="${tx}" cy="${h * 0.82}" r="${between(r, 16, 30)}" fill="${pick(r, accents)}"/>`;
    out += `<rect x="${tx - 3}" y="${h * 0.82}" width="6" height="${between(r, 24, 42)}" fill="#6b4f2a"/>`;
  }
  return out;
}

export function buildPuzzleImage(theme: Theme, seed: number, width = 800, height = 800): string {
  const r = rng(seed);
  const palette = PALETTES[theme] ?? PALETTES.nature;
  const w = width;
  const h = height;

  let scene = '';
  if (theme === 'animals') scene = animal(r, w, h, palette.accents) + (r() > 0.5 ? animal(r, w, h, palette.accents) : '');
  else if (theme === 'space') scene = stars(r, 60, w, h, '#ffffff') + rocket(r, w, h, palette.accents);
  else if (theme === 'fantasy') scene = stars(r, 24, w, h, '#ffffff') + castle(r, w, h, palette.accents);
  else scene = landscape(r, w, h, palette.accents);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.sky[0]}"/>
        <stop offset="100%" stop-color="${palette.sky[1]}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#sky)"/>
    <circle cx="${between(r, w * 0.1, w * 0.9)}" cy="${between(r, h * 0.1, h * 0.25)}" r="${between(r, 30, 55)}" fill="${theme === 'space' ? '#f8f5d0' : '#ffe98a'}" opacity="0.9"/>
    ${scene}
    <path d="M 0 ${h * 0.86} Q ${w * 0.35} ${h * 0.78} ${w * 0.6} ${h * 0.87} T ${w} ${h * 0.84} L ${w} ${h} L 0 ${h} Z" fill="${palette.ground}"/>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const PRAISE: Record<Theme, string[]> = {
  animals: ['Du är snabb som en gepard! 🐆', 'Vilket djurproffs du är! 🐾', 'Djuren hurrar för dig! 🦁'],
  space: ['Du är snabbare än en komet! ☄️', 'Rymden är ditt hemmaplan! 🚀', 'Stjärnklart jobbat! ⭐'],
  fantasy: ['Du trollar fram pusslen! ✨', 'Magiskt bra gjort! 🧙', 'Slottet är ditt! 🏰'],
  nature: ['Du växer som en solros! 🌻', 'Hela skogen Firar dig! 🌳', 'Naturligtvis gjorde du det! 🍃'],
};

export function localPraise(theme: Theme, seconds: number): string {
  const lines = PRAISE[theme as Theme] ?? PRAISE.nature;
  const extra = seconds < 45 ? ' Så fort det gick!' : '';
  return `${pick(rng(Math.floor(Math.random() * 100000)), lines)}${extra}`;
}