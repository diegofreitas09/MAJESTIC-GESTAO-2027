import { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, Mail, MapPin, Phone, Search, School, UserRound } from 'lucide-react';

const dt=v=>v?new Date(v).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'-';
const txt=v=>String(v??'').trim()||'-';
const status=v=>txt(v).replaceAll('_',' ');

export default function ClientesExecutivo({dados=[],modo='interessados'}){
  const [busca,setBusca]=useState('');
  const [aberto,setAberto]=useState(null);
  const filtrados=useMemo(()=>{
    const base=modo==='matriculas'?dados.filter(x=>x.matriculado===true):dados;
    const q=busca.toLowerCase().trim();
    if(!q)return base;
    return base.filter(x=>`${x.nome_aluno||''} ${x.nome_responsavel||''} ${x.telefone||''} ${x.email||''} ${x.serie||''} ${x.bairro||''} ${x.escola_atual||''}`.toLowerCase().includes(q));
  },[dados,busca,modo]);

  const titulo=modo==='matriculas'?'Matrículas':'Procuras e interessados';
  const subtitulo=modo==='matriculas'?'Famílias com matrícula confirmada no CRM.':'Cadastros completos realizados pela Gestão de Sucesso.';

  return <section className="panel modulePage clienteExecPage">
    <div className="panelHead clienteExecHead">
      <div><h3>{titulo}</h3><p>{subtitulo}</p></div>
      <div className="clienteExecTools"><div className="search"><Search size={16}/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar aluno, responsável, telefone..."/></div><span>{filtrados.length} registros</span></div>
    </div>
    <div className="clienteExecList">{filtrados.map(c=>{
      const isOpen=aberto===c.id;
      return <article className={`clienteExecCard ${isOpen?'open':''}`} key={c.id}>
        <button type="button" className="clienteExecSummary" onClick={()=>setAberto(isOpen?null:c.id)}>
          <div className="clienteExecAvatar">{String(c.nome_aluno||'AL').slice(0,2).toUpperCase()}</div>
          <div className="clienteExecMain"><strong>{txt(c.nome_aluno)}</strong><small>{txt(c.nome_responsavel)}</small></div>
          <div className="clienteExecMeta"><span><Phone size={14}/>{txt(c.telefone)}</span><span><School size={14}/>{txt(c.serie)}</span><span><CalendarDays size={14}/>{dt(c.created_at)}</span></div>
          <div className="clienteExecTags"><em>{status(c.status_funil)}</em>{c.matriculado&&<b>MATRICULADO</b>}</div>
          {isOpen?<ChevronUp size={18}/>:<ChevronDown size={18}/>} 
        </button>
        {isOpen&&<div className="clienteExecDetail">
          <div className="clienteExecGrid">
            <div><small>Responsável</small><strong><UserRound size={13}/>{txt(c.nome_responsavel)}</strong></div>
            <div><small>Telefone</small><strong><Phone size={13}/>{txt(c.telefone)}</strong></div>
            <div><small>E-mail</small><strong><Mail size={13}/>{txt(c.email)}</strong></div>
            <div><small>Aluno</small><strong>{txt(c.nome_aluno)}</strong></div>
            <div><small>Data de nascimento</small><strong>{c.data_nascimento?new Date(`${c.data_nascimento}T12:00:00`).toLocaleDateString('pt-BR'):'-'}</strong></div>
            <div><small>Idade</small><strong>{txt(c.idade)}</strong></div>
            <div><small>Série</small><strong>{txt(c.serie)}</strong></div>
            <div><small>Turno preferido</small><strong>{txt(c.turno_preferencia)}</strong></div>
            <div><small>Bairro</small><strong><MapPin size={13}/>{txt(c.bairro)}</strong></div>
            <div><small>Escola atual</small><strong><School size={13}/>{txt(c.escola_atual)}</strong></div>
            <div><small>Tipo de aluno</small><strong>{txt(c.tipo_aluno)}</strong></div>
            <div><small>Origem</small><strong>{txt(c.origem)}</strong></div>
            <div><small>Interesse principal</small><strong>{txt(c.interesse_principal)}</strong></div>
            <div><small>Possui laudo</small><strong>{c.possui_laudo===true?'Sim':c.possui_laudo===false?'Não':'-'}</strong></div>
            <div><small>Próximo contato</small><strong>{dt(c.proximo_contato_at)}</strong></div>
            <div><small>Cadastrado em</small><strong>{dt(c.created_at)}</strong></div>
            <div><small>Última atualização</small><strong>{dt(c.updated_at)}</strong></div>
            <div><small>Matrícula confirmada em</small><strong>{dt(c.matriculado_at)}</strong></div>
          </div>
        </div>}
      </article>
    })}{!filtrados.length&&<div className="empty">Nenhum registro encontrado.</div>}</div>
  </section>;
}
