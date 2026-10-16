import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

// CRC32 implementation for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPNG(width, height, getPixel) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(6, 9); // Color type 6 (RGBA)
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Color interpolation for Tulizaana brand gradient
function getBrandGradient(t) {
  // t from 0 to 1
  // Start: #00F0D0 -> (0, 240, 208)
  // Mid:   #00D2C4 -> (0, 210, 196)
  // End:   #00B4D8 -> (0, 180, 216)
  let r = 0;
  let g, b;
  if (t <= 0.5) {
    const localT = t * 2;
    g = Math.round(240 + (210 - 240) * localT);
    b = Math.round(208 + (196 - 208) * localT);
  } else {
    const localT = (t - 0.5) * 2;
    g = Math.round(210 + (180 - 210) * localT);
    b = Math.round(196 + (216 - 196) * localT);
  }
  return [r, g, b];
}

// Generate icon with Tulizaana brand emblem
function renderTulizaanaIcon(x, y, width, height, isMaskable) {
  const cx = width / 2;
  const cy = height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background color: #0d131f for maskable & apple-touch, dark rounded shield for standard
  const bgR = 13, bgG = 19, bgB = 31; // #0d131f

  // Scale factor based on maskable safe zone (80% diameter = 40% radius)
  const scale = isMaskable ? 0.36 : 0.44;
  const maxR = width * scale;

  // Normalized coordinates in [-1, 1] relative to icon center and scaled
  const nx = dx / maxR;
  const ny = dy / maxR;
  const nDist = Math.sqrt(nx * nx + ny * ny);

  // Gradient parameter based on diagonal angle
  const gradT = Math.max(0, Math.min(1, (nx + ny + 1.4) / 2.8));
  const [grR, grG, grB] = getBrandGradient(gradT);

  // Outer ring of logo: radius between 0.85 and 1.0
  const isOuterRing = nDist >= 0.78 && nDist <= 1.0;

  // Center vertical stem (left pill/column)
  const isLeftStem = nx >= -0.52 && nx <= 0.08 && ny >= -0.85 && ny <= 0.85;

  // Upper right head dot (circle around nx=0.42, ny=-0.28, radius=0.30)
  const headDx = nx - 0.42;
  const headDy = ny - (-0.28);
  const isHeadDot = (headDx * headDx + headDy * headDy) <= (0.28 * 0.28);

  // Lower support wing arc connecting stem to bottom right
  const isLowerArc = (nx >= -0.05 && nx <= 0.80 && ny >= 0.25 && ny <= 0.75 && (nx * nx + ny * ny <= 0.82));

  // Small left resonance ring
  const leftRingDx = nx - (-0.72);
  const leftRingDy = ny - 0;
  const leftRingDist = Math.sqrt(leftRingDx * leftRingDx + leftRingDy * leftRingDy);
  const isLeftRing = leftRingDist >= 0.10 && leftRingDist <= 0.20;

  const isLogoForeground = isOuterRing || isLeftStem || isHeadDot || isLowerArc || isLeftRing;

  if (isMaskable) {
    // Maskable must fill whole canvas with background
    if (isLogoForeground) {
      return [grR, grG, grB, 255];
    }
    return [bgR, bgG, bgB, 255];
  } else {
    // Standard icon: soft rounded squircle background or circular emblem
    const cornerDist = Math.pow(Math.abs(dx) / (width * 0.47), 4) + Math.pow(Math.abs(dy) / (height * 0.47), 4);
    if (isLogoForeground) {
      return [grR, grG, grB, 255];
    }
    if (cornerDist <= 1.0) {
      return [bgR, bgG, bgB, 255];
    }
    return [0, 0, 0, 0]; // Transparent outer padding
  }
}

const publicDir = path.resolve('public');

console.log('Generating PWA icons...');

// 1. 192x192 standard icon
const icon192 = createPNG(192, 192, (x, y, w, h) => renderTulizaanaIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);
console.log('Generated pwa-192x192.png');

// 2. 512x512 standard icon
const icon512 = createPNG(512, 512, (x, y, w, h) => renderTulizaanaIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);
console.log('Generated pwa-512x512.png');

// 3. 512x512 maskable icon with safe zone padding
const maskable512 = createPNG(512, 512, (x, y, w, h) => renderTulizaanaIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), maskable512);
console.log('Generated pwa-maskable-512x512.png');

// 4. 180x180 Apple Touch Icon (solid dark background, standard iOS size)
const appleIcon = createPNG(180, 180, (x, y, w, h) => renderTulizaanaIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('Generated apple-touch-icon.png');

// 5. 64x64 favicon.png
const favicon64 = createPNG(64, 64, (x, y, w, h) => renderTulizaanaIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.png'), favicon64);
console.log('Generated favicon.png');

console.log('All PWA icons successfully generated.');
