import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import GestaoSucesso from './GestaoSucesso';
import majesticLogo from '../majestic-logo.png';

export default function EquipeApp(){
  const [installPrompt,setInstallPrompt]=useState(null);
  const [iosHint,setIosHint]=useState(false);
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;

  useEffect(()=>{
    const onPrompt=e=>{e.preventDefault();setInstallPrompt(e)};
    window.addEventListener('beforeinstallprompt',onPrompt);
    if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw-equipe.js').catch(()=>{});
    return()=>window.removeEventListener('beforeinstallprompt',onPrompt);
  },[]);

  async function instalar(){
    if(standalone)return;
    if(installPrompt){
      installPrompt.prompt();
      await installPrompt.userChoice.catch(()=>null);
      setInstallPrompt(null);
      return;
    }
    if(isIOS){setIosHint(true);return}
    setIosHint(true);
  }

  return <div className="equipeApp equipeOnly">
    <header className="equipeHeader">
      <div className="equipeBrand"><img src={majesticLogo} alt="Majestic"/><div><span>APP DE ATENDIMENTO</span><h1>Majestic Atendimento 2027</h1><p>Gestão de Sucesso • uso exclusivo da equipe</p></div></div>
      {!standalone&&<button className="primary equipeInstall" onClick={instalar}>{isIOS?<Smartphone size={18}/>:<Download size={18}/>}Instalar no celular</button>}
    </header>
    {iosHint&&<div className="installHint">{isIOS?'No iPhone/iPad: toque em Compartilhar e depois em “Adicionar à Tela de Início”.':'No Android: abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.'}</div>}
    <main className="equipeMain"><GestaoSucesso/></main>
  </div>
}