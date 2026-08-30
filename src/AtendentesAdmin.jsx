import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, UserCheck, UserX, Users } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function AtendentesAdmin(){
  const [lista,setLista]=useState([]);
  const [nome,setNome]=useState('');
  const [aviso,setAviso]=useState('');
  const [salvando,setSalvando]=useState(false);

  async function carregar(){
    const {data,error}=await supabase.from('atendentes').select('*').order('ordem',{ascending:true}).order('nome',{ascending:true});
    if(error){setAviso(error.message);return}
    setLista(data||[]);
  }

  useEffect(()=>{
    carregar();
    const canal=supabase.channel('majestic-atendentes-admin').on('postgres_changes',{event:'*',schema:'public',table:'atendentes'},carregar).subscribe();
    return()=>supabase.removeChannel(canal);
  },[]);

  async function adicionar(e){
    e.preventDefault();
    const n=nome.trim();
    if(!n)return;
    setSalvando(true);setAviso('');
    const {error}=await supabase.from('atendentes').insert({nome:n,ativo:true,ordem:lista.length+1});
    setSalvando(false);
    if(error){setAviso(error.code==='23505'?'Esse nome já está cadastrado.':error.message);return}
    setNome('');setAviso('Atendente cadastrado. Já está disponível no App da Gestão.');
    await carregar();
  }

  async function alternar(item){
    const {error}=await supabase.from('atendentes').update({ativo:!item.ativo,atualizado_em:new Date().toISOString()}).eq('id',item.id);
    if(error){setAviso(error.message);return}
    setAviso(item.ativo?'Atendente desativado. O histórico anterior foi preservado.':'Atendente reativado.');
    await carregar();
  }

  const ativos=useMemo(()=>lista.filter(x=>x.ativo).length,[lista]);

  return <section className="panel modulePage" style={{padding:24}}>
    <div className="panelHead" style={{alignItems:'flex-start',gap:16}}>
      <div><p className="eyebrow">EQUIPE OPERACIONAL</p><h3 style={{fontSize:22,margin:'4px 0'}}>Atendentes responsáveis</h3><p>Cadastre os nomes que poderão ser selecionados no início de cada atendimento.</p></div>
      <button className="icon" type="button" onClick={carregar} title="Atualizar"><RefreshCw size={19}/></button>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,margin:'20px 0'}}>
      <article style={{padding:18,border:'1px solid #e5edf8',borderRadius:16,background:'#f8fbff'}}><Users size={20}/><small style={{display:'block',marginTop:8}}>Cadastrados</small><strong style={{fontSize:26}}>{lista.length}</strong></article>
      <article style={{padding:18,border:'1px solid #e5edf8',borderRadius:16,background:'#f8fbff'}}><UserCheck size={20}/><small style={{display:'block',marginTop:8}}>Ativos no atendimento</small><strong style={{fontSize:26}}>{ativos}</strong></article>
    </div>

    <form onSubmit={adicionar} style={{display:'flex',gap:10,flexWrap:'wrap',padding:16,border:'1px solid #dbe7f6',borderRadius:16,background:'#fff'}}>
      <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome da atendente" style={{flex:'1 1 280px',minHeight:44,border:'1px solid #cbd9ea',borderRadius:10,padding:'0 12px'}}/>
      <button className="primary" type="submit" disabled={salvando}><Plus size={18}/>{salvando?'Salvando...':'Adicionar atendente'}</button>
    </form>

    {aviso&&<div className="alerta" style={{marginTop:14}}>{aviso}</div>}

    <div style={{marginTop:18,display:'grid',gap:10}}>
      {lista.map(item=><article key={item.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,padding:'14px 16px',border:'1px solid #e4ebf4',borderRadius:14,background:'#fff'}}>
        <div><strong style={{display:'block'}}>{item.nome}</strong><small>{item.ativo?'Disponível para novos atendimentos':'Desativado • permanece no histórico'}</small></div>
        <button type="button" onClick={()=>alternar(item)} style={{border:0,borderRadius:10,padding:'10px 14px',fontWeight:700,cursor:'pointer',background:item.ativo?'#fff0f1':'#eaf8f1',color:item.ativo?'#b42336':'#087a4b',display:'flex',alignItems:'center',gap:7}}>{item.ativo?<><UserX size={17}/>Desativar</>:<><UserCheck size={17}/>Ativar</>}</button>
      </article>)}
      {!lista.length&&<div className="empty">Nenhum atendente cadastrado. Adicione o primeiro nome acima.</div>}
    </div>
  </section>;
}
