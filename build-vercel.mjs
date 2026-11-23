import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// The checker runs locally. Account routes require a trusted identity backend.
const template = await readFile('src/index.html', 'utf8');
const html = template.replace(/\r\n/g, '\n');

// Extract all inline scripts and generate their hashes
const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const hashes = scriptMatches.map(match => {
  const scriptContent = match[1];
  return 'sha256-' + createHash('sha256').update(scriptContent).digest('base64');
});

// Build the CSP script-src directive with all hashes
const scriptSrc = hashes.map(h => `'${h}'`).join(' ') + ' https://va.vercel-scripts.com';

// Update the CSP policy
const page = html.replace(
  /script-src [^;]+/,
  `script-src ${scriptSrc}`
);

await mkdir('vercel-output', { recursive: true });
await writeFile('vercel-output/index.html', page);
