import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const sizes = [16, 32, 48, 96, 128];
const outDir = join(process.cwd(), "public", "icon");

function drawIcon(size) {
  const scale = 4;
  const width = size * scale;
  const height = size * scale;
  const pixels = new Uint8Array(width * height * 4);

  const n = width;
  fillRoundedGradient(pixels, width, height, 0, 0, n, n, n * 0.21, [13, 71, 83, 255], [15, 23, 42, 255]);
  fillCircle(pixels, width, height, n * 0.20, n * 0.18, n * 0.34, [45, 212, 191, 42]);
  fillCircle(pixels, width, height, n * 0.86, n * 0.82, n * 0.38, [56, 189, 248, 35]);

  fillRoundedRect(pixels, width, height, n * 0.265, n * 0.18, n * 0.715, n * 0.82, n * 0.055, [12, 30, 54, 82]);
  fillRoundedRect(pixels, width, height, n * 0.245, n * 0.155, n * 0.695, n * 0.795, n * 0.055, [248, 253, 255, 255]);
  fillPolygon(pixels, width, height, [
    [n * 0.57, n * 0.155],
    [n * 0.695, n * 0.155],
    [n * 0.695, n * 0.28]
  ], [195, 246, 242, 255]);
  strokeLine(pixels, width, height, n * 0.57, n * 0.157, n * 0.693, n * 0.28, n * 0.018, [64, 148, 163, 180]);

  fillRoundedRect(pixels, width, height, n * 0.34, n * 0.34, n * 0.59, n * 0.375, n * 0.018, [17, 94, 89, 230]);
  fillRoundedRect(pixels, width, height, n * 0.34, n * 0.455, n * 0.62, n * 0.49, n * 0.018, [14, 116, 144, 205]);
  fillRoundedRect(pixels, width, height, n * 0.34, n * 0.57, n * 0.51, n * 0.605, n * 0.018, [14, 116, 144, 185]);

  fillCircle(pixels, width, height, n * 0.65, n * 0.66, n * 0.205, [15, 23, 42, 255]);
  fillCircle(pixels, width, height, n * 0.65, n * 0.66, n * 0.155, [45, 212, 191, 255]);
  fillCircle(pixels, width, height, n * 0.65, n * 0.66, n * 0.087, [248, 253, 255, 255]);
  strokeLine(pixels, width, height, n * 0.755, n * 0.765, n * 0.84, n * 0.85, n * 0.055, [15, 23, 42, 255]);
  strokeLine(pixels, width, height, n * 0.55, n * 0.665, n * 0.615, n * 0.725, n * 0.035, [15, 23, 42, 230]);
  strokeLine(pixels, width, height, n * 0.615, n * 0.725, n * 0.755, n * 0.565, n * 0.035, [15, 23, 42, 230]);

  return downsample({ pixels, width, height, scale, size });
}

function fillRoundedGradient(pixels, width, height, x0, y0, x1, y1, radius, start, end) {
  const minX = Math.max(0, Math.floor(x0));
  const maxX = Math.min(width, Math.ceil(x1));
  const minY = Math.max(0, Math.floor(y0));
  const maxY = Math.min(height, Math.ceil(y1));

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      if (!inRoundedRect(x + 0.5, y + 0.5, x0, y0, x1, y1, radius)) continue;
      const t = clamp((x + y) / (width + height), 0, 1);
      blend(pixels, width, x, y, [
        Math.round(start[0] + (end[0] - start[0]) * t),
        Math.round(start[1] + (end[1] - start[1]) * t),
        Math.round(start[2] + (end[2] - start[2]) * t),
        255
      ]);
    }
  }
}

function fillRoundedRect(pixels, width, height, x0, y0, x1, y1, radius, color) {
  const minX = Math.max(0, Math.floor(x0));
  const maxX = Math.min(width, Math.ceil(x1));
  const minY = Math.max(0, Math.floor(y0));
  const maxY = Math.min(height, Math.ceil(y1));

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      if (inRoundedRect(x + 0.5, y + 0.5, x0, y0, x1, y1, radius)) {
        blend(pixels, width, x, y, color);
      }
    }
  }
}

function inRoundedRect(x, y, x0, y0, x1, y1, radius) {
  const cx = x < x0 + radius ? x0 + radius : x > x1 - radius ? x1 - radius : x;
  const cy = y < y0 + radius ? y0 + radius : y > y1 - radius ? y1 - radius : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function fillCircle(pixels, width, height, cx, cy, radius, color) {
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(width, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(height, Math.ceil(cy + radius));
  const r2 = radius * radius;

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r2) {
        blend(pixels, width, x, y, color);
      }
    }
  }
}

function fillPolygon(pixels, width, height, points, color) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.max(0, Math.floor(Math.min(...xs)));
  const maxX = Math.min(width, Math.ceil(Math.max(...xs)));
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(height, Math.ceil(Math.max(...ys)));

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      if (inPolygon(x + 0.5, y + 0.5, points)) {
        blend(pixels, width, x, y, color);
      }
    }
  }
}

function inPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function strokeLine(pixels, width, height, x0, y0, x1, y1, strokeWidth, color) {
  const radius = strokeWidth / 2;
  const minX = Math.max(0, Math.floor(Math.min(x0, x1) - radius));
  const maxX = Math.min(width, Math.ceil(Math.max(x0, x1) + radius));
  const minY = Math.max(0, Math.floor(Math.min(y0, y1) - radius));
  const maxY = Math.min(height, Math.ceil(Math.max(y0, y1) + radius));

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      if (distanceToSegment(x + 0.5, y + 0.5, x0, y0, x1, y1) <= radius) {
        blend(pixels, width, x, y, color);
      }
    }
  }
}

function distanceToSegment(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const length2 = dx * dx + dy * dy;
  if (length2 === 0) return Math.hypot(px - x0, py - y0);
  const t = clamp(((px - x0) * dx + (py - y0) * dy) / length2, 0, 1);
  return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
}

function blend(pixels, width, x, y, color) {
  const index = (y * width + x) * 4;
  const alpha = color[3] / 255;
  const inverse = 1 - alpha;
  pixels[index] = Math.round(color[0] * alpha + pixels[index] * inverse);
  pixels[index + 1] = Math.round(color[1] * alpha + pixels[index + 1] * inverse);
  pixels[index + 2] = Math.round(color[2] * alpha + pixels[index + 2] * inverse);
  pixels[index + 3] = Math.round(255 * (alpha + (pixels[index + 3] / 255) * inverse));
}

function downsample({ pixels, width, height, scale, size }) {
  const output = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let yy = 0; yy < scale; yy++) {
        for (let xx = 0; xx < scale; xx++) {
          const index = ((y * scale + yy) * width + x * scale + xx) * 4;
          r += pixels[index];
          g += pixels[index + 1];
          b += pixels[index + 2];
          a += pixels[index + 3];
        }
      }

      const count = scale * scale;
      const out = (y * size + x) * 4;
      output[out] = Math.round(r / count);
      output[out + 1] = Math.round(g / count);
      output[out + 2] = Math.round(b / count);
      output[out + 3] = Math.round(a / count);
    }
  }

  return { width: size, height: size, pixels: output };
}

function encodePng({ width, height, pixels }) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const raw = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    Buffer.from(pixels.subarray(y * width * 4, (y + 1) * width * 4)).copy(raw, rowStart + 1);
  }

  return Buffer.concat([
    header,
    chunk("IHDR", Buffer.concat([uint32(width), uint32(height), Buffer.from([8, 6, 0, 0, 0])])),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const body = Buffer.concat([typeBuffer, data]);
  return Buffer.concat([uint32(data.length), body, uint32(crc32(body))]);
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let c = index;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  writeFileSync(join(outDir, `${size}.png`), encodePng(drawIcon(size)));
}

console.log(`Generated ${sizes.length} icon files in ${outDir}`);
