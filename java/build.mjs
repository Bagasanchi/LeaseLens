import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const dir = 'java-output';
fs.mkdirSync(dir, {recursive:true});
execFileSync('javac',['--release','21','-encoding','UTF-8','-d',dir,'java/LeaseRules.java','java/LeaseServer.java','java/ReviewDemo.java','java/DemoAccounts.java','java/LocalLibrary.java'],{stdio:'inherit'});
let page = fs.readFileSync('src/index.html','utf8').replace(/\r\n/g,'\n');
function edit(before, after) {
  if (!page.includes(before)) throw Error('Java UI integration needs updating: '+before);
  page = page.replace(before, () => after);
}
edit("el('form').onsubmit=e=>","el('form').onsubmit=async e=>");
edit("const matches=evidence(p,s);","let result;try{result=await javaRules(p,s,'')}catch{el('error').textContent=javaFailure();return}if(p!==el('promise').value.trim()||s!==el('lease').value.trim())return;const matches=result.matches;");
edit("el('compare').onclick=()=>","el('compare').onclick=async ()=>");
edit("const add=difference(b,a),remove=difference(a,b);","const original=el('lease').value,revised=el('revised').value;let result;try{result=await javaRules('',original,revised)}catch{line(d,'p',javaFailure());return}if(original!==el('lease').value||revised!==el('revised').value)return;d.replaceChildren();const add=result.added,remove=result.removed;");
edit("a.join('\\n')===b.join('\\n')","result.sameOrder");
page=page.replace(/^const topics=.*$|^function evidence\(.*$|^function difference\(.*$/gm,'');
page=page.replaceAll('Text stays in this tab unless you save it to your account.', 'The Java server checks your text. Saving adds a copy to your account.').replace(/Дансандаа хадгалаагүй текст зөвхөн энэ цонхонд үлдэнэ\./g,'Java сервер текстийг шалгана. Хадгалбал таны бүртгэлд хуулбар үүснэ.');
const bridge = [
  'async function javaRules(promise,lease,revised){const response=await fetch("/api/rules",{method:"POST",body:new URLSearchParams({promise,lease,revised})});if(!response.ok)throw Error();return response.json()}',
  'function javaFailure(){return root.lang==="mn"?"Java сервертэй холбогдож чадсангүй.":"Could not reach the Java checker."}',
].join('\n');
edit('</script></html>',bridge+'\n'+fs.readFileSync('java/library.js','utf8')+'\n</script></html>');
page=page.replace(/\r\n/g,'\n');
const script=page.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(script);
page=page.replace(/sha256-[\w+/=]+/,'sha256-'+crypto.createHash('sha256').update(script).digest('base64'));
fs.writeFileSync(dir+'/index.html',page);
