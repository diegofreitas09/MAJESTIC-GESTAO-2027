import React from 'react';
import ReactDOM from 'react-dom/client';
import EquipeApp from './EquipeApp.jsx';
import AuthGate from './AuthGate.jsx';
import AppErrorBoundary from './AppErrorBoundary.jsx';
import PdfSolucaoCredit from './PdfSolucaoCredit.jsx';
import BancoStatus from './BancoStatus.jsx';
import './styles.css';
import './gestao-sucesso-catalogo.css';
import './equipe-app.css';
import './atendimento-crm.css';
import './auth.css';

async function limparPwaLegado(){
  try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg=>{
        const script=reg.active?.scriptURL||reg.waiting?.scriptURL||reg.installing?.scriptURL||'';
        return script.includes('/sw-equipe.js') ? reg.unregister().catch(()=>false) : Promise.resolve(false);
      }));
    }
    if('caches' in window){const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('majestic-atendimento')).map(k=>caches.delete(k)));}
  }catch(e){console.warn('Não foi possível limpar o PWA legado do Atendimento.',e);}
}

function StatusFlutuante(){return <div style={{position:'fixed',right:14,bottom:14,zIndex:9998}}><BancoStatus/></div>}
async function iniciar(){
  await limparPwaLegado();
  ReactDOM.createRoot(document.getElementById('root')).render(
    <>
      <AppErrorBoundary><AuthGate appName="Majestic Atendimento 2027" allowedRoles={['gestao','matricula']}>{({profile,logout})=> <EquipeApp profile={profile} logout={logout}/>}</AuthGate></AppErrorBoundary>
      <StatusFlutuante/><PdfSolucaoCredit />
    </>,
  );
}
iniciar();