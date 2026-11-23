import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

let html = (await readFile('src/index.html', 'utf8')).replace(/\r\n/g, '\n');
await mkdir('vercel-output', { recursive: true });
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
if (url && key) {
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url) || !/^sb_publishable_[\w-]+$/.test(key)) {
    throw Error('Invalid public Supabase configuration');
  }
  await copyFile('node_modules/@supabase/supabase-js/dist/umd/supabase.js', 'vercel-output/supabase.js');
  const library = (await readFile('src/vercel-library.js', 'utf8')).replace(/\r\n/g, '\n');
  const init = 'const cloud = window.supabase.createClient(' + JSON.stringify(url) + ',' + JSON.stringify(key) + ');\n';
  html = html.replace('<script>', '<script src="/supabase.js"></script><script>')
    .replace('</script></html>', () => init + library + '\n</script></html>')
    .replace("connect-src 'self'", "connect-src 'self' " + url)
    .replace("script-src ", "script-src 'self' ");
} else if (process.env.VERCEL_ENV === 'production') {
  throw Error('Missing public Supabase configuration');
}
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(script);
const hash = createHash('sha256').update(script).digest('base64');
await writeFile('vercel-output/index.html', html.replace(/sha256-[\w+/=]+/, 'sha256-' + hash));
