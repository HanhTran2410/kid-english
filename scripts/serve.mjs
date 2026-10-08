// Server tĩnh nhỏ để chạy thử app trên máy tính: node scripts/serve.mjs [cổng]
// (Trên máy tính, http://localhost được coi là an toàn nên mic vẫn dùng được.)

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'app');
const port = Number(process.argv[2] ?? process.env.PORT ?? 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root)) throw new Error('outside');
    if ((await stat(file).catch(() => null))?.isDirectory()) file = path.join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Không tìm thấy');
  }
}).listen(port, () => console.log(`Mở http://localhost:${port}/`));
