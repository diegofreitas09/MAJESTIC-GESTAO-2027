import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, PlayCircle, RotateCcw, Search, UserCheck, Users } from 'lucide-react';
import { supabase } from './lib/supabase';

const CLIENTES_KEY='majestic_crm_clientes';
const ATENDIMENTOS_KEY='majestic_crm_atendimentos';
const FUNCIONARIO_KEY='majestic_funcionario_nome';
const ETAPAS=['novo','contato','interesse_confirmado','visita_agendada','visita_realizada','proposta','aguardando_autorizacao','documentacao','pagamento','matriculado','perdido'];
const LABELS={novo:'Novo contato',contato:'Contato iniciado',interesse_confirmado:'Interesse confirmado',visita_agendada:'Visita agendada',visita_realizada:'Visita realizada',proposta:'Proposta apresentada',aguardando_autorizacao:'Aguardando autorização',documentacao:'Documentação',pagamento:'Aguardando pagamento',matriculado:'Matriculado',perdido:'Perdido'};
const agora=()=>new Date().toISOString();
const localGet=(k)=>{try{return JSON.parse(localStorage.getItem(k)||'[]')}catch{return []}};
const localSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const fmtData=v=>v?new Date(v).toLocaleString('pt-BR'):'—';

export default function AtendimentoCRM(){
 const [clientes,setClientes]=useState(()=>localGet(CLIENTES_KEY));
 const [atendimentos,setAtendimentos]=useState(()=>localGet(ATENDIMENTOS_KEY));
 const [funcionario,setFuncionario]=useState(()=>localStorage.getItem(FUNCIONARIO_KEY)||'');
 const [busca,setBusca]=useState('');
 const [selecionado,setSelecionado]=useState(null);
 const [atual,setAtual]=useState(null);
 const [aviso,setAviso]=useState('');
 const [form,setForm]=useState({nome_responsavel:'',nome_aluno:'',telefone:'',email:'',serie:'',tipo_aluno:'novato',origem:'WhatsApp'});
 const [progresso,setProgresso]=useState({etapa:'contato',observacao:''});

 useEffect(()=>{carregarSupabase()},[]);
 useEffect(()=>{try{localStorage.setItem(FUNCIONARIO_KEY,funcionario)}catch{}},[funcionario]);

 async function carregarSupabase(){
  try{
   const [c,a]=await Promise.all([
    supabase.from('gestao_clientes').select('*').order('updated_at',{ascending:false}).limit(1000),
    supabase.from('gestao_atendimentos').select('*').order('iniciado_at',{ascending:false}).limit(2000)
   ]);
   if(c.error||a.error)throw c.error||a.error;
   setClientes(c.data||[]);setAtendimentos(a.data||[]);localSet(CLIENTES_KEY,c.data||[]);localSet(ATENDIMENTOS_KEY,a.data||[]);
  }catch{setAviso('Cadastro funcionando neste aparelho. A sincronização com a Direção será ativada pelo acesso autenticado ao Supabase.')}
 }

 const resultados=useMemo(()=>{
  const q=busca.trim().toLowerCase(); if(q.length<2)return [];
  return clientes.filter(c=>`${c.nome_responsavel||''} ${c.nome_aluno||''} ${c.telefone||''} ${c.email||''}`.toLowerCase().includes(q)).slice(0,8)
 },[clientes,busca]);
 const historico=useMemo(()=>selecionado?atendimentos.filter(a=>a.cliente_id===selecionado.id).sort((x,y)=>new Date(y.iniciado_at)-new Date(x.iniciado_at)):[],[atendimentos,selecionado]);
 const emAndamento=useMemo(()=>atendimentos.filter(a=>a.status==='em_andamento').length,[atendimentos]);
 const matricNovatos=useMemo(()=>clientes.filter(c=>c.matriculado&&c.tipo_aluno==='novato').length,[clientes]);
 const matricVeteranos=useMemo(()=>clientes.filter(c=>c.matriculado&&c.tipo_aluno==='veterano').length,[clientes]);
 const conversao=clientes.length?((matricNovatos+matricVeteranos)/clientes.length*100):0;

 function novoCadastro(){setSelecionado(null);setAtual(null);setBusca('');setForm({nome_responsavel:'',nome_aluno:'',telefone:'',email:'',serie:'',tipo_aluno:'novato',origem:'WhatsApp'});setProgresso({etapa:'contato',observacao:''})}
 function escolher(c){setSelecionado(c);setForm({nome_responsavel:c.nome_responsavel||'',nome_aluno:c.nome_aluno||'',telefone:c.telefone||'',email:c.email||'',serie:c.serie||'',tipo_aluno:c.tipo_aluno||'novato',origem:c.origem||'WhatsApp'});setBusca('');const ultimo=atendimentos.filter(a=>a.cliente_id===c.id).sort((x,y)=>new Date(y.iniciado_at)-new Date(x.iniciado_at))[0];setProgresso({etapa:ultimo?.etapa||c.status_funil||'contato',observacao:''})}

 async function iniciarAtendimento(e){
  e.preventDefault(); if(!funcionario.trim()||!form.nome_responsavel.trim()||!form.nome_aluno.trim())return;
  let cliente=selecionado;
  if(cliente){
   cliente={...cliente,...form,updated_at:agora()};
   const lista=clientes.map(c=>c.id===cliente.id?cliente:c);setClientes(lista);localSet(CLIENTES_KEY,lista);
   try{await supabase.from('gestao_clientes').update(form).eq('id',cliente.id)}catch{}
  }else{
   const temp={id:`local-c-${Date.now()}`,...form,status_funil:'contato',matriculado:false,created_at:agora(),updated_at:agora()};cliente=temp;
   try{const {data,error}=await supabase.from('gestao_clientes').insert(form).select().single();if(!error&&data)cliente=data}catch{}
   const lista=[cliente,...clientes];setClientes(lista);localSet(CLIENTES_KEY,lista);setSelecionado(cliente);
  }
  let atendimento={id:`local-a-${Date.now()}`,cliente_id:cliente.id,funcionario_nome:funcionario.trim(),status:'em_andamento',etapa:progresso.etapa||'contato',observacao_abertura:progresso.observacao||'',iniciado_at:agora(),updated_at:agora()};
  try{if(!String(cliente.id).startsWith('local-')){const payload={cliente_id:cliente.id,funcionario_nome:funcionario.trim(),status:'em_andamento',etapa:atendimento.etapa,observacao_abertura:atendimento.observacao_abertura};const {data,error}=await supabase.from('gestao_atendimentos').insert(payload).select().single();if(!error&&data)atendimento=data}}catch{}
  const listaA=[atendimento,...atendimentos];setAtendimentos(listaA);localSet(ATENDIMENTOS_KEY,listaA);setAtual(atendimento);setAviso('Atendimento iniciado. A Direção poderá acompanhar funcionário, horário, etapa e evolução.')
 }

 async function salvarProgresso(){
  if(!atual)return;
  const final=progresso.etapa==='matriculado'||progresso.etapa==='perdido';
  const alterado={...atual,etapa:progresso.etapa,status:final?'concluido':'em_andamento',observacao_fechamento:progresso.observacao||atual.observacao_fechamento||'',encerrado_at:final?agora():null,updated_at:agora()};
  const listaA=atendimentos.map(a=>a.id===atual.id?alterado:a);setAtendimentos(listaA);localSet(ATENDIMENTOS_KEY,listaA);setAtual(alterado);
  if(selecionado){const cli={...selecionado,status_funil:progresso.etapa,matriculado:progresso.etapa==='matriculado'?true:selecionado.matriculado,matriculado_at:progresso.etapa==='matriculado'?agora():selecionado.matriculado_at,updated_at:agora()};setSelecionado(cli);const listaC=clientes.map(c=>c.id===cli.id?cli:c);setClientes(listaC);localSet(CLIENTES_KEY,listaC);try{if(!String(cli.id).startsWith('local-'))await supabase.from('gestao_clientes').update({status_funil:cli.status_funil,matriculado:cli.matriculado,matriculado_at:cli.matriculado_at}).eq('id',cli.id)}catch{}}
  try{if(!String(atual.id).startsWith('local-'))await supabase.from('gestao_atendimentos').update({etapa:alterado.etapa,status:alterado.status,observacao_fechamento:alterado.observacao_fechamento,encerrado_at:alterado.encerrado_at}).eq('id',atual.id)}catch{}
  setAviso(final?'Atendimento concluído e resultado registrado.':'Progresso salvo. O próximo contato continuará desta etapa.')
 }

 return <section className="crmPage">
  <div className="crmHero"><div><span>CRM DE ATENDIMENTO</span><h2>Iniciar e acompanhar atendimento</h2><p>Cadastre uma vez, retome pelo nome, telefone ou e-mail e continue exatamente de onde parou.</p></div><button type="button" onClick={novoCadastro}><RotateCcw size={17}/>Novo atendimento</button></div>
  {aviso&&<div className="crmNotice">{aviso}</div>}
  <div className="crmStats"><article><Users size={20}/><div><small>Cadastros</small><strong>{clientes.length}</strong></div></article><article><Clock3 size={20}/><div><small>Em atendimento</small><strong>{emAndamento}</strong></div></article><article><UserCheck size={20}/><div><small>Matrículas novatos</small><strong>{matricNovatos}</strong></div></article><article><UserCheck size={20}/><div><small>Matrículas veteranos</small><strong>{matricVeteranos}</strong></div></article><article><CheckCircle2 size={20}/><div><small>Conversão</small><strong>{conversao.toFixed(1)}%</strong></div></article></div>

  <section className="panel crmLookup"><div className="panelHead"><div><h3>Localizar cadastro</h3><p>Digite apenas uma informação para recuperar todo o histórico.</p></div></div><div className="crmSearch"><Search size={18}/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Nome do responsável, aluno, telefone ou e-mail"/></div>{resultados.length>0&&<div className="crmResults">{resultados.map(c=><button type="button" key={c.id} onClick={()=>escolher(c)}><strong>{c.nome_aluno}</strong><span>{c.nome_responsavel} • {c.telefone||c.email||'sem contato'}</span><em>{LABELS[c.status_funil]||'Cadastro existente'}</em></button>)}</div>}</section>

  <form className="panel crmForm" onSubmit={iniciarAtendimento}><div className="panelHead"><div><h3>{selecionado?'Retomar atendimento':'Novo cadastro de atendimento'}</h3><p>{selecionado?`Última etapa: ${LABELS[selecionado.status_funil]||'Cadastro existente'}`:'As informações ficarão salvas para os próximos contatos.'}</p></div></div><div className="crmGrid"><label>Funcionário responsável<input required value={funcionario} onChange={e=>setFuncionario(e.target.value)} placeholder="Nome do funcionário"/></label><label>Tipo de aluno<select value={form.tipo_aluno} onChange={e=>setForm({...form,tipo_aluno:e.target.value})}><option value="novato">Novato</option><option value="veterano">Veterano</option></select></label><label>Responsável<input required value={form.nome_responsavel} onChange={e=>setForm({...form,nome_responsavel:e.target.value})}/></label><label>Aluno<input required value={form.nome_aluno} onChange={e=>setForm({...form,nome_aluno:e.target.value})}/></label><label>Telefone<input value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})}/></label><label>E-mail<input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Série / turma<input value={form.serie} onChange={e=>setForm({...form,serie:e.target.value})}/></label><label>Origem<select value={form.origem} onChange={e=>setForm({...form,origem:e.target.value})}><option>WhatsApp</option><option>Telefone</option><option>Presencial</option><option>Instagram</option><option>Indicação</option><option>Site</option><option>Outro</option></select></label><label>Etapa inicial<select value={progresso.etapa} onChange={e=>setProgresso({...progresso,etapa:e.target.value})}>{ETAPAS.filter(e=>!['matriculado','perdido'].includes(e)).map(e=><option key={e} value={e}>{LABELS[e]}</option>)}</select></label><label className="crmWide">Observação inicial<textarea rows="3" value={progresso.observacao} onChange={e=>setProgresso({...progresso,observacao:e.target.value})} placeholder="O que a família procura, condição conversada, próximos passos..."/></label></div><button className="primary crmStart" type="submit"><PlayCircle size={18}/>{selecionado?'Retomar atendimento':'Iniciar atendimento'}</button></form>

  {atual&&<section className="panel crmCurrent"><div className="crmCurrentHead"><div><span>ATENDIMENTO EM CURSO</span><h3>{selecionado?.nome_aluno||form.nome_aluno}</h3><p>Iniciado por <b>{atual.funcionario_nome}</b> em {fmtData(atual.iniciado_at)}</p></div><strong>{LABELS[atual.etapa]}</strong></div><div className="crmPipeline">{ETAPAS.map((e,i)=><div key={e} className={`${e===atual.etapa?'active':''} ${ETAPAS.indexOf(atual.etapa)>i?'done':''}`}><i>{i+1}</i><span>{LABELS[e]}</span></div>)}</div><div className="crmProgressForm"><label>Atualizar etapa<select value={progresso.etapa} onChange={e=>setProgresso({...progresso,etapa:e.target.value})}>{ETAPAS.map(e=><option key={e} value={e}>{LABELS[e]}</option>)}</select></label><label>Observação / próximo passo<textarea rows="3" value={progresso.observacao} onChange={e=>setProgresso({...progresso,observacao:e.target.value})}/></label><button type="button" className="primary" onClick={salvarProgresso}>Salvar andamento</button></div></section>}

  {selecionado&&<section className="panel crmHistory"><div className="panelHead"><div><h3>Histórico completo</h3><p>{selecionado.nome_aluno} • {selecionado.tipo_aluno==='veterano'?'Veterano':'Novato'}</p></div><span className={`crmMatricula ${selecionado.matriculado?'yes':''}`}>{selecionado.matriculado?'MATRÍCULA CONFIRMADA':'AINDA NÃO MATRICULADO'}</span></div>{historico.map(h=><article key={h.id}><div><strong>{LABELS[h.etapa]||h.etapa}</strong><small>{fmtData(h.iniciado_at)} • {h.funcionario_nome}</small></div><span>{h.status==='concluido'?'Concluído':'Em andamento'}</span><p>{h.observacao_fechamento||h.observacao_abertura||'Sem observação registrada.'}</p></article>)}{!historico.length&&<div className="empty">Primeiro atendimento desse cadastro.</div>}</section>}
 </section>
}
