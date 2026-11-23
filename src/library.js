const library=document.createElement('section');
library.className='card';
const dialog=document.createElement('dialog');
dialog.className='library-dialog card';
dialog.setAttribute('aria-labelledby','library-heading');
const closeButton=document.createElement('button');
closeButton.type='button';
closeButton.onclick=()=>dialog.close();
dialog.append(closeButton,library);
document.body.append(dialog);
const libraryButton=document.createElement('button');
const saveButton=document.createElement('button');
for(const button of [libraryButton,saveButton])button.type='button';
document.querySelector('main').append(libraryButton);
el('report').append(saveButton);
let saveView=false;
async function openDialog(save){
 saveView=save;notice.textContent='';records=null;loading=true;failure=false;signedOut=false;
 renderLibrary();dialog.showModal();closeButton.focus();await refreshLibrary();
}
libraryButton.onclick=()=>openDialog(false);
saveButton.onclick=()=>openDialog(true);
const label=(en,mn)=>root.lang==='mn'?mn:en;
let records=null, loading=false, signedOut=false, failure=false;
const notice=document.createElement('p');
notice.setAttribute('role','status');
function action(parent,text,fn){
 const btn=document.createElement('button');btn.type='button';btn.textContent=text;
 btn.onclick=async()=>{btn.disabled=true;try{await fn()}catch{notice.textContent=label('Request failed. Please retry.','Хүсэлт амжилтгүй. Дахин оролдоно уу.')}finally{btn.disabled=false}};
 parent.append(btn);
}
async function api(path,options){
 const res=await fetch('/api/'+path,{...options,cache:'no-store'});
 if(!res.ok)throw Error(String(res.status));
 return res.json();
}
async function refreshLibrary(){
 loading=true;failure=false;
 try{records=await api('library');signedOut=false}catch(err){records=null;signedOut=err.message==='401';failure=!signedOut}
 loading=false;renderLibrary();
}
function renderLibrary(){
 library.replaceChildren();
 libraryButton.textContent=label('Open my library','Миний санг нээх');
 saveButton.textContent=label('Save comparison','Харьцуулалтыг хадгалах');
 closeButton.textContent=label('Close','Хаах');
 const heading=document.createElement('h2');heading.id='library-heading';
 heading.textContent=saveView?saveButton.textContent:label('My library','Миний сан');library.append(heading,notice);
 if(saveView && el('promise').value.trim())line(library,'blockquote',el('promise').value.trim());
 line(library,'p',label('Saving uploads your promise and lease drafts to your account. Use the same ChatGPT account on your other devices.','Хадгалах үед таны тохиролцоо болон гэрээний текст дансанд тань хадгалагдана. Бусад төхөөрөмждөө ижил ChatGPT дансаар нэвтэрнэ үү.'));
 if(signedOut){
 const a=document.createElement('a');a.href='/signin-with-chatgpt?return_to=/';a.target='_top';a.textContent=label('Sign in with ChatGPT','ChatGPT дансаар нэвтрэх');library.append(a);return;
 }
 if(!records){
 action(library,loading?label('Loading…','Ачаалж байна…'):failure?label('Retry loading library','Дахин ачаалах'):label('Open my library','Миний санг нээх'),refreshLibrary);
 if(failure)line(library,'p',label('Your library is unavailable. Try again.','Таны санг нээж чадсангүй. Дахин оролдоно уу.'));
 return;
 }
 if(saveView)action(library,label('Save to my account','Одоогийн харьцуулалтыг хадгалах'),async()=>{
 const data=Object.fromEntries(['promise','lease','revised'].map(k=>[k,el(k).value]));
 if(!data.promise.trim()||!data.lease.trim()){notice.textContent=label('Enter your promise and lease first.','Эхлээд тохиролцоо болон гэрээгээ оруулна уу.');return}
 await api('comparisons',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 saveView=false;await refreshLibrary();notice.textContent=label('Comparison saved.','Харьцуулалт хадгалагдлаа.');
 });
 if(saveView)return;
 line(library,'h3',label('Saved comparisons','Хадгалсан харьцуулалт'));
 if(!records.comparisons.length)line(library,'p',label('No saved comparisons yet.','Хадгалсан харьцуулалт алга.'));
 for(const item of records.comparisons){
 const row=document.createElement('div');library.append(row);line(row,'strong',item.title+' ');
 const path='comparisons/'+encodeURIComponent(item.id);
 action(row,label('Open','Нээх'),async()=>{
 if(['promise','lease','revised'].some(k=>el(k).value)&&!confirm(label('Replace the current draft with this saved comparison?','Одоогийн бичвэрийг хадгалсан харьцуулалтаар солих уу?')))return;
 const data=await api(path);for(const k of ['promise','lease','revised'])el(k).value=data[k];
 el('form').requestSubmit();if(data.revised){document.querySelector('details').open=true;el('compare').click()}dialog.close();document.querySelector('#check').scrollIntoView();
 });
 action(row,label('Delete','Устгах'),async()=>{
 if(confirm(label('Delete this saved comparison from your account?','Хадгалсан харьцуулалтыг данснаасаа устгах уу?'))){await api(path,{method:'DELETE'});await refreshLibrary()}
 });
 }
 line(library,'h3',label('Past purchases','Өмнөх худалдан авалт'));
 if(!records.purchases.length)line(library,'p',label('No purchases on this account. Checkout is coming soon.','Энэ дансанд худалдан авалт алга. Төлбөрийн хэсэг удахгүй нээгдэнэ.'));
 for(const p of records.purchases){
 const a=document.createElement('a');a.href='/api/purchases/'+encodeURIComponent(p.id);a.textContent=(p.title||label('Renter’s pack','Түрээслэгчийн багц'))+' · '+label('Download','Татах');library.append(a);
 }

}
language.addEventListener('change',()=>{notice.textContent='';renderLibrary()});
renderLibrary();
