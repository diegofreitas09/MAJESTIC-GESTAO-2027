import { useEffect, useMemo, useState } from 'react';
import { Clock3, Megaphone, UserCheck, Users } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function ResumoCRM({onOpen}){
 const [r,setR]=useState({cadastros:0,em_andamento:0,matriculas_novatos:0,matriculas_veteranos:0,matriculas_total:0,conversao_percentual:0});
 const [abertos,setAbertos]=useState([]);
 const [clientes,setClientes]=useState([]);
 async function carregar(){
  try{
   const [a,b,c]=await Promise.all([
    supabase.from('vw_gestao_funil').select('*').limit(1),
    supabase.from('vw_gestao_atendimentos_abertos').select('*').order('iniciado_at',{ascending:false}).limit(5),
    supabase.from('gestao_clientes').select('origem,matriculado').limit(2000)
   ]);
   if(!a.error&&a.data?.[0])setR(a.data[0]);
   if(!b.error)setAbertos(b.data||[]);
   if(!c.error)setClientes(c.data||[]);
  }catch{}
 }
 useEffect(()=>{carregar();const ch=supabase.channel('crm-direcao').on('postgres_changes',{event:'*',schema:'public',table:'gestao_clientes'},carregar).on('postgres_changes',{event:'*',schema:'public',table:'gestao_atendimentos'},carregar).subscribe();return()=>supabase.removeChannel(ch)},[]);
 const origens=useMemo(()=>{
  const mapa={};
  clientes.forEach(c=>{const origem=String(c.origem||'Não informado').trim()||'Não informado';if(!mapa[origem])mapa[origem]={origem,total:0,matriculas:0};mapa[origem].total++;if(c.matriculado)mapa[origem].matriculas++});
  return Object.values(mapa).sort((a,b)=>b.total-a.total);
 },[clientes]);
 const principal=origens[0];
 return <section className="crmExec">
  <div className="crmExecHead"><div><h3>Gestão de Sucesso • Atendimento</h3><p>Acompanhamento em tempo real da operação da equipe.</p></div><button onClick={onOpen}>Abrir Gestão de Sucesso</button></div>
  <div className="crmExecStats"><article><Users size={20}/><div><small>Cadastros</small><strong>{Number(r.cadastros||0)}</strong></div></article><article><Clock3 size={20}/><div><small>Em atendimento</small><strong>{Number(r.em_andamento||0)}</strong></div></article><article><UserCheck size={20}/><div><small>Matrículas novatos</small><strong>{Number(r.matriculas_novatos||0)}</strong></div></article><article><UserCheck size={20}/><div><small>Matrículas veteranos</small><strong>{Number(r.matriculas_veteranos||0)}</strong></div></article><article><div><small>Conversão</small><strong>{Number(r.conversao_percentual||0).toLocaleString('pt-BR')}%</strong></div></article></div>
  <div className="panel" style={{marginTop:16,padding:18}}><div className="panelHead"><div><h3><Megaphone size={18} style={{verticalAlign:'middle',marginRight:7}}/>Como as famílias conheceram a escola?</h3><p>Indicador comercial salvo no cadastro e usado nos relatórios de captação.</p></div>{principal&&<span className="badge">Principal: {principal.origem}</span>}</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}>{origens.slice(0,6).map(o=><article key={o.origem} style={{padding:14,border:'1px solid #e4ebf4',borderRadius:14,background:'#f8fbff'}}><small>{o.origem}</small><strong style={{display:'block',fontSize:24,margin:'4px 0'}}>{o.total}</strong><span>{o.matriculas} matrícula(s) • {clientes.length?((o.total/clientes.length)*100).toLocaleString('pt-BR',{maximumFractionDigits:1}):0}% das procuras</span></article>)}{!origens.length&&<div className="empty">Os canais de origem aparecerão aqui quando os atendimentos começarem.</div>}</div></div>
  {abertos.length>0&&<div className="crmExecOpen"><strong>Atendimentos em andamento</strong>{abertos.map(a=><div key={a.id}><span><b>{a.nome_aluno}</b> • {a.nome_responsavel}</span><span>{a.atendente_nome||a.funcionario_nome} • {new Date(a.iniciado_at).toLocaleString('pt-BR')}</span><em>{String(a.etapa||'').replaceAll('_',' ')}</em></div>)}</div>}
 </section>
}