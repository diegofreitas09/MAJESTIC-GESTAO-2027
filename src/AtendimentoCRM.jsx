import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Download, FileText, PlayCircle, RotateCcw, Search, UserCheck, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './lib/supabase';
import { BASE_COMERCIAL_2026 } from './lib/comercial2026';

const ETAPAS=['contato','perfil','interesse','visita','proposta','decisao','matriculado'];
const LABELS={contato:'Contato',perfil:'Perfil identificado',interesse:'Interesse',visita:'Visita',proposta:'Proposta',decisao:'Decisão',matriculado:'Matrícula',perdido:'Não converteu'};
const SERIES=['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'];
const TURNOS=['Manhã','Tarde','Integral','A definir'];
const COMERCIAL_KEY='majestic_comercial_2027';
const agora=()=>new Date().toISOString();
const fmt=v=>v?new Date(v).toLocaleString('pt-BR'):'—';
const moeda=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const vazio={nome_responsavel:'',nome_aluno:'',telefone:'',email:'',data_nascimento:'',idade:'',bairro:'',escola_atual:'',possui_laudo:false,observacao_laudo:'',serie:'',turno_preferencia:'',modalidade:'Regular',tipo_aluno:'novato',origem:'WhatsApp',interesse_principal:'',proximo_contato_at:'',motivo_perda:''};

function lerComercial(){
 try{
  const salvo=localStorage.getItem(COMERCIAL_KEY);
  if(!salvo)return BASE_COMERCIAL_2026;
  const lista=JSON.parse(salvo);
  const mapa=new Map((Array.isArray(lista)?lista:[]).map(i=>[i.id,i]));
  return BASE_COMERCIAL_2026.map(base=>mapa.has(base.id)?{...base,...mapa.get(base.id),valor2026:base.valor2026}:base);
 }catch{return BASE_COMERCIAL_2026}
}

function aplicavelSerie(item,serie){
 if(!serie)return false;
 const id=item.id||'', cat=item.categoria||'';
 const infantil=serie.startsWith('Infantil');
 const fundamental=/^[1-5]º ano$/.test(serie);
 if(serie==='Berçário') return ['Berçário','Alimentação','Day Care'].includes(cat)||id==='blocos-atividades'||id==='plano-utilizacao'||id==='farda-sti';
 if(serie==='Infantil I') return id.startsWith('inf1-')||['Tempo Integral','Alimentação','Day Care','Esportes'].includes(cat)||id==='farda-educacao-infantil'||id==='blocos-atividades'||id==='plano-utilizacao';
 if(infantil) return id.startsWith('inf2-5-')||['Tempo Integral','Alimentação','Day Care','Esportes'].includes(cat)||id==='farda-educacao-infantil'||id==='plano-utilizacao';
 if(fundamental) return id.startsWith('inf2-5-')||['Tempo Integral','Alimentação','Day Care','Esportes'].includes(cat)||['farda-fundamental','farda-educacao-fisica','plano-utilizacao'].includes(id);
 return false;
}

function etapaAutomatica(f,acoes={}){
 if(acoes.matriculado)return {etapa:'matriculado',pct:100};
 if(acoes.perdido)return {etapa:'perdido',pct:100};
 if(acoes.confirmou)return {etapa:'decisao',pct:88};
 if(acoes.proposta)return {etapa:'proposta',pct:72};
 if(acoes.visita)return {etapa:'visita',pct:58};
 if(f.interesse_principal)return {etapa:'interesse',pct:43};
 if(f.nome_aluno&&f.serie&&f.turno_preferencia)return {etapa:'perfil',pct:28};
 return {etapa:'contato',pct:12};
}

export default function AtendimentoCRM({profile}){
 const funcionario=profile?.nome||'';
 const [clientes,setClientes]=useState([]),[atendimentos,setAtendimentos]=useState([]),[busca,setBusca]=useState(''),[selecionado,setSelecionado]=useState(null),[atual,setAtual]=useState(null),[aviso,setAviso]=useState('');
 const [form,setForm]=useState(vazio),[obs,setObs]=useState(''),[acoes,setAcoes]=useState({visita:false,proposta:false,confirmou:false,matriculado:false,perdido:false}),[dataInicio,setDataInicio]=useState(()=>new Date().toISOString().slice(0,10)),[dataFim,setDataFim]=useState(()=>new Date().toISOString().slice(0,10));
 const [itensSelecionados,setItensSelecionados]=useState([]);
 const comercial=useMemo(()=>lerComercial(),[]);
 const itensSerie=useMemo(()=>comercial.filter(i=>aplicavelSerie(i,form.serie)),[comercial,form.serie]);
 const itensOrcamento=useMemo(()=>itensSerie.filter(i=>itensSelecionados.includes(i.id)),[itensSerie,itensSelecionados]);
 const totalOrcamento=useMemo(()=>itensOrcamento.reduce((s,i)=>s+Number(i.valor2027??i.valor2026??0),0),[itensOrcamento]);
 const auto=etapaAutomatica(form,acoes);

 useEffect(()=>{carregar();const canal=supabase.channel('crm-equipe-sync-v4').on('postgres_changes',{event:'*',schema:'public',table:'gestao_clientes'},carregar).on('postgres_changes',{event:'*',schema:'public',table:'gestao_atendimentos'},carregar).subscribe();return()=>supabase.removeChannel(canal)},[]);
 async function carregar(){const [c,a]=await Promise.all([supabase.from('gestao_clientes').select('*').order('updated_at',{ascending:false}).limit(1500),supabase.from('gestao_atendimentos').select('*').order('iniciado_at',{ascending:false}).limit(3000)]);if(c.error||a.error){setAviso(`Sincronização: ${(c.error||a.error)?.message}`);return}setClientes(c.data||[]);setAtendimentos(a.data||[])}
 const resultados=useMemo(()=>{const q=busca.trim().toLowerCase();if(q.length<2)return[];return clientes.filter(c=>`${c.nome_responsavel||''} ${c.nome_aluno||''} ${c.telefone||''} ${c.email||''}`.toLowerCase().includes(q)).slice(0,8)},[clientes,busca]);
 const historico=useMemo(()=>selecionado?atendimentos.filter(a=>a.cliente_id===selecionado.id):[],[atendimentos,selecionado]);
 const meusHoje=useMemo(()=>{const hoje=new Date().toISOString().slice(0,10);return atendimentos.filter(a=>(!profile?.id||a.funcionario_id===profile.id)&&String(a.iniciado_at||'').slice(0,10)===hoje)},[atendimentos,profile]);
 const atendimentosPeriodo=useMemo(()=>{const ini=new Date(`${dataInicio}T00:00:00`),fim=new Date(`${dataFim}T23:59:59`);return atendimentos.filter(a=>{const d=new Date(a.iniciado_at);return d>=ini&&d<=fim&&(!profile?.id||a.funcionario_id===profile.id)})},[atendimentos,dataInicio,dataFim,profile]);
 const matriculas=clientes.filter(c=>c.matriculado).length, conversao=clientes.length?matriculas/clientes.length*100:0;

 function novo(){setSelecionado(null);setAtual(null);setBusca('');setForm(vazio);setObs('');setItensSelecionados([]);setAcoes({visita:false,proposta:false,confirmou:false,matriculado:false,perdido:false})}
 function escolher(c){setSelecionado(c);setForm({...vazio,...c,data_nascimento:c.data_nascimento||'',proximo_contato_at:c.proximo_contato_at?String(c.proximo_contato_at).slice(0,16):''});setBusca('');const u=atendimentos.find(a=>a.cliente_id===c.id);setAtual(u?.status==='em_andamento'?u:null);setItensSelecionados(Array.isArray(u?.orcamento_json)?u.orcamento_json.map(x=>x.id):[]);setAcoes({visita:['visita','proposta','decisao','matriculado'].includes(c.status_funil),proposta:['proposta','decisao','matriculado'].includes(c.status_funil),confirmou:['decisao','matriculado'].includes(c.status_funil),matriculado:!!c.matriculado,perdido:c.status_funil==='perdido'})}
 function idadeNascimento(v){if(!v)return'';const d=new Date(v+'T12:00:00'),h=new Date();let i=h.getFullYear()-d.getFullYear();if(h<new Date(h.getFullYear(),d.getMonth(),d.getDate()))i--;return Math.max(0,i)}
 function campo(k,v){const novoForm={...form,[k]:v};if(k==='data_nascimento')novoForm.idade=idadeNascimento(v);if(k==='serie'&&v!==form.serie)setItensSelecionados([]);setForm(novoForm)}
 function toggleItem(id){setItensSelecionados(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])}

 async function iniciar(e){
  e.preventDefault();if(!profile?.id||!form.nome_responsavel.trim()||!form.nome_aluno.trim())return;
  setAviso('Sincronizando com a Direção...');const status=etapaAutomatica(form,acoes);
  const payload={...form,idade:form.idade===''?null:Number(form.idade),data_nascimento:form.data_nascimento||null,proximo_contato_at:form.proximo_contato_at||null,status_funil:status.etapa==='perfil'?'contato':status.etapa,updated_at:agora()};let cli;
  if(selecionado){const r=await supabase.from('gestao_clientes').update(payload).eq('id',selecionado.id).select().single();if(r.error){setAviso(r.error.message);return}cli=r.data}else{const r=await supabase.from('gestao_clientes').insert({...payload,matriculado:false}).select().single();if(r.error){setAviso(r.error.message);return}cli=r.data}
  const orcamento=itensOrcamento.map(i=>({id:i.id,categoria:i.categoria,produto:i.produto,valor:Number(i.valor2027??i.valor2026??0),observacao:i.observacao||''}));
  const r=await supabase.from('gestao_atendimentos').insert({cliente_id:cli.id,funcionario_id:profile.id,funcionario_nome:funcionario,status:'em_andamento',etapa:status.etapa==='perfil'?'contato':status.etapa,progresso_percentual:status.pct,observacao_abertura:obs||'',proximo_contato_at:form.proximo_contato_at||null,orcamento_json:orcamento,valor_orcamento:totalOrcamento}).select().single();
  if(r.error){setAviso(r.error.message);return}setSelecionado(cli);setAtual(r.data);setAviso('Atendimento e orçamento salvos. A Direção já consegue acompanhar.');await carregar()
 }

 async function salvar(){
  if(!selecionado)return;const st=etapaAutomatica(form,acoes),dbEtapa=st.etapa==='perfil'?'contato':st.etapa,final=['matriculado','perdido'].includes(st.etapa);
  const cliPayload={...form,idade:form.idade===''?null:Number(form.idade),data_nascimento:form.data_nascimento||null,proximo_contato_at:form.proximo_contato_at||null,status_funil:dbEtapa,matriculado:st.etapa==='matriculado',matriculado_at:st.etapa==='matriculado'?(selecionado.matriculado_at||agora()):selecionado.matriculado_at,updated_at:agora()};
  const c=await supabase.from('gestao_clientes').update(cliPayload).eq('id',selecionado.id).select().single();if(c.error){setAviso(c.error.message);return}
  if(atual){const orcamento=itensOrcamento.map(i=>({id:i.id,categoria:i.categoria,produto:i.produto,valor:Number(i.valor2027??i.valor2026??0),observacao:i.observacao||''}));const a=await supabase.from('gestao_atendimentos').update({etapa:dbEtapa,progresso_percentual:st.pct,status:final?'concluido':'em_andamento',observacao_fechamento:obs||'',proximo_passo:form.proximo_contato_at?'Retornar contato':'',proximo_contato_at:form.proximo_contato_at||null,visita_realizada:acoes.visita,proposta_apresentada:acoes.proposta,familia_confirmou_interesse:acoes.confirmou,orcamento_json:orcamento,valor_orcamento:totalOrcamento,encerrado_at:final?agora():null,updated_at:agora()}).eq('id',atual.id).select().single();if(a.error){setAviso(a.error.message);return}setAtual(a.data)}
  setSelecionado(c.data);setAviso(final?'Atendimento concluído e enviado à Direção.':'Atendimento e orçamento salvos. A Direção recebeu a atualização.');await carregar()
 }

 function gerarPdfAtendimento(){
  if(!form.nome_aluno||!form.nome_responsavel){setAviso('Preencha responsável e aluno antes de gerar o PDF.');return}
  const doc=new jsPDF();doc.setFontSize(19);doc.text('Majestic - Atendimento e Orçamento 2027',14,18);doc.setFontSize(10);doc.text(`Atendente: ${funcionario}`,14,25);doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`,14,31);
  autoTable(doc,{startY:37,theme:'grid',head:[['Dados da família','Informação']],body:[['Responsável',form.nome_responsavel],['Aluno',form.nome_aluno],['Série',form.serie||'-'],['Turno',form.turno_preferencia||'-'],['Telefone',form.telefone||'-'],['Bairro',form.bairro||'-'],['Escola atual',form.escola_atual||'-']]});
  let y=(doc.lastAutoTable?.finalY||78)+7;doc.setFontSize(13);doc.text('Valores apresentados',14,y);
  autoTable(doc,{startY:y+4,head:[['Categoria','Produto / Plano','Valor 2027']],body:itensOrcamento.length?itensOrcamento.map(i=>[i.categoria,i.produto,moeda(i.valor2027??i.valor2026)]):[['-','Nenhum item selecionado','-']]});
  y=(doc.lastAutoTable?.finalY||y+20)+7;doc.setFontSize(12);doc.text(`Total dos itens selecionados: ${moeda(totalOrcamento)}`,14,y);
  if(obs){doc.setFontSize(9);doc.text('Observações do atendimento:',14,y+8);doc.text(doc.splitTextToSize(obs,180),14,y+13)}
  doc.setFontSize(8);doc.text('Valores sujeitos às condições comerciais vigentes e validação da Direção quando aplicável.',14,287);
  doc.save(`majestic-orcamento-${(form.nome_aluno||'aluno').replace(/\s+/g,'-').toLowerCase()}.pdf`)
 }

 function relatorio(){const dados=atendimentosPeriodo;const doc=new jsPDF();doc.setFontSize(17);doc.text('Majestic - Relatório de Atendimentos',14,18);doc.setFontSize(10);doc.text(`${funcionario} | ${dataInicio.split('-').reverse().join('/')} a ${dataFim.split('-').reverse().join('/')}`,14,25);autoTable(doc,{startY:31,head:[['Data','Aluno/Família','Etapa','Status']],body:dados.map(a=>{const c=clientes.find(x=>x.id===a.cliente_id)||{};return [fmt(a.iniciado_at),`${c.nome_aluno||'-'} / ${c.nome_responsavel||'-'}`,LABELS[a.etapa]||a.etapa,a.status]})});doc.save(`majestic-atendimentos-${dataInicio}-${dataFim}.pdf`)}
 const indice=Math.max(0,ETAPAS.indexOf(auto.etapa));

 return <section className="crmPage">
  <div className="crmHero"><div><span>ATENDIMENTO MAJESTIC</span><h2>Atender bem, registrar sem burocracia.</h2><p>Selecione a série, monte o orçamento e salve todo o atendimento em um único fluxo.</p></div><button type="button" onClick={novo}><RotateCcw size={17}/>Novo atendimento</button></div>
  {aviso&&<div className="crmNotice">{aviso}</div>}
  <div className="crmStats"><article><Users/><div><small>Atendimentos hoje</small><strong>{meusHoje.length}</strong></div></article><article><Clock3/><div><small>Em andamento</small><strong>{atendimentos.filter(a=>a.status==='em_andamento').length}</strong></div></article><article><UserCheck/><div><small>Matrículas</small><strong>{matriculas}</strong></div></article><article><CheckCircle2/><div><small>Conversão</small><strong>{conversao.toFixed(1)}%</strong></div></article></div>

  <section className="panel crmLookup"><div className="panelHead"><div><h3>Quem vamos atender?</h3><p>Busque antes de cadastrar. Um telefone, nome ou e-mail é suficiente.</p></div></div><div className="crmSearch"><Search size={18}/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Telefone, responsável, aluno ou e-mail"/></div>{resultados.length>0&&<div className="crmResults">{resultados.map(c=><button type="button" key={c.id} onClick={()=>escolher(c)}><strong>{c.nome_aluno}</strong><span>{c.nome_responsavel} • {c.telefone||c.email||'sem contato'} • {c.serie||'série não informada'}</span><em>{LABELS[c.status_funil]||'Cadastro'}</em></button>)}</div>}</section>

  <form className="panel crmForm" onSubmit={iniciar}><div className="crmFormTitle"><div><h3>{selecionado?'Continuar atendimento':'Dados da família e do aluno'}</h3><p>Complete naturalmente durante a conversa.</p></div><div className="crmAutoBadge">Etapa automática: <b>{LABELS[auto.etapa]}</b> • {auto.pct}%</div></div><div className="crmGrid">
   <label>Responsável *<input required value={form.nome_responsavel} onChange={e=>campo('nome_responsavel',e.target.value)}/></label><label>WhatsApp / telefone<input value={form.telefone} onChange={e=>campo('telefone',e.target.value)}/></label><label>E-mail<input value={form.email} onChange={e=>campo('email',e.target.value)}/></label>
   <label>Aluno *<input required value={form.nome_aluno} onChange={e=>campo('nome_aluno',e.target.value)}/></label><label>Data de nascimento<input type="date" value={form.data_nascimento} onChange={e=>campo('data_nascimento',e.target.value)}/></label><label>Idade<input type="number" min="0" max="30" value={form.idade} onChange={e=>campo('idade',e.target.value)}/></label>
   <label>Bairro<input value={form.bairro} onChange={e=>campo('bairro',e.target.value)}/></label><label>Escola atual<input value={form.escola_atual} onChange={e=>campo('escola_atual',e.target.value)}/></label><label>Tipo<select value={form.tipo_aluno} onChange={e=>campo('tipo_aluno',e.target.value)}><option value="novato">Novato</option><option value="veterano">Veterano</option></select></label>
   <label>Série pretendida<select value={form.serie} onChange={e=>campo('serie',e.target.value)}><option value="">Selecione</option>{SERIES.map(x=><option key={x}>{x}</option>)}</select></label><label>Turno de preferência<select value={form.turno_preferencia} onChange={e=>campo('turno_preferencia',e.target.value)}><option value="">Selecione</option>{TURNOS.map(x=><option key={x}>{x}</option>)}</select></label><label>Como conheceu?<select value={form.origem} onChange={e=>campo('origem',e.target.value)}>{['WhatsApp','Telefone','Presencial','Instagram','Indicação','Google','Site','Outro'].map(x=><option key={x}>{x}</option>)}</select></label>
   <label>Possui laudo / necessidade específica?<select value={form.possui_laudo?'sim':'nao'} onChange={e=>campo('possui_laudo',e.target.value==='sim')}><option value="nao">Não informado / Não</option><option value="sim">Sim</option></select></label>{form.possui_laudo&&<label className="crmSpan2">Observação necessária para o atendimento<input value={form.observacao_laudo} onChange={e=>campo('observacao_laudo',e.target.value)} placeholder="Registre somente o necessário para o atendimento escolar"/></label>}
   <label className="crmSpan2">Principal interesse da família<input value={form.interesse_principal} onChange={e=>campo('interesse_principal',e.target.value)} placeholder="Ex.: integral, proposta pedagógica, proximidade..."/></label><label>Próximo retorno<input type="datetime-local" value={form.proximo_contato_at} onChange={e=>campo('proximo_contato_at',e.target.value)}/></label><label className="crmWide">Anotação rápida<textarea rows="2" value={obs} onChange={e=>setObs(e.target.value)} placeholder="O que é importante lembrar deste contato?"/></label>
  </div>

  {form.serie&&<section className="crmBudget"><div className="crmBudgetHead"><div><span>ORÇAMENTO AUTOMÁTICO</span><h3>Valores disponíveis para {form.serie}</h3><p>Marque somente os itens apresentados à família. Os valores 2027 são usados no orçamento.</p></div><strong>{itensSelecionados.length} selecionado(s)</strong></div><div className="crmBudgetGrid">{itensSerie.map(i=><label key={i.id} className={itensSelecionados.includes(i.id)?'selected':''}><input type="checkbox" checked={itensSelecionados.includes(i.id)} onChange={()=>toggleItem(i.id)}/><div><small>{i.categoria}</small><b>{i.produto}</b><span>{i.observacao||''}</span></div><strong>{moeda(i.valor2027??i.valor2026)}</strong></label>)}</div><div className="crmBudgetTotal"><span>Total dos itens selecionados</span><strong>{moeda(totalOrcamento)}</strong></div></section>}

  {!atual&&<button className="primary crmStart" type="submit"><PlayCircle size={18}/>{selecionado?'Retomar atendimento':'Iniciar e salvar atendimento'}</button>}</form>

  {(atual||selecionado)&&<section className="panel crmCurrent"><div className="crmCurrentHead"><div><span>DESEMPENHO DO ATENDIMENTO</span><h3>{form.nome_aluno}</h3><p>{funcionario} • atualização automática conforme o atendimento evolui</p></div><strong>{auto.pct}% • {LABELS[auto.etapa]}</strong></div><div className="crmPerformance"><div className="crmPerformanceBar"><i style={{width:`${auto.pct}%`}}/></div><div className="crmSteps">{ETAPAS.map((e,i)=><div key={e} className={i<indice?'done':i===indice?'active':''}><i>{i+1}</i><span>{LABELS[e]}</span></div>)}</div></div><div className="crmQuickActions"><button type="button" className={acoes.visita?'done':''} onClick={()=>setAcoes({...acoes,visita:!acoes.visita})}>✓ Visita realizada</button><button type="button" className={acoes.proposta?'done':''} onClick={()=>setAcoes({...acoes,proposta:!acoes.proposta})}>✓ Proposta apresentada</button><button type="button" className={acoes.confirmou?'done':''} onClick={()=>setAcoes({...acoes,confirmou:!acoes.confirmou})}>✓ Família confirmou interesse</button><button type="button" className="success" onClick={()=>setAcoes({...acoes,matriculado:true,perdido:false})}>Matrícula confirmada</button><button type="button" className="loss" onClick={()=>setAcoes({...acoes,perdido:true,matriculado:false})}>Não converteu</button></div>{acoes.perdido&&<label className="crmLossReason">Motivo<input value={form.motivo_perda} onChange={e=>campo('motivo_perda',e.target.value)} placeholder="Ex.: valor, localização, horário, concorrente..."/></label>}<div className="crmFinishActions"><button type="button" className="primary crmSave" onClick={salvar}>Salvar atendimento</button><button type="button" className="crmPdfBtn" onClick={gerarPdfAtendimento}><FileText size={17}/>Gerar PDF para a família</button></div></section>}

  {selecionado&&historico.length>0&&<section className="panel crmHistory"><div className="panelHead"><div><h3>Linha do tempo da família</h3><p>Histórico recuperado automaticamente.</p></div></div>{historico.map(h=><article key={h.id}><div><strong>{LABELS[h.etapa]||h.etapa}</strong><small>{fmt(h.iniciado_at)} • {h.funcionario_nome}</small></div><span>{h.status}</span><p>{h.observacao_fechamento||h.observacao_abertura||'Sem observação.'}</p></article>)}</section>}

  <section className="panel crmReport"><div><CalendarDays size={22}/><div><h3>Atendimentos do dia ou período</h3><p>Os mesmos registros já estão disponíveis para a Direção em tempo real.</p></div></div><label>Início<input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)}/></label><label>Fim<input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)}/></label><button type="button" className="primary" onClick={relatorio}><Download size={17}/>Baixar relatório</button></section>
  <section className="panel crmPeriodList"><div className="panelHead"><div><h3>{dataInicio===dataFim?'Atendimentos do dia':'Atendimentos do período'}</h3><p>{atendimentosPeriodo.length} atendimento(s) de {dataInicio.split('-').reverse().join('/')} a {dataFim.split('-').reverse().join('/')}.</p></div></div><div className="crmPeriodRows">{atendimentosPeriodo.map(a=>{const c=clientes.find(x=>x.id===a.cliente_id)||{};return <article key={a.id}><div><strong>{c.nome_aluno||'Aluno não informado'}</strong><span>{c.nome_responsavel||'Responsável não informado'} • {fmt(a.iniciado_at)}</span><small>{c.serie||'Sem série'} • {c.turno_preferencia||'Sem turno'} • {c.bairro||'Sem bairro'}</small></div><div><b>{LABELS[a.etapa]||a.etapa}</b><span>{a.status==='concluido'?'Concluído':'Em andamento'}</span><small>{a.funcionario_nome} • {c.telefone||'sem telefone'}</small></div></article>})}{!atendimentosPeriodo.length&&<div className="empty">Nenhum atendimento encontrado nesse período.</div>}</div></section>
 </section>
}
