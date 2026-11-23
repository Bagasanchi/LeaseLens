import fs from 'node:fs';
import crypto from 'node:crypto';
let html=fs.readFileSync('src/index.html','utf8').replace(/\r\n/g,'\n');
const extra=fs.readFileSync('src/library.js','utf8').replace(/\r\n/g,'\n');
html=html.replace('</script>',extra+'\n</script>');

// Extract all inline scripts and generate their hashes
const scriptMatches=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const hashes=scriptMatches.map(match=>{
  const scriptContent=match[1];
  return 'sha256-'+crypto.createHash('sha256').update(scriptContent).digest('base64');
});

// Validate first script can be executed
const js=scriptMatches[0][1];
new Function(js);

// Build the CSP script-src directive with all hashes
const scriptSrc=hashes.map(h=>`'${h}'`).join(' ')+' https://va.vercel-scripts.com';
html=html.replace(/script-src [^;]+/,`script-src ${scriptSrc}`);

const api=fs.readFileSync('src/account.mjs','utf8');
fs.mkdirSync('dist/server',{recursive:true});
fs.writeFileSync('dist/server/index.js',api+'\nconst html='+JSON.stringify(html)+';\nexport default {async fetch(req,env){const path=new URL(req.url).pathname;if(path.startsWith("/api/")){try{return await account(req,env)}catch{return reply({},503)}}if(path!=="/")return new Response(null,{status:404});return new Response(html,{headers:{"Content-Type":"text/html;charset=utf-8","Cache-Control":"private,no-store","Referrer-Policy":"no-referrer"}})}};');
