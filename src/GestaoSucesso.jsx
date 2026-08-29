import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, LockKeyhole, Send, ShieldCheck, XCircle } from 'lucide-react';
import { supabase } from './lib/supabase';

const LOCAL_KEY='majestic_gestao_sucesso';
const STATUS={aguardando:'Aguardando Direção',autorizado:'Autorizado',negado:'Negado',concluido:'Concluído'};
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));

function carregarLocal(){try{return JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]')}catch{return []}}
function salvarLocal(v){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(v))}catch{}}

export default function GestaoSucesso(){
  const [modo,setModo]=useState('gestao');
  const [registros,setRegistros]=useState([]);
  const [aviso,setAviso]=useState('');
  const [form,setForm]=useState({responsavel:'',aluno:'',telefone:'',serie:'',valor_solicitado:'',observacao_solicitacao:''});

  useEffect(()=>{carregar()},[]);

  async function carregar(){
    setAviso('');
    try{
      const {data,error}=await supabase.from('autorizacoes_gestao').select('*').order('created_at',{ascending:false}).limit(500);
      if(error)throw error;
      setRegistros(data||[]);
      salvarLocal(data||[]);
    }catch{
      const local=carregarLocal();
      setRegistros(local);
      setAviso('Modo local ativo. Para sincronizar entre Gestão e Direção, aplique a migration do Supabase.');
    }
  }

  async function persistir(novos, registroAlterado){
    setRegistros(novos);salvarLocal(novos);
    if(!registroAlterado)return;
    try{
      const payload={...registroAlterado};
      const id=payload.id;
      if(String(id).startsWith('local-')){
        delete payload.id;
        const {data,error}=await supabase.from('autorizacoes_gestao').insert(payload).select().single();
        if(!error&&data){const atualizados=novos.map(x=>x.id===id?data:x);setRegistros(atualizados);salvarLocal(atualizados)}
      }else{
        await supabase.from('autorizacoes_gestao').update(payload).eq('id',id);
      }
    }catch{}
  }

  async function solicitar(e){
    e.preventDefault();
    if(!form.responsavel||!form.aluno)return;
    const r={id:`local-${Date.now()}`,responsavel:form.responsavel,aluno:form.aluno,telefone:form.telefone,serie:form.serie,valor_solicitado:Number(String(form.valor_solicitado).replace(',','.'))||0,observacao_solicitacao:form.observacao_solicitacao,status:'aguardando',valor_autorizado:null,observacao_direcao:'',observacao_final:'',created_at:new Date().toISOString()};
    await persistir([r,...registros],r);
    setForm({responsavel:'',aluno:'',telefone:'',serie:'',valor_solicitado:'',observacao_solicitacao:''});
  }

  async function decidir(id,status){
    const atual=registros.find(x=>x.id===id);if(!atual)return;
    const valor=prompt(status==='autorizado'?'Valor autorizado pela Direção:':'Observação da Direção:',status==='autorizado'?String(atual.valor_solicitado||''):'');
    if(valor===null)return;
    const obs=status==='autorizado'?prompt('Observação da Direção (opcional):','')||'':valor;
    const alterado={...atual,status,valor_autorizado:status==='autorizado'?Number(String(valor).replace(',','.'))||0:null,observacao_direcao:obs,autorizado_at:new Date().toISOString()};
    await persistir(registros.map(x=>x.id===id?alterado:x),alterado);
  }

  async function concluir(id){
    const atual=registros.find(x=>x.id===id);if(!atual||atual.status!=='autorizado')return;
    const obs=prompt('Observações finais do atendimento:','')||'';
    const alterado={...atual,status:'concluido',observacao_final:obs,concluido_at:new Date().toISOString()};
    await persistir(registros.map(x=>x.id===id?alterado:x),alterado);
  }

  const cont=useMemo(()=>({aguardando:registros.filter(x=>x.status==='aguardando').length,autorizado:registros.filter(x=>x.status==='autorizado').length,concluido:registros.filter(x=>x.status==='concluido').length}),[registros]);

  return <section style={{display:'grid',gap:18}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
      <div><p className="eyebrow">APP OPERACIONAL</p><h1 style={{margin:'4px 0'}}>Gestão de Sucesso</h1><p style={{margin:0}}>A equipe recebe a família, solicita autorização e só conclui após liberação da Direção.</p></div>
      <div style={{display:'flex',gap:8}}><button className={modo==='gestao'?'primary':''} onClick={()=>setModo('gestao')}>Equipe Gestão</button><button className={modo==='direcao'?'primary':''} onClick={()=>setModo('direcao')}>Direção</button></div>
    </div>
    {aviso&&<div className="alerta">{aviso}</div>}
    <div className="metrics"><article><div className="metricIcon"><Clock3 size={21}/></div><div><small>Aguardando</small><strong>{cont.aguardando}</strong><span>pedidos para liberar</span></div></article><article><div className="metricIcon"><ShieldCheck size={21}/></div><div><small>Autorizados</small><strong>{cont.autorizado}</strong><span>podem ser finalizados</span></div></article><article><div className="metricIcon"><CheckCircle2 size={21}/></div><div><small>Concluídos</small><strong>{cont.concluido}</strong><span>atendimentos encerrados</span></div></article></div>

    {modo==='gestao'&&<form className="panel" onSubmit={solicitar} style={{padding:20,display:'grid',gap:12}}><div><h3 style={{margin:0}}>Novo pedido de autorização</h3><p>Registre o atendimento inicial e envie à Direção.</p></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10}}><input placeholder="Responsável" value={form.responsavel} onChange={e=>setForm({...form,responsavel:e.target.value})}/><input placeholder="Aluno" value={form.aluno} onChange={e=>setForm({...form,aluno:e.target.value})}/><input placeholder="Telefone" value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})}/><input placeholder="Série / turma" value={form.serie} onChange={e=>setForm({...form,serie:e.target.value})}/><input inputMode="decimal" placeholder="Valor solicitado" value={form.valor_solicitado} onChange={e=>setForm({...form,valor_solicitado:e.target.value})}/></div><textarea rows="3" placeholder="Observações da equipe" value={form.observacao_solicitacao} onChange={e=>setForm({...form,observacao_solicitacao:e.target.value})}/><button className="primary" type="submit"><Send size={17}/>Solicitar autorização à Direção</button></form>}

    <div className="panel" style={{padding:20}}><div className="panelHead"><div><h3>{modo==='direcao'?'Fila para decisão da Direção':'Meus atendimentos'}</h3><p>{modo==='direcao'?'Autorize, ajuste o valor ou negue a solicitação.':'A conclusão só é liberada depois da autorização.'}</p></div></div><div style={{display:'grid',gap:12}}>{registros.map(r=><article key={r.id} style={{border:'1px solid #e6ebf3',borderRadius:14,padding:14,display:'grid',gap:8}}><div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><div><strong>{r.aluno}</strong><div style={{fontSize:13,color:'#667085'}}>{r.responsavel} • {r.telefone||'sem telefone'} • {r.serie||'sem série'}</div></div><span className="status proposal">{STATUS[r.status]||r.status}</span></div><div style={{fontSize:14}}>Valor solicitado: <b>{money(r.valor_solicitado)}</b>{r.valor_autorizado!=null&&<> • Valor autorizado: <b>{money(r.valor_autorizado)}</b></>}</div>{r.observacao_solicitacao&&<div style={{fontSize:13}}>Equipe: {r.observacao_solicitacao}</div>}{r.observacao_direcao&&<div style={{fontSize:13}}>Direção: {r.observacao_direcao}</div>}{r.observacao_final&&<div style={{fontSize:13}}>Fechamento: {r.observacao_final}</div>}
      {modo==='direcao'&&r.status==='aguardando'&&<div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="primary" onClick={()=>decidir(r.id,'autorizado')}><ShieldCheck size={16}/>Autorizar</button><button onClick={()=>decidir(r.id,'negado')}><XCircle size={16}/>Negar</button></div>}
      {modo==='gestao'&&<div>{r.status==='autorizado'?<button className="primary" onClick={()=>concluir(r.id)}><CheckCircle2 size={16}/>Concluir atendimento</button>:r.status==='aguardando'?<span style={{display:'inline-flex',gap:6,alignItems:'center',color:'#986b00'}}><LockKeyhole size={15}/>Conclusão bloqueada aguardando Direção</span>:null}</div>}
    </article>)}{!registros.length&&<div className="empty">Nenhum atendimento registrado.</div>}</div></div>
  </section>
}
