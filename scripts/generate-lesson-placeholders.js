// Generates solid dark-navy (#14132B) placeholder PNGs for each lesson
// illustration. Run once with: node scripts/generate-lesson-placeholders.js
// Replace the output files with Gemini-generated art later — same filenames.
'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function solidColorPNG(width, height, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB truecolor
  ihdr[10] = 0; // compression: deflate
  ihdr[11] = 0; // filter: adaptive
  ihdr[12] = 0; // interlace: none

  // One raw row: filter byte (0 = None) + RGB pixels
  const row = Buffer.alloc(1 + width * 3);
  row[0] = 0;
  for (let x = 0; x < width; x++) {
    row[1 + x * 3] = r;
    row[1 + x * 3 + 1] = g;
    row[1 + x * 3 + 2] = b;
  }
  const rows = [];
  for (let y = 0; y < height; y++) rows.push(row);
  const compressed = zlib.deflateSync(Buffer.concat(rows));

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'assets', 'lessons');
fs.mkdirSync(outDir, { recursive: true });

// Dark navy #14132B = rgb(20, 19, 43)
const [R, G, B] = [20, 19, 43];
const WIDTH = 600;
const HEIGHT = 400;

const images = [
  'linear-slope-triangle',
  'quadratics-parabola-roots-vertex',
  'ratios-percent-bar-model',
  'stats-bell-curve-sd',
  'geometry-pythagorean-squares',
  'trig-soh-cah-toa-triangle',
  'grammar-subject-verb-bracket',
  'reading-context-clue-focus',
];

for (const name of images) {
  const filePath = path.join(outDir, `${name}.png`);
  fs.writeFileSync(filePath, solidColorPNG(WIDTH, HEIGHT, R, G, B));
  console.log(`Created ${name}.png (${WIDTH}×${HEIGHT}, #14132B)`);
}
console.log(`\nDone — ${images.length} placeholders in assets/lessons/`);
