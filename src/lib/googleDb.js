const API='/api/db';
const TIMEOUT_MS=12000;

let estado={ok:false,lastSync:null,error:null};
const listeners=new Set();
const emitir=()=>listeners.forEach(fn=>fn({...estado}));
const setEstado=patch=>{estado={...estado,...patch};emitir();};

export function getGoogleDbStatus(){return {...estado};}
export function onGoogleDbStatus(fn){listeners.add(fn);fn({...estado});return()=>listeners.delete(fn);}

async function request(path='',options={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try{
    const r=await fetch(`${API}${path}`,{cache:'no-store',...options,signal:controller.signal,headers:{'content-type':'application/json',...(options.headers||{})}});
    const data=await r.json().catch(()=>({ok:false,error:`http_${r.status}`}));
    if(!r.ok||data?.ok===false)throw new Error(data?.error||`http_${r.status}`);
    const now=new Date().toISOString();setEstado({ok:true,lastSync:now,error:null});return data;
  }catch(e){setEstado({ok:false,error:e?.message||'google_db_unavailable'});throw e;}finally{clearTimeout(timer)}
}

export async function healthGoogleDb(){return request('?action=health');}
export async function listGoogle(table,{limit=5000,updatedAfter}={}){
  const q=new URLSearchParams({action:'list',table,limit:String(limit)});if(updatedAfter)q.set('updated_after',updatedAfter);
  const d=await request(`?${q}`);return d.records||[];
}
export async function getGoogle(table,id){const q=new URLSearchParams({action:'get',table,id:String(id)});const d=await request(`?${q}`);return d.record||null;}
export async function changesGoogle(table,since){const q=new URLSearchParams({action:'changes',table});if(since)q.set('since',since);const d=await request(`?${q}`);return d.records||[];}
export async function upsertGoogle(table,record,actor='app'){const d=await request('',{method:'POST',body:JSON.stringify({action:'upsert',table,record,actor})});return d.record;}
export async function deleteGoogle(table,id,actor='app'){const d=await request('',{method:'POST',body:JSON.stringify({action:'delete',table,id,actor})});return d.deleted===true;}
export async function transactionGoogle(operations,actor='app'){return request('',{method:'POST',body:JSON.stringify({action:'transaction',operations,actor})});}

// Migração segura: Supabase continua sendo a gravação primária; Google recebe o espelho.
// Falha no Google nunca bloqueia a operação atual do aplicativo durante a contingência.
export async function mirrorUpsertGoogle(table,record,actor='app'){
  try{return {ok:true,record:await upsertGoogle(table,record,actor)}}catch(error){console.warn('[Majestic Google DB] mirror upsert falhou',table,error);return {ok:false,error};}
}
export async function mirrorDeleteGoogle(table,id,actor='app'){
  try{return {ok:true,deleted:await deleteGoogle(table,id,actor)}}catch(error){console.warn('[Majestic Google DB] mirror delete falhou',table,error);return {ok:false,error};}
}
