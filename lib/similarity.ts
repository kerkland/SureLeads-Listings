import sharp from 'sharp';
import https from 'https';
import http from 'http';

// ─── Address Normalisation ────────────────────────────────────────────────────

const ABBR: Record<string, string> = {
  street: 'st',
  road: 'rd',
  avenue: 'ave',
  close: 'cl',
  crescent: 'cres',
  drive: 'dr',
  lane: 'ln',
  boulevard: 'blvd',
  court: 'ct',
  place: 'pl',
};

export function normaliseAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // strip punctuation
    .replace(/\bno\.?\s*#?\s*/i, '') // strip leading No. or #
    .replace(/\b(\w+)\b/g, (word) => ABBR[word] ?? word) // abbreviate
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

// ─── Levenshtein Distance ─────────────────────────────────────────────────────

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

export function addressSimilarity(a: string, b: string): number {
  const na = normaliseAddress(a);
  const nb = normaliseAddress(b);
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(na, nb) / maxLen;
}

// ─── Perceptual Hash (pHash) ──────────────────────────────────────────────────

/**
 * Compute a 64-bit perceptual hash as a binary string.
 * Uses 8x8 DCT of a 32x32 greyscale image.
 */
export async function computePhash(imageBuffer: Buffer): Promise<string> {
  // Resize to 32x32 greyscale
  const raw = await sharp(imageBuffer)
    .resize(32, 32, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer();

  const pixels: number[][] = [];
  for (let y = 0; y < 32; y++) {
    pixels.push([]);
    for (let x = 0; x < 32; x++) {
      pixels[y].push(raw[y * 32 + x]);
    }
  }

  // Compute 8x8 DCT (top-left corner of full 32x32 DCT)
  const dct: number[][] = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      let sum = 0;
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          sum +=
            pixels[y][x] *
            Math.cos(((2 * x + 1) * u * Math.PI) / 64) *
            Math.cos(((2 * y + 1) * v * Math.PI) / 64);
        }
      }
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      dct[u][v] = (cu * cv * sum) / 16;
    }
  }

  // Compute mean (excluding DC component at 0,0)
  const values: number[] = [];
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      if (u === 0 && v === 0) continue;
      values.push(dct[u][v]);
    }
  }
  const mean = values.reduce((s, v) => s + v, 0) / values.length;

  // Build 64-bit binary string
  let hash = '';
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      hash += dct[u][v] >= mean ? '1' : '0';
    }
  }

  return hash;
}

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) throw new Error('Hash length mismatch');
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

/**
 * Download image from URL and return a Buffer.
 */
export function fetchImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
  });
}
