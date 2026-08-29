import { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, Clock3, MapPin, Phone, Search, UserRound, WalletCards } from 'lucide-react';

const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const dt=v=>v?new Date(v).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'-';
const onlyDate=v=>v?new Date(v).toLocaleDateString('pt-BR'):'-';
const onlyTime=v=>v?new Date(v).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'-';
const txt=v=>String(v??'').trim()||'-';
const etapa=v=>txt(v).replaceAll('_',' ');

export default function AtendimentosExecutivo({dados=[]}){
  const [busca,setBusca]=useState('');
  const [aberto,setAberto]=useState(null);
  const filtrados=useMemo(()=>{
    const q=busca.toLowerCase().trim();
    if(!q)return dados;
    return dados.filter(a=>`${a.nome_aluno||''} ${a.nome_responsavel||''} ${a.funcionario_nome||''} ${a.telefone||''} ${a.serie||''} ${a.bairro||''}`.toLowerCase().includes(q));
  },[dados,busca]);

  return <section className="panel modulePage atendExecPage">
    <div className="panelHead atendExecHead">
      <div><h3>Atendimentos</h3><p>Histórico sincronizado da equipe com data, horário, atendente e dados do cadastro.</p></div>
      <div className="atendExecTools"><div className="search"><Search size={16}/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar aluno, responsável, atendente..."/></div><span>{filtrados.length} registros</span></div>
    </div>

    <div className="atendExecList">{filtrados.map(a=>{
      const isOpen=aberto===a.id;
      const orcamento=Array.isArray(a.orcamento_json)?a.orcamento_json:[];
      return <article className={`atendExecCard ${isOpen?'open':''}`} key={a.id}>
        <button type="button" className="atendExecSummary" onClick={()=>setAberto(isOpen?null:a.id)}>
          <div className="atendExecAvatar">{String(a.nome_aluno||'AT').slice(0,2).toUpperCase()}</div>
          <div className="atendExecMain"><strong>{txt(a.nome_aluno)}</strong><small>{txt(a.nome_responsavel)}</small></div>
          <div className="atendExecMeta"><span><CalendarDays size={14}/>{onlyDate(a.iniciado_at)}</span><span><Clock3 size={14}/>{onlyTime(a.iniciado_at)}</span><span><UserRound size={14}/>{txt(a.funcionario_nome)}</span></div>
          <div className="atendExecTags"><em>{etapa(a.etapa)}</em><b className={`execStatus ${a.status||''}`}>{etapa(a.status)}</b></div>
          {isOpen?<ChevronUp size={18}/>:<ChevronDown size={18}/>} 
        </button>

        {isOpen&&<div className="atendExecDetail">
          <div className="atendExecGrid">
            <div><small>Início do atendimento</small><strong>{dt(a.iniciado_at)}</strong></div>
            <div><small>Última atualização</small><strong>{dt(a.updated_at)}</strong></div>
            <div><small>Encerramento</small><strong>{dt(a.encerrado_at)}</strong></div>
            <div><small>Atendente</small><strong>{txt(a.funcionario_nome)}</strong></div>
            <div><small>Série</small><strong>{txt(a.serie)}</strong></div>
            <div><small>Turno</small><strong>{txt(a.turno_preferencia)}</strong></div>
            <div><small>Telefone</small><strong><Phone size={13}/>{txt(a.telefone)}</strong></div>
            <div><small>Bairro</small><strong><MapPin size={13}/>{txt(a.bairro)}</strong></div>
            <div><small>Origem</small><strong>{txt(a.origem)}</strong></div>
            <div><small>Tipo de aluno</small><strong>{txt(a.tipo_aluno)}</strong></div>
            <div><small>Interesse principal</small><strong>{txt(a.interesse_principal)}</strong></div>
            <div><small>Próximo contato</small><strong>{dt(a.proximo_contato_at)}</strong></div>
          </div>

          <div className="atendExecBudget">
            <div className="atendExecBudgetHead"><span><WalletCards size={17}/>Orçamento apresentado</span><strong>{money(a.valor_orcamento)}</strong></div>
            {orcamento.length>0?<div className="atendExecBudgetItems">{orcamento.map((item,i)=><div key={`${item.id||item.produto||'item'}-${i}`}><span>{item.categoria||'Item'} · {item.produto||item.nome||'Produto/serviço'}</span><b>{money(item.valor2027??item.valor)}</b></div>)}</div>:<p>Nenhum item de orçamento salvo neste atendimento.</p>}
          </div>
        </div>}
      </article>
    })}{!filtrados.length&&<div className="empty">Nenhum atendimento encontrado.</div>}</div>
  </section>;
}
