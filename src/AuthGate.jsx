import { useEffect, useState } from 'react';
import { LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from './lib/supabase';
import majesticLogo from '../majestic-logo.png';

const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));

export default function AuthGate({children, allowedRoles=[], appName='Majestic Gestão 2027'}){
  const [session,setSession]=useState(null);
  const [profile,setProfile]=useState(null);
  const [loading,setLoading]=useState(true);
  const [email,setEmail]=useState('');
  const [senha,setSenha]=useState('');
  const [erro,setErro]=useState('');

  async function carregarPerfil(sess){
    if(!sess?.user){setProfile(null);return null}
    try{
      const consulta = supabase
        .from('profiles')
        .select('id,nome,email,role,ativo')
        .eq('id',sess.user.id)
        .maybeSingle();

      const timeout = sleep(10000).then(()=>({data:null,error:{message:'timeout'}}));
      const {data,error}=await Promise.race([consulta,timeout]);

      if(error||!data){
        setProfile(null);
        setErro(error?.message==='timeout'
          ? 'A conexão com o banco demorou mais que o esperado. Tente novamente.'
          : 'Usuário autenticado, mas o perfil não foi encontrado no sistema.');
        return null;
      }

      setProfile(data);
      setErro('');
      return data;
    }catch{
      setProfile(null);
      setErro('Não foi possível carregar seu perfil.');
      return null;
    }
  }

  useEffect(()=>{
    let mounted=true;
    let seq=0;

    async function aplicarSessao(next){
      const minhaSeq=++seq;
      if(!mounted)return;
      setSession(next||null);
      if(!next){setProfile(null);setLoading(false);return}
      await carregarPerfil(next);
      if(mounted&&minhaSeq===seq)setLoading(false);
    }

    async function bootstrap(){
      setLoading(true);
      try{
        const timeout=sleep(10000).then(()=>({data:{session:null},error:{message:'timeout'}}));
        const resultado=await Promise.race([supabase.auth.getSession(),timeout]);
        if(!mounted)return;
        if(resultado?.error){
          setErro(resultado.error.message==='timeout'
            ? 'A autenticação demorou mais que o esperado. Recarregue a página.'
            : 'Não foi possível restaurar a sessão.');
          setLoading(false);
          return;
        }
        await aplicarSessao(resultado?.data?.session||null);
      }catch{
        if(mounted){setErro('Não foi possível conectar ao Majestic.');setLoading(false)}
      }
    }

    bootstrap();

    const {data:listener}=supabase.auth.onAuthStateChange((event,next)=>{
      if(!mounted)return;
      // O bootstrap já trata INITIAL_SESSION. Ignorar esse evento evita corrida dupla.
      if(event==='INITIAL_SESSION')return;
      if(event==='SIGNED_OUT'){
        seq++;
        setSession(null);setProfile(null);setLoading(false);setErro('');
        return;
      }
      if(event==='SIGNED_IN'||event==='USER_UPDATED'){
        setLoading(true);
        setTimeout(()=>{if(mounted)aplicarSessao(next)},0);
        return;
      }
      // TOKEN_REFRESHED não precisa bloquear a tela nem consultar o perfil novamente.
      if(event==='TOKEN_REFRESHED'&&next)setSession(next);
    });

    return()=>{
      mounted=false;
      seq++;
      listener?.subscription?.unsubscribe();
    };
  },[]);

  async function entrar(e){
    e.preventDefault();
    setErro('');setLoading(true);
    try{
      const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password:senha});
      if(error){setLoading(false);setErro('E-mail ou senha inválidos.');return}
      setSession(data.session);
      await carregarPerfil(data.session);
      setLoading(false);
    }catch{
      setLoading(false);setErro('Não foi possível entrar agora. Tente novamente.');
    }
  }

  async function sair(){
    setLoading(true);
    try{await supabase.auth.signOut({scope:'local'})}
    catch{}
    finally{setSession(null);setProfile(null);setErro('');setLoading(false)}
  }

  if(loading)return <div className="authScreen"><div className="authCard"><img src={majesticLogo} alt="Majestic"/><p>Conectando ao Majestic...</p></div></div>;

  if(!session)return <div className="authScreen"><form className="authCard" onSubmit={entrar}><img src={majesticLogo} alt="Majestic"/><span>ACESSO SEGURO</span><h1>{appName}</h1><p>Entre com o usuário fornecido pela Direção.</p><label>E-mail<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@majestic.com"/></label><label>Senha<input type="password" autoComplete="current-password" required value={senha} onChange={e=>setSenha(e.target.value)} placeholder="Sua senha"/></label>{erro&&<div className="authError">{erro}</div>}<button className="primary" type="submit"><LogIn size={18}/>Entrar</button></form></div>;

  if(!profile)return <div className="authScreen"><div className="authCard"><img src={majesticLogo} alt="Majestic"/><ShieldCheck size={36}/><h1>Não foi possível carregar o acesso</h1><p>{erro||'O perfil deste usuário não foi localizado.'}</p><button className="primary" onClick={sair}><LogOut size={18}/>Sair e entrar novamente</button></div></div>;

  const permitido=profile?.ativo!==false && (!allowedRoles.length||allowedRoles.includes(profile?.role));
  if(!permitido)return <div className="authScreen"><div className="authCard"><img src={majesticLogo} alt="Majestic"/><ShieldCheck size={36}/><h1>Acesso não autorizado</h1><p>Seu usuário não possui permissão para abrir este aplicativo.</p><button className="primary" onClick={sair}><LogOut size={18}/>Sair</button></div></div>;

  return <>{children({session,user:session.user,profile,logout:sair})}</>;
}
