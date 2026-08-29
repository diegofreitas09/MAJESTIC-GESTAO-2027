import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AuthGate from './AuthGate.jsx';
import AppErrorBoundary from './AppErrorBoundary.jsx';
import './styles.css';
import './gestao-sucesso-catalogo.css';
import './auth-notifications.css';
import './crm-executivo.css';
import './auth.css';

// Remove o service worker legado do Atendimento caso ele ainda esteja controlando o domínio inteiro.
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations().then(regs=>{
    regs.forEach(reg=>{
      const script=reg.active?.scriptURL||reg.waiting?.scriptURL||reg.installing?.scriptURL||'';
      if(script.includes('/sw-equipe.js'))reg.unregister().catch(()=>{});
    });
  }).catch(()=>{});
}
if('caches' in window)caches.delete('majestic-atendimento-v1').catch(()=>{});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthGate appName="Majestic Executivo 2027" allowedRoles={['direcao']}>
        {()=> <App/>}
      </AuthGate>
    </AppErrorBoundary>
  </React.StrictMode>,
);