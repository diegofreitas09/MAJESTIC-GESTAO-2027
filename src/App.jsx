import { useEffect, useMemo, useState } from 'react';
import { Bell, ChartNoAxesCombined, CircleDollarSign, Download, GraduationCap, LayoutDashboard, MessageCircleQuestion, Package, RefreshCw, Search, UserPlus, Users } from 'lucide-react';
import { supabase } from './lib/supabase';
import { gerarRelatorioExecutivoPDF } from './lib/reportPdf';

const fallback = { interessados: 0, atendimentos: 0, visitas: 0, propostas: 0, matriculas: 0, conversao: 0 };
const n = (v) => Number(v || 0);

function App() {
  const [resumo, setResumo] = useState(fallback);
  const [atendimentos, setAtendimentos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [perguntas, setPerguntas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregarDados() {
    setCarregando(true); setErro('');
    try {
      const [rResumo, rAtend, rProdutos, rPerguntas] = await Promise.all([
        supabase.from('vw_resumo_executivo').select('*').maybeSingle(),
        supabase.from('atendimentos').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('produtos_valores').select('*').order('created_at', { ascending: false }),
        supabase.from('perguntas_direcao').select('*').order('created_at', { ascending: false }).limit(20),
      ]);
      const falhas = [rResumo, rAtend, rProdutos, rPerguntas].filter(x => x.error);
      if (falhas.length === 4) throw falhas[0].error;
      if (rResumo.data) setResumo({ ...fallback, ...rResumo.data });
      setAtendimentos(rAtend.data || []); setProdutos(rProdutos.data || []); setPerguntas(rPerguntas.data || []);
      if (falhas.length) setErro('Parte dos módulos ainda aguarda permissão/dados no Supabase.');
    } catch (e) { setErro(e?.message || 'Não foi possível consultar o Supabase.'); }
    finally { setCarregando(false); }
  }

  useEffect(() => { carregarDados(); }, []);

  const metrics = useMemo(() => [
    ['Procuras', n(resumo.total_procuras ?? resumo.interessados), Users],
    ['Atendimentos', n(resumo.total_atendimentos ?? resumo.atendimentos), GraduationCap],
    ['Propostas', n(resumo.total_propostas ?? resumo.propostas), CircleDollarSign],
    ['Matrículas', n(resumo.total_matriculas ?? resumo.matriculas), UserPlus],
  ], [resumo]);

  const funil = useMemo(() => [
    { nome: 'Procuras', total: n(resumo.total_procuras ?? resumo.interessados) },
    { nome: 'Atendimentos', total: n(resumo.total_atendimentos ?? resumo.atendimentos) },
    { nome: 'Visitas', total: n(resumo.total_visitas ?? resumo.visitas) },
    { nome: 'Propostas', total: n(resumo.total_propostas ?? resumo.propostas) },
    { nome: 'Matrículas', total: n(resumo.total_matriculas ?? resumo.matriculas) },
  ], [resumo]);
  const maxFunil = Math.max(...funil.map(x => x.total), 1);
  const conversao = n(resumo.conversao ?? resumo.conversao_geral ?? (funil[0].total ? (funil[4].total / funil[0].total * 100).toFixed(1) : 0));
  const pendentes = perguntas.filter(p => !p.resposta && p.status !== 'respondida').length;

  function baixarPDF() {
    gerarRelatorioExecutivoPDF({
      periodo: 'Matrículas 2027',
      resumo: { interessados: funil[0].total, atendimentos: funil[1].total, visitas: funil[2].total, propostas: funil[3].total, matriculas: funil[4].total, conversao },
      funil, atendimentos, produtos, perguntas
    });
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brandM">M</span><div><strong>Majestic</strong><small>GESTÃO 2027</small></div></div>
      <nav><a className="active"><LayoutDashboard size={19}/> Dashboard</a><a><Users size={19}/> Procuras e interessados</a><a><GraduationCap size={19}/> Atendimentos</a><a><UserPlus size={19}/> Matrículas</a><a><Package size={19}/> Produtos e valores</a><a><MessageCircleQuestion size={19}/> Central da Direção {pendentes > 0 && <b>{pendentes}</b>}</a><a onClick={baixarPDF}><ChartNoAxesCombined size={19}/> Relatórios</a></nav>
      <div className="profile"><div className="avatar">D</div><div><strong>Direção</strong><small>Administrador</small></div></div>
    </aside>
    <main>
      <header><div><p className="eyebrow">PAINEL EXECUTIVO • DADOS DO SUPABASE</p><h1>Majestic Gestão 2027</h1><p>A Direção acompanha toda a operação e mantém a governança dos valores oficiais.</p></div><div className="headerActions"><button className="icon" onClick={carregarDados} title="Atualizar"><RefreshCw size={20}/></button><button className="primary" onClick={baixarPDF}><Download size={18}/> Baixar relatório PDF</button></div></header>
      {erro && <div className="alerta">{erro}</div>}
      <section className="campaign"><div><span>MATRÍCULAS 2027</span><h2>Direção informa. Gestão executa. Sistema registra.</h2><p>{carregando ? 'Atualizando indicadores...' : 'Indicadores atualizados a partir do banco de dados.'}</p></div><div className="conversion"><small>CONVERSÃO GERAL</small><strong>{conversao.toLocaleString('pt-BR')}%</strong><em>{funil[4].total} matrículas</em></div></section>
      <section className="metrics">{metrics.map(([label,value,Icon]) => <article key={label}><div className="metricIcon"><Icon size={21}/></div><div><small>{label}</small><strong>{carregando ? '...' : value}</strong><span>registrados no sistema</span></div></article>)}</section>
      <section className="grid">
        <article className="panel"><div className="panelHead"><div><h3>Funil de matrículas</h3><p>Da procura até a matrícula efetivada</p></div><button onClick={carregarDados}>Atualizar</button></div><div className="funnel">{funil.map(item => <div className="stage" key={item.nome}><div><span>{item.nome}</span><strong>{item.total}</strong></div><div className="bar"><i style={{width:`${item.total/maxFunil*100}%`}}/></div></div>)}</div></article>
        <article className="panel questions"><div className="panelHead"><div><h3>Central da Direção</h3><p>Orientações e decisões oficiais</p></div><span className="badge">{pendentes} pendentes</span></div>{perguntas.slice(0,3).map((p,i)=><div className="question" key={p.id || i}><span>{p.status || 'PENDENTE'}</span><strong>{p.assunto || p.pergunta || 'Solicitação da equipe'}</strong><p>{p.pergunta || p.descricao || ''}</p><small>{p.resposta ? `Direção: ${p.resposta}` : 'Aguardando orientação da Direção'}</small></div>)}{!perguntas.length && <div className="empty">Nenhuma pergunta registrada.</div>}</article>
      </section>
      <section className="panel recent"><div className="panelHead"><div><h3>Atendimentos recentes</h3><p>Histórico operacional da equipe</p></div><div className="search"><Search size={16}/> {atendimentos.length} registros carregados</div></div>{atendimentos.slice(0,6).map((a,i)=><div className="row" key={a.id || i}><b>{String(a.responsavel || a.aluno || 'AT').slice(0,2).toUpperCase()}</b><div><strong>{a.responsavel || a.aluno || 'Atendimento'}</strong><small>{a.aluno || a.canal || 'Família interessada'}</small></div><span className="status proposal">{a.resultado || a.status || 'REGISTRADO'}</span><small>{a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : ''}</small></div>)}{!atendimentos.length && <div className="empty">Ainda não há atendimentos registrados no banco.</div>)}</section>
      <section className="panel recent"><div className="panelHead"><div><h3>Valores oficiais da Direção</h3><p>Referência única para a equipe comercial — alterações dependem das políticas de acesso do Supabase.</p></div><span className="badge">{produtos.length} itens</span></div>{produtos.slice(0,8).map((p,i)=><div className="row" key={p.id || i}><b>R$</b><div><strong>{p.nome || p.produto || 'Produto'}</strong><small>{p.segmento || p.descricao || 'Valor oficial'}</small></div><span className="status success">{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n(p.valor))}</span><small>{p.publicado === false ? 'Interno' : 'Oficial'}</small></div>)}{!produtos.length && <div className="empty">Nenhum valor oficial cadastrado.</div>}</section>
    </main>
  </div>;
}
export default App;
