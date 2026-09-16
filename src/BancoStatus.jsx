import {useEffect,useState} from 'react';
import {healthGoogleDb,getGoogleDbStatus,onGoogleDbStatus} from './lib/googleDb';

const fmt=v=>v?new Date(v).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'aguardando';
export default function BancoStatus(){
 const [s,setS]=useState(getGoogleDbStatus());
 useEffect(()=>{const off=onGoogleDbStatus(setS);healthGoogleDb().catch(()=>{});const timer=setInterval(()=>healthGoogleDb().catch(()=>{}),60000);return()=>{off();clearInterval(timer)}},[]);
 return <div title={s.error||'Google Sheets operacional'} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'7px 10px',borderRadius:999,background:s.ok?'#e9f8ef':'#fff4e5',border:`1px solid ${s.ok?'#b9e5c8':'#f2d29b'}`,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>
  <span aria-hidden="true">{s.ok?'🟢':'🟡'}</span><span>{s.ok?'Banco conectado':'Contingência Supabase'} · {fmt(s.lastSync)}</span>
 </div>
}
