import { useEffect, useState } from 'react';
import { LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from './lib/supabase';
import majesticLogo from '../majestic-logo.png';

export default function AuthGate({children, allowedRoles=[], appName='Majestic Gestão 2027'}){
  const [session,setSession]=useState(null);
  const [profile,setProfile]=useState(null);
  const [loading,setLoading]=useState(true);
  const [email,setEmail]=useState('');
  const [senha,setSenha]=useState('');
  const [erro,setErro]=useState('');

  async function carregarPerfil(sess){
    if(!sess?.user){setProfile(null);setLoading(false);return}
    try{
      const consulta=supabase.from('profiles').select('id,nome,email,role,ativo').eq('id',sess.user.id).maybeSingle();
      const timeout=new Promise(resolve=>setTimeout(()=>resolve({data:null,error:new Error('timeout')}),8000));
      const {data,error}=await Promise.race([consulta,timeout]);
      if(error||!data){
        setErro(error?.message==='timeout'?'Não foi possível concluir a conexão. Tente sair e entrar novamente.':'Usuário autenticado, mas o perfil não foi encontrado no sistema.');
        setProfile(null);setLoading(false);return;
      }
      setErro('');setProfile(data);setLoading(false);
    }catch{
      setErro('Não foi possível carregar seu perfil.');setProfile(null);setLoading(false);
    }
  }

  useEffect(()=>{
    let ativo=true;
    let timer=null;

    async function iniciar(){
      try{
        const {data,error}=await supabase.auth.getSession();
        if(!ativo)return;
        if(error){setErro('Não foi possível restaurar a sessão.');setLoading(false);return}
        setSession(data.session);
        await carregarPerfil(data.session);
      }catch{
        if(ativo){setErro('Não foi possível conectar ao Majestic.');setLoading(false)}
      }
    }

    iniciar();

    const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>{
      if(!ativo)return;
      setSession(next);
      setLoading(true);
      // Não consulta o banco dentro do callback do Auth: evita disputa do lock interno do Supabase.
      clearTimeout(timer);
      timer=setTimeout(()=>{if(ativo)carregarPerfil(next)},0);
    });

    return()=>{
      ativo=false;
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  },[]);

  async function entrar(e){
    e.preventDefault();setErro('');setLoading(true);
    const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password:senha});
    if(error){setLoading(false);setErro('E-mail ou senha inválidos.');return}
    setSession(data.session);
    await carregarPerfil(data.session);
  }

  async function sair(){
    try{await supabase.auth.signOut()}finally{setSession(null);setProfile(null);setLoading(false)}
  }

  if(loading)return <div className="authScreen"><div className="authCard"><img src={majesticLogo} alt="Majestic"/><p>Conectando ao Majestic...</p></div></div>;

  if(!session)return <div className="authScreen"><form className="authCard" onSubmit={entrar}><img src={majesticLogo} alt="Majestic"/><span>ACESSO SEGURO</span><h1>{appName}</h1><p>Entre com o usuário fornecido pela Direção.</p><label>E-mail<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@majestic.com"/></label><label>Senha<input type="password" autoComplete="current-password" required value={senha} onChange={e=>setSenha(e.target.value)} placeholder="Sua senha"/></label>{erro&&<div className="authError">{erro}</div>}<button className="primary" type="submit"><LogIn size={18}/>Entrar</button></form></div>;

  if(!profile)return <div className="authScreen"><div className="authCard"><img src={majesticLogo} alt="Majestic"/><ShieldCheck size={36}/><h1>Não foi possível carregar o acesso</h1><p>{erro||'O perfil deste usuário não foi localizado.'}</p><button className="primary" onClick={sair}><LogOut size={18}/>Sair e entrar novamente</button></div></div>;

  const permitido=profile?.ativo!==false && (!allowedRoles.length||allowedRoles.includes(profile?.role));
  if(!permitido)return <div className="authScreen"><div className="authCard"><img src={majesticLogo} alt="Majestic"/><ShieldCheck size={36}/><h1>Acesso não autorizado</h1><p>Seu usuário não possui permissão para abrir este aplicativo.</p><button className="primary" onClick={sair}><LogOut size={18}/>Sair</button></div></div>;

  return <>{children({session,user:session.user,profile,logout:sair})}</>;
}
