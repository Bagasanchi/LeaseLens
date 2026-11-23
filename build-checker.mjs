import './build-vercel.mjs';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
await mkdir('public/checker',{recursive:true});
const html=(await readFile('vercel-output/index.html','utf8')).replace('src="/supabase.js"','src="/checker/supabase.js"');
await writeFile('public/checker/index.html',html);
if(process.env.SUPABASE_URL) await copyFile('vercel-output/supabase.js','public/checker/supabase.js');
