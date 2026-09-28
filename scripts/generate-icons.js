const fs = require('fs');
const path = require('path');

// Simple valid 192x192 / 512x512 PNG generator without external dependencies
// Generates a base64 encoded blue square with white circle center as PNG
// Minimal valid PNG buffer
const minimalPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAAB/Pny7AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMAUExURQAlY/..." ;

// We can create a simple PNG using pure JS zlib and crc32 or write valid PNG chunks
const zlib = require('zlib');

function createPng(width, height) {
  // RGBA buffer: fill with blue (#2563eb) and center white mark
  const rowSize = width * 4 + 1; // 1 filter byte per scanline
  const uncompressed = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.35;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    uncompressed[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < r && dist > r - 12) {
        // white ring
        uncompressed[pxOffset] = 255;
        uncompressed[pxOffset + 1] = 255;
        uncompressed[pxOffset + 2] = 255;
        uncompressed[pxOffset + 3] = 255;
      } else if (dist < r * 0.4) {
        // cyan center
        uncompressed[pxOffset] = 56;
        uncompressed[pxOffset + 1] = 189;
        uncompressed[pxOffset + 2] = 248;
        uncompressed[pxOffset + 3] = 255;
      } else {
        // primary brand blue
        uncompressed[pxOffset] = 37;
        uncompressed[pxOffset + 1] = 99;
        uncompressed[pxOffset + 2] = 235;
        uncompressed[pxOffset + 3] = 255;
      }
    }
  }

  const idatData = zlib.deflateSync(uncompressed);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const combined = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, combined, crc]);
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      t[i] = c;
    }
    return t;
  })();

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), createPng(512, 512));
console.log('PWA icons created successfully.');
