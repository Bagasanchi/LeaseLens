import { NextResponse } from "next/server";

/**
 * Placeholder QPay QR endpoint.
 * Returns a deterministic SVG QR placeholder for the invoice.
 * Replace with a real QPay invoice request that returns the bank's QR payload.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;

  const size = 240;
  const cells = 21;
  const cell = size / cells;

  // Deterministic pseudo-random pattern seeded by the invoice id
  let seed = 0;
  for (let i = 0; i < invoiceId.length; i++) {
    seed = (seed * 31 + invoiceId.charCodeAt(i)) >>> 0;
  }

  let rects = "";
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const on = (seed >>> 16) & 1;
      if (on) {
        rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="#111827"/>`;
      }
    }
  }

  // Finder patterns (3 corners)
  const finder = (ox: number, oy: number) =>
    `<rect x="${ox}" y="${oy}" width="${cell * 7}" height="${cell * 7}" fill="#111827"/>` +
    `<rect x="${ox + cell}" y="${oy + cell}" width="${cell * 5}" height="${cell * 5}" fill="#fff"/>` +
    `<rect x="${ox + cell * 2}" y="${oy + cell * 2}" width="${cell * 3}" height="${cell * 3}" fill="#111827"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#fff"/>
  ${finder(0, 0)}
  ${finder(size - cell * 7, 0)}
  ${finder(0, size - cell * 7)}
  ${rects}
  <rect x="${cell * 8}" y="${cell * 8}" width="${cell * 5}" height="${cell * 5}" fill="#2563eb"/>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}
