const reply = (value, status=200) => Response.json(value,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function account(request, env) {
  const user=request.headers.get('oai-authenticated-user-id');
  if(!user) return reply({},401);
  const path=new URL(request.url);
  const root='members/'+encodeURIComponent(user)+'/';
  const write=['POST','DELETE'].includes(request.method);
  if(write && request.headers.get('Origin')!==path.origin) return reply({},403);
  const vault=env.BUCKET;
  if(!vault) return reply({},503);
  if(path.pathname==='/api/library' && request.method==='GET'){
    const records=await Promise.all(['comparisons','purchases'].map(async group=>{
      const items=[];
      let cursor;
      do {
        const page=await vault.list({prefix:root+group+'/',cursor,include:['customMetadata']});
        for(const obj of page.objects) items.push({id:obj.key.split('/').pop(),date:obj.uploaded,title:obj.customMetadata?.title||''});
        cursor=page.truncated?page.cursor:undefined;
      } while(cursor);
      return items.sort((a,b)=>b.date-a.date);
    }));
    return reply({comparisons:records[0],purchases:records[1]});
  }
  if(path.pathname==='/api/comparisons' && request.method==='POST'){
    if(!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({},415);
    const reader=request.body?.getReader();
    if(!reader) return reply({},400);
    let bytes=0, raw='';
    const decoder=new TextDecoder();
    while(true){
      const {done,value}=await reader.read();
      if(done) break;
      bytes+=value.length;
      if(bytes>480000){await reader.cancel();return reply({},413)}
      raw+=decoder.decode(value,{stream:true});
    }
    let data;
    try{data=JSON.parse(raw+decoder.decode())}catch{return reply({},400)}
    if(!data||['promise','lease','revised'].some(k=>typeof data[k]!=='string')||!data.promise.trim()||!data.lease.trim()||data.promise.length>1500||data.lease.length>50000||data.revised.length>50000)return reply({},400);
    const id=crypto.randomUUID();
    await vault.put(root+'comparisons/'+id,JSON.stringify({promise:data.promise,lease:data.lease,revised:data.revised}),{customMetadata:{title:data.promise.slice(0,80)}});
    return reply({id},201);
  }
  const match=path.pathname.match(/^\/api\/(comparisons|purchases)\/([a-zA-Z0-9_-]{1,100})$/);
  if(!match)return reply({},404);
  const key=root+match[1]+'/'+match[2];
  if(request.method==='DELETE' && match[1]==='comparisons'){await vault.delete(key);return reply({})}
  if(request.method!=='GET')return reply({},405);
  const obj=await vault.get(key);
  if(!obj)return reply({},404);
  if(match[1]==='comparisons')return reply(await obj.json());
  return new Response(obj.body,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="LeaseLens-pack.pdf"','X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'}});
}
