import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AuthGate from './AuthGate.jsx';
import AppErrorBoundary from './AppErrorBoundary.jsx';
import PdfSolucaoCredit from './PdfSolucaoCredit.jsx';
import BancoStatus from './BancoStatus.jsx';
import { supabase } from './lib/supabase';
import './styles.css';
import './gestao-sucesso-catalogo.css';
import './auth-notifications.css';
import './crm-executivo.css';
import './auth.css';

if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(regs=>{regs.forEach(reg=>{const script=reg.active?.scriptURL||reg.waiting?.scriptURL||reg.installing?.scriptURL||'';if(script.includes('/sw-equipe.js'))reg.unregister().catch(()=>{});});}).catch(()=>{});}
if('caches' in window)caches.delete('majestic-atendimento-v1').catch(()=>{});

function iniciarAlertasDirecao(){
  let audioCtx=null;
  const desbloquearAudio=()=>{try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!audioCtx)audioCtx=new AC();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});}catch{}};
  window.addEventListener('pointerdown',desbloquearAudio,{passive:true});window.addEventListener('keydown',desbloquearAudio,{passive:true});
  const tocar=()=>{try{desbloquearAudio();if(!audioCtx||audioCtx.state!=='running')return;const agora=audioCtx.currentTime;[740,880,1046].forEach((freq,i)=>{const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,agora+i*.16);gain.gain.exponentialRampToValueAtTime(.18,agora+i*.16+.02);gain.gain.exponentialRampToValueAtTime(.0001,agora+i*.16+.14);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(agora+i*.16);osc.stop(agora+i*.16+.15);});}catch{}};
  const toast=r=>{document.querySelector('.directionLiveAlert')?.remove();const el=document.createElement('button');el.type='button';el.className='directionLiveAlert';const obs=String(r?.observacao_solicitacao||'Nova solicitação aguardando decisão.').trim();el.innerHTML=`<span class="directionLiveAlertIcon">🔔</span><span><strong>NOVA AUTORIZAÇÃO</strong><b>${String(r?.aluno||'Aluno')}</b><small>${obs.replace(/[<>]/g,'')}</small></span><em>ABRIR</em>`;el.onclick=()=>{window.location.hash='/gestao-sucesso';el.remove()};document.body.appendChild(el);setTimeout(()=>el.remove(),15000);};
  supabase.channel('direcao-alerta-sonoro').on('postgres_changes',{event:'INSERT',schema:'public',table:'autorizacoes_gestao'},payload=>{const r=payload.new||{};tocar();toast(r);document.title='🔔 NOVA AUTORIZAÇÃO • Majestic 2027';setTimeout(()=>{document.title='Majestic Gestão 2027'},12000);if('Notification' in window&&Notification.permission==='granted'){try{new Notification('Majestic • Nova autorização',{body:`${r.aluno||'Aluno'} — ${r.observacao_solicitacao||'Solicitação aguardando decisão.'}`})}catch{}}}).subscribe();
}
iniciarAlertasDirecao();
const StatusFlutuante=()=> <div style={{position:'fixed',right:14,bottom:14,zIndex:9998}}><BancoStatus/></div>;
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><AppErrorBoundary><AuthGate appName="Majestic Executivo 2027" allowedRoles={['direcao']}>{()=> <App/>}</AuthGate></AppErrorBoundary><StatusFlutuante/><PdfSolucaoCredit /></React.StrictMode>);