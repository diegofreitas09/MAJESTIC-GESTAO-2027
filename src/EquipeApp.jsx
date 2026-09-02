import { useEffect, useState } from 'react';
import { Download, Handshake, LogOut, Smartphone, Users } from 'lucide-react';
import AtendimentoCRM from './AtendimentoCRM';
import GestaoSucesso from './GestaoSucesso';
import TabelaComercialEquipe2027 from './TabelaComercialEquipe2027';
import majesticLogo from '../majestic-logo.png';

export default function EquipeApp({profile,logout}){
  const [installPrompt,setInstallPrompt]=useState(null);
  const [iosHint,setIosHint]=useState(false);
  const [aba,setAba]=useState('atendimento');
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;

  useEffect(()=>{
    const onPrompt=e=>{e.preventDefault();setInstallPrompt(e)};
    window.addEventListener('beforeinstallprompt',onPrompt);
    if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(regs=>{regs.forEach(reg=>{const script=reg.active?.scriptURL||reg.waiting?.scriptURL||reg.installing?.scriptURL||'';if(script.includes('/sw-equipe.js'))reg.unregister().catch(()=>{})})}).catch(()=>{})}
    if('caches' in window)caches.delete('majestic-atendimento-v1').catch(()=>{});
    return()=>window.removeEventListener('beforeinstallprompt',onPrompt);
  },[]);

  async function instalar(){if(standalone)return;if(installPrompt){installPrompt.prompt();await installPrompt.userChoice.catch(()=>null);setInstallPrompt(null);return}setIosHint(true)}

  return <div className="equipeApp equipeOnly">
    <header className="equipeHeader"><div className="equipeBrand"><img src={majesticLogo} alt="Majestic"/><div><span>APP DE ATENDIMENTO</span><h1>Majestic Atendimento 2027</h1><p>{profile?.nome||'Equipe'} • Gestão de Sucesso</p></div></div><div className="equipeHeaderActions">{!standalone&&<button className="primary equipeInstall" onClick={instalar}>{isIOS?<Smartphone size={18}/>:<Download size={18}/>}Instalar no celular</button>}<button className="equipeLogout" onClick={logout} title="Sair"><LogOut size={18}/></button></div></header>
    {iosHint&&<div className="installHint">{isIOS?'No iPhone/iPad: toque em Compartilhar e depois em “Adicionar à Tela de Início”.':'No Android: abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.'}</div>}
    <nav className="equipeTabs"><button className={aba==='atendimento'?'active':''} onClick={()=>setAba('atendimento')}><Users size={18}/>Atendimento</button><button className={aba==='comercial'?'active':''} onClick={()=>setAba('comercial')}><Handshake size={18}/>Valores e autorizações</button></nav>
    <main className="equipeMain">{aba==='atendimento'?<AtendimentoCRM profile={profile}/>:<><TabelaComercialEquipe2027/><GestaoSucesso initialMode="gestao" lockMode/></>}</main>
  </div>
}
