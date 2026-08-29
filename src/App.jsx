import { useEffect, useMemo, useState } from 'react';
import { BellRing, ChartNoAxesCombined, CircleDollarSign, Download, GraduationCap, Handshake, LayoutDashboard, MessageCircleQuestion, Package, RefreshCw, Search, UserPlus, Users } from 'lucide-react';
import { supabase } from './lib/supabase';
import { gerarRelatorioExecutivoPDF } from './lib/reportPdf';
import ProdutosValores from './ProdutosValores';
import GestaoSucesso from './GestaoSucesso';
import ResumoCRM from './ResumoCRM';
import AtendimentosExecutivo from './AtendimentosExecutivo';
import ClientesExecutivo from './ClientesExecutivo';
import { BASE_COMERCIAL_2026 } from './lib/comercial2026';
import majesticLogo from '../majestic-logo.png';

const fallback={interessados:0,atendimentos:0,visitas:0,propostas:0,matriculas:0,conversao:0};
const n=v=>Number(v||0);
const COMERCIAL_KEY='majestic_comercial_2027';
const MENU=[['dashboard','Dashboard',LayoutDashboard],['interessados','Procuras e interessados',Users],['atendimentos','Atendimentos',GraduationCap],['gestao-sucesso','Gestão de Sucesso',Handshake],['matriculas','Matrículas',UserPlus],['produtos','Produtos e valores',Package],['direcao','Central da Direção',MessageCircleQuestion]];
const lerComercial=()=>{try{const salvo=localStorage.getItem(COMERCIAL_KEY);return salvo?JSON.parse(salvo):BASE_COMERCIAL_2026}catch{return BASE_COMERCIAL_2026}};

function App(){
 const [pagina,setPagina]=useState(()=>window.location.hash.replace('#/','')||'dashboard');
 const [resumo,setResumo]=useState(fallback),[interessados,setInteressados]=useState([]),[atendimentos,setAtendimentos]=useState([]),[matriculas,setMatriculas]=useState([]),[produtos,setProdutos]=useState([]),[perguntas,setPerguntas]=useState([]),[autorizacoes,setAutorizacoes]=useState([]),[carregando,setCarregando]=useState(true),[erro,setErro]=useState('');
 function navegar(p){setPagina(p);window.location.hash=`/${p}`;window.scrollTo({top:0,behavior:'smooth'});}
 useEffect(()=>{const f=()=>setPagina(window.location.hash.replace('#/','')||'dashboard');window.addEventListener('hashchange',f);return()=>window.removeEventListener('hashchange',f)},[]);
 async function carregarTabela(t, limite=1000){const {data,error}=await supabase.from(t).select('*').limit(limite);return {data:data||[],error,tabela:t}}
 async function carregarDados(){
  setCarregando(true);setErro('');
  try{
   const [clientesR,atendR,prodR,pergR,autR]=await Promise.all([
    supabase.from('gestao_clientes').select('*').order('created_at',{ascending:false}).limit(1000),
    supabase.from('vw_gestao_atendimentos_detalhado').select('*').order('iniciado_at',{ascending:false}).limit(1000),
    carregarTabela('produtos'),carregarTabela('perguntas_direcao'),carregarTabela('autorizacoes_gestao')
   ]);
   const clientes=clientesR.data||[], atend=atendR.data||[];
   const mats=clientes.filter(c=>c.matriculado===true);
   setInteressados(clientes);setAtendimentos(atend);setMatriculas(mats);setProdutos(prodR.data);setPerguntas(pergR.data);setAutorizacoes(autR.data);
   const propostas=atend.filter(a=>['proposta','decisao','matriculado'].includes(a.etapa)).length;
   const visitas=atend.filter(a=>['visita','proposta','decisao','matriculado'].includes(a.etapa)).length;
   setResumo({total_procuras:clientes.length,total_atendimentos:atend.length,total_em_atendimento:atend.filter(a=>a.status==='em_andamento').length,total_visitas:visitas,total_propostas:propostas,total_matriculas:mats.length,conversao_percentual:clientes.length?mats.length/clientes.length*100:0});
   const falhas=[clientesR,atendR,prodR,pergR,autR].filter(x=>x.error);
   if(falhas.length)setErro(`Conexão ativa. ${falhas.length} módulo(s) precisam de ajuste de tabela/permissão no Supabase.`);
  }catch(e){setErro(e?.message||'Não foi possível consultar o Supabase.')}finally{setCarregando(false)}
 }
 useEffect(()=>{carregarDados()},[]);
 useEffect(()=>{const canal=supabase.channel('majestic-executivo-crm').on('postgres_changes',{event:'*',schema:'public',table:'gestao_clientes'},carregarDados).on('postgres_changes',{event:'*',schema:'public',table:'gestao_atendimentos'},carregarDados).on('postgres_changes',{event:'*',schema:'public',table:'autorizacoes_gestao'},carregarDados).subscribe();return()=>{supabase.removeChannel(canal)}},[]);
 const funil=useMemo(()=>[{nome:'Procuras',total:n(resumo.total_procuras??interessados.length)},{nome:'Atendimentos',total:n(resumo.total_atendimentos??atendimentos.length)},{nome:'Visitas',total:n(resumo.total_visitas)},{nome:'Propostas',total:n(resumo.total_propostas)},{nome:'Matrículas',total:n(resumo.total_matriculas??matriculas.length)}],[resumo,interessados,atendimentos,matriculas]);
 const maxFunil=Math.max(...funil.map(x=>x.total),1),conversao=n(resumo.conversao_percentual??(funil[0].total?funil[4].total/funil[0].total*100:0)),pendentes=perguntas.filter(p=>!p.resposta&&p.status!=='respondida').length;
 const autorizacoesPendentes=autorizacoes.filter(a=>a.status==='aguardando').length;
 const autorizacoesLiberadas=autorizacoes.filter(a=>a.status==='autorizado').length;
 const metrics=[['Procuras',funil[0].total,Users],['Atendimentos',funil[1].total,GraduationCap],['Propostas',funil[3].total,CircleDollarSign],['Matrículas',funil[4].total,UserPlus]];
 async function baixarPDF(){await gerarRelatorioExecutivoPDF({periodo:'Matrículas 2027',resumo:{interessados:funil[0].total,atendimentos:funil[1].total,visitas:funil[2].total,propostas:funil[3].total,matriculas:funil[4].total,conversao},funil,interessados,atendimentos,matriculas,produtosSupabase:produtos,produtosComerciais:lerComercial(),perguntas})}
 const Lista=({titulo,subtitulo,dados,vazio})=><section className="panel recent modulePage"><div className="panelHead"><div><h3>{titulo}</h3><p>{subtitulo}</p></div><div className="search"><Search size={16}/>{dados.length} registros</div></div>{dados.map((x,i)=><div className="row" key={x.id||i}><b>{String(x.nome_aluno||x.nome||x.responsavel||x.aluno||titulo).slice(0,2).toUpperCase()}</b><div><strong>{x.nome_aluno||x.nome||x.responsavel||x.aluno||x.produto||'Registro'}</strong><small>{x.nome_responsavel||x.telefone||x.funcionario_nome||x.descricao||x.email||'Cadastrado no sistema'}</small></div><span className="status proposal">{x.etapa||x.status||x.situacao||(x.matriculado?'MATRICULADO':'REGISTRADO')}</span></div>)}{!dados.length&&<div className="empty">{vazio}</div>}</section>;
 return <div className="shell"><aside className="sidebar"><div className="brand brandOfficial"><img src={majesticLogo} alt="Berçário e Creche Escola Majestic"/><div className="brandFallback" style={{display:'none'}}/></div><nav>{MENU.map(([id,label,Icon])=><button type="button" key={id} className={pagina===id?'navButton active':'navButton'} onClick={()=>navegar(id)}><Icon size={19}/>{label}{id==='direcao'&&pendentes>0&&<b>{pendentes}</b>}{id==='gestao-sucesso'&&autorizacoesPendentes>0&&<b>{autorizacoesPendentes}</b>}</button>)}<button type="button" className="navButton" onClick={baixarPDF}><ChartNoAxesCombined size={19}/>Relatórios</button></nav><div className="profile"><div className="avatar">D</div><div><strong>Direção</strong><small>Administrador</small></div></div></aside><main><header><div><img className="headerLogo" src={majesticLogo} alt="Majestic"/><p className="eyebrow">PAINEL EXECUTIVO • DADOS DO SUPABASE</p><h1>Majestic Gestão 2027</h1><p>A Direção acompanha toda a operação e mantém a governança dos valores oficiais.</p></div><div className="headerActions"><button className="icon" onClick={carregarDados}><RefreshCw size={20}/></button><button className="primary" onClick={baixarPDF}><Download size={18}/>Baixar relatório PDF</button></div></header>{erro&&<div className="alerta">{erro}</div>}
 {autorizacoesPendentes>0&&pagina!=='gestao-sucesso'&&<button className="authNotification" type="button" onClick={()=>navegar('gestao-sucesso')}><span className="authBell"><BellRing size={20}/></span><span><strong>{autorizacoesPendentes} autorização(ões) aguardando decisão</strong><small>Toque para abrir a fila da Gestão de Sucesso.</small></span><b>VER AGORA</b></button>}
 {pagina==='dashboard'&&<><section className="campaign"><div><span>MATRÍCULAS 2027</span><h2>Direção informa. Gestão executa. Sistema registra.</h2><p>{carregando?'Atualizando indicadores...':'Indicadores sincronizados com a Gestão de Sucesso.'}</p></div><div className="conversion"><small>CONVERSÃO GERAL</small><strong>{conversao.toLocaleString('pt-BR',{maximumFractionDigits:2})}%</strong><em>{funil[4].total} matrículas</em></div></section><section className="metrics">{metrics.map(([label,value,Icon])=><article key={label}><div className="metricIcon"><Icon size={21}/></div><div><small>{label}</small><strong>{carregando?'...':value}</strong><span>registrados no CRM</span></div></article>)}</section><section className="authIndicators"><button type="button" className="authIndicator pending" onClick={()=>navegar('gestao-sucesso')}><BellRing size={22}/><div><small>Autorizações pendentes</small><strong>{autorizacoesPendentes}</strong><span>Aguardando decisão da Direção</span></div></button><button type="button" className="authIndicator approved" onClick={()=>navegar('gestao-sucesso')}><Handshake size={22}/><div><small>Liberadas para fechamento</small><strong>{autorizacoesLiberadas}</strong><span>Aguardando conclusão da Gestão</span></div></button></section><ResumoCRM onOpen={()=>navegar('gestao-sucesso')}/><section className="grid"><article className="panel"><div className="panelHead"><div><h3>Funil de matrículas</h3><p>Da procura até a matrícula efetivada</p></div><button onClick={carregarDados}>Atualizar</button></div><div className="funnel">{funil.map(item=><div className="stage" key={item.nome}><div><span>{item.nome}</span><strong>{item.total}</strong></div><div className="bar"><i style={{width:`${item.total/maxFunil*100}%`}}/></div></div>)}</div></article><article className="panel questions"><div className="panelHead"><div><h3>Central da Direção</h3><p>Orientações e decisões oficiais</p></div><span className="badge">{pendentes} pendentes</span></div>{!perguntas.length&&<div className="empty">Nenhuma pergunta registrada.</div>}</article></section></>}
 {pagina==='interessados'&&<ClientesExecutivo dados={interessados} modo="interessados"/>}{pagina==='atendimentos'&&<AtendimentosExecutivo dados={atendimentos}/>} {pagina==='gestao-sucesso'&&<GestaoSucesso/>}{pagina==='matriculas'&&<ClientesExecutivo dados={matriculas} modo="matriculas"/>}{pagina==='produtos'&&<ProdutosValores/>}{pagina==='direcao'&&<Lista titulo="Central da Direção" subtitulo="Perguntas, orientações e decisões oficiais" dados={perguntas} vazio="Nenhuma pergunta registrada."/>}</main></div>}
export default App;