import { Bell, ChartNoAxesCombined, CircleDollarSign, GraduationCap, LayoutDashboard, MessageCircleQuestion, Package, Search, UserPlus, Users } from 'lucide-react';

const metrics = [
  ['Interessados', '124', '+18%', Users],
  ['Visitas', '38', '+9%', GraduationCap],
  ['Propostas', '29', '+12%', CircleDollarSign],
  ['Matrículas', '17', '+21%', UserPlus],
];

const stages = [
  ['Novos', 42], ['Em contato', 31], ['Visita', 21], ['Proposta', 13], ['Matrícula', 17]
];

function App() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandM">M</span><div><strong>Majestic</strong><small>GESTÃO 2027</small></div></div>
        <nav>
          <a className="active"><LayoutDashboard size={19}/> Dashboard</a>
          <a><Users size={19}/> Interessados</a>
          <a><UserPlus size={19}/> Matrículas</a>
          <a><Package size={19}/> Produtos e valores</a>
          <a><MessageCircleQuestion size={19}/> Central da Direção <b>5</b></a>
          <a><ChartNoAxesCombined size={19}/> Relatórios</a>
        </nav>
        <div className="profile"><div className="avatar">D</div><div><strong>Direção</strong><small>Administrador</small></div></div>
      </aside>

      <main>
        <header><div><p className="eyebrow">PAINEL EXECUTIVO</p><h1>Bom dia, Direção 👋</h1><p>Acompanhe a campanha de Matrículas 2027.</p></div><div className="headerActions"><button className="icon"><Bell size={20}/><i/></button><button className="primary"><UserPlus size={18}/> Novo interessado</button></div></header>

        <section className="campaign"><div><span>MATRÍCULAS 2027</span><h2>Educação que encanta. Gestão que converte.</h2><p>Dados comerciais da equipe em uma única visão.</p></div><div className="conversion"><small>CONVERSÃO GERAL</small><strong>13,7%</strong><em>+2,4% no período</em></div></section>

        <section className="metrics">{metrics.map(([label,value,growth,Icon]) => <article key={label}><div className="metricIcon"><Icon size={21}/></div><div><small>{label}</small><strong>{value}</strong><span>{growth} no período</span></div></article>)}</section>

        <section className="grid">
          <article className="panel"><div className="panelHead"><div><h3>Funil de matrículas</h3><p>Jornada das famílias interessadas</p></div><button>Ver CRM</button></div><div className="funnel">{stages.map(([name,n],i) => <div className="stage" key={name}><div><span>{name}</span><strong>{n}</strong></div><div className="bar"><i style={{width:`${100-i*14}%`}}/></div></div>)}</div></article>
          <article className="panel questions"><div className="panelHead"><div><h3>Central da Direção</h3><p>Dúvidas aguardando orientação</p></div><span className="badge">5 pendentes</span></div><div className="question"><span>URGENTE</span><strong>Condição para dois irmãos</strong><p>Família deseja matricular dois alunos. Existe condição especial?</p><small>Ana • Equipe de Matrículas • há 18 min</small></div><div className="question"><span>NOVA</span><strong>Material didático 2027</strong><p>O valor informado já inclui o material?</p><small>Carla • Atendimento • há 42 min</small></div><button className="full">Responder perguntas</button></article>
        </section>

        <section className="panel recent"><div className="panelHead"><div><h3>Últimos interessados</h3><p>Movimentações recentes da equipe</p></div><div className="search"><Search size={16}/> Buscar família</div></div><div className="row"><b>MO</b><div><strong>Maria Oliveira</strong><small>Infantil IV</small></div><span className="status visit">VISITA AGENDADA</span><small>Hoje, 09:30</small></div><div className="row"><b>JS</b><div><strong>João Silva</strong><small>2º ano</small></div><span className="status proposal">PROPOSTA</span><small>Ontem, 16:45</small></div><div className="row"><b>LC</b><div><strong>Lucas Costa</strong><small>4º ano</small></div><span className="status success">MATRICULADO</span><small>Ontem, 14:10</small></div></section>
      </main>
    </div>
  );
}

export default App;
