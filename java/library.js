(()=>{
 const tr=(en,mn)=>root.lang==='mn'?mn:en;
 const main=document.querySelector('main'), nav=document.createElement('nav'),panel=document.createElement('dialog'),body=document.createElement('section');panel.className='library-dialog card';main.prepend(nav);document.body.append(panel);panel.append(body);
 function btn(parent,title,fn){const b=document.createElement('button');b.type='button';b.textContent=title;parent.append(b);b.onclick=async()=>{b.disabled=true;try{await fn()}catch{alert(tr('Request failed. Try again.','Дахин оролдоно уу.'))}finally{b.disabled=false}};return b}
 function link(parent,label,url){const a=document.createElement('a');a.href=url;a.textContent=label;parent.append(a,document.createTextNode(' · '));return a}
 async function show(save){
  body.replaceChildren();if(!panel.open)panel.showModal();btn(body,tr('Close','Хаах'),()=>panel.close());
  const response=await fetch('/library/');
  if(response.status===401){const a=link(body,tr('Sign in or create account','Нэвтрэх / бүртгүүлэх'),'/demo/login');a.target='_blank';a.rel='noopener';btn(body,tr('Continue after sign-in','Нэвтэрсний дараа үргэлжлүүлэх'),()=>show(save));return}
  if(!response.ok)throw Error();
  if(save){const draft=new URLSearchParams(['promise','lease','revised'].map(k=>[k,el(k).value]));if(!(await fetch('/library/',{method:'POST',body:draft})).ok)throw Error();return show(false)}
  const rows=await response.json();line(body,'h2',tr('My library','Миний сан'));
  if(!rows.length)line(body,'p',tr('No saved comparisons yet.','Хадгалсан харьцуулалт байхгүй.'));
  for(const row of rows){const box=document.createElement('div');body.append(box);line(box,'strong',row.title);const url='/library/'+row.id;
   btn(box,tr('Open','Нээх'),async()=>{if(['promise','lease','revised'].some(k=>el(k).value)&&!confirm(tr('Replace current draft?','Одоогийн нооргийг солих уу?')))return;const r=await fetch(url);if(!r.ok)throw Error();const data=await r.json();for(const k of ['promise','lease','revised'])el(k).value=data[k];panel.close();el('form').requestSubmit();if(data.revised){el('revised').closest('details').open=true;el('compare').click()}});
   btn(box,tr('Delete','Устгах'),async()=>{if(confirm(tr('Delete comparison?','Устгах уу?'))){if(!(await fetch(url,{method:'DELETE'})).ok)throw Error();await show(false)}})}
 }
 const save=btn(el('report'),'',()=>show(true));
 function labels(){nav.replaceChildren();link(nav,tr('Account / profile','Бүртгэл / профайл'),'/demo/profile');link(nav,tr('Contract review','Гэрээний хяналт'),'/demo');btn(nav,tr('My library','Миний сан'),()=>show(false));save.textContent=tr('Save comparison','Харьцуулалт хадгалах')}
 language.addEventListener('change',labels);labels();
})();