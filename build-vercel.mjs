import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// The checker runs locally. Account routes require a trusted identity backend.
const template = await readFile('src/index.html', 'utf8');
const html = template.replace(/\r\n/g, '\n');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const hash = createHash('sha256').update(script).digest('base64');
const page = html.replace(/sha256-[\w+/=]+/, 'sha256-' + hash);
await mkdir('vercel-output', { recursive: true });
await writeFile('vercel-output/index.html', page);
