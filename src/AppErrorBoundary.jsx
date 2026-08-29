import React from 'react';
import majesticLogo from '../majestic-logo.png';

export default class AppErrorBoundary extends React.Component{
  constructor(props){
    super(props);
    this.state={erro:null};
  }

  static getDerivedStateFromError(erro){
    return {erro};
  }

  componentDidCatch(erro,info){
    console.error('[Majestic] erro de interface',erro,info);
  }

  recarregar=()=>{
    window.location.reload();
  };

  limparERestart=async()=>{
    try{
      if('serviceWorker' in navigator){
        const regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.filter(r=>String(r.active?.scriptURL||'').includes('sw-equipe.js')).map(r=>r.unregister()));
      }
      if('caches' in window){
        const keys=await caches.keys();
        await Promise.all(keys.filter(k=>k.startsWith('majestic-')).map(k=>caches.delete(k)));
      }
    }catch{}
    window.location.reload();
  };

  render(){
    if(!this.state.erro)return this.props.children;
    return <div className="authScreen"><div className="authCard"><img src={majesticLogo} alt="Majestic"/><span>RECUPERAÇÃO DO SISTEMA</span><h1>O aplicativo encontrou um erro</h1><p>A sessão e os dados permanecem protegidos. Recarregue a interface. Se o erro persistir, use a limpeza segura de cache.</p><button className="primary" onClick={this.recarregar}>Recarregar aplicativo</button><button type="button" onClick={this.limparERestart} style={{marginTop:8}}>Limpar cache e reiniciar</button></div></div>;
  }
}
