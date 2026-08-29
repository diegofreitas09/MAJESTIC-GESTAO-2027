import { useEffect, useState } from 'react';
import { Clock3, UserCheck, Users } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function ResumoCRM({onOpen}){
 const [r,setR]=useState({cadastros:0,em_andamento:0,matriculas_novatos:0,matriculas_veteranos:0,matriculas_total:0,conversao_percentual:0});
 const [abertos,setAbertos]=useState([]);
 async function carregar(){
  try{
   const [a,b]=await Promise.all([
    supabase.from('vw_gestao_funil').select('*').limit(1),
    supabase.from('vw_gestao_atendimentos_abertos').select('*').order('iniciado_at',{ascending:false}).limit(5)
   ]);
   if(!a.error&&a.data?.[0])setR(a.data[0]);
   if(!b.error)setAbertos(b.data||[]);
  }catch{}
 }
 useEffect(()=>{carregar();const ch=supabase.channel('crm-direcao').on('postgres_changes',{event:'*',schema:'public',table:'gestao_clientes'},carregar).on('postgres_changes',{event:'*',schema:'public',table:'gestao_atendimentos'},carregar).subscribe();return()=>supabase.removeChannel(ch)},[]);
 return <section className="crmExec">
  <div className="crmExecHead"><div><h3>Gestão de Sucesso • Atendimento</h3><p>Acompanhamento em tempo real da operação da equipe.</p></div><button onClick={onOpen}>Abrir Gestão de Sucesso</button></div>
  <div className="crmExecStats"><article><Users size={20}/><div><small>Cadastros</small><strong>{Number(r.cadastros||0)}</strong></div></article><article><Clock3 size={20}/><div><small>Em atendimento</small><strong>{Number(r.em_andamento||0)}</strong></div></article><article><UserCheck size={20}/><div><small>Matrículas novatos</small><strong>{Number(r.matriculas_novatos||0)}</strong></div></article><article><UserCheck size={20}/><div><small>Matrículas veteranos</small><strong>{Number(r.matriculas_veteranos||0)}</strong></div></article><article><div><small>Conversão</small><strong>{Number(r.conversao_percentual||0).toLocaleString('pt-BR')}%</strong></div></article></div>
  {abertos.length>0&&<div className="crmExecOpen"><strong>Atendimentos em andamento</strong>{abertos.map(a=><div key={a.id}><span><b>{a.nome_aluno}</b> • {a.nome_responsavel}</span><span>{a.funcionario_nome} • {new Date(a.iniciado_at).toLocaleString('pt-BR')}</span><em>{String(a.etapa||'').replaceAll('_',' ')}</em></div>)}</div>}
 </section>
}