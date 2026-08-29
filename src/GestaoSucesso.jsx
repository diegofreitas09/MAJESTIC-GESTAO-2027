import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, LockKeyhole, Search, Send, ShieldCheck, XCircle } from 'lucide-react';
import { supabase } from './lib/supabase';
import { BASE_COMERCIAL_2026 } from './lib/comercial2026';

const LOCAL_KEY='majestic_gestao_sucesso';
const COMERCIAL_KEY='majestic_comercial_2027';
const STATUS={aguardando:'Aguardando Direção',autorizado:'Autorizado',negado:'Negado',concluido:'Concluído'};
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const num=v=>Number(String(v??'').replace(',','.'))||0;

function carregarLocal(){try{return JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]')}catch{return []}}
function salvarLocal(v){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(v))}catch{}}
function carregarComercial(){
  try{
    const salvo=JSON.parse(localStorage.getItem(COMERCIAL_KEY)||'null');
    const lista=Array.isArray(salvo)?salvo:[];
    const mapa=new Map(lista.map(i=>[i.id,i]));
    const oficiais=BASE_COMERCIAL_2026.map(base=>mapa.has(base.id)?{...base,...mapa.get(base.id),valor2026:base.valor2026}:base);
    const ids=new Set(BASE_COMERCIAL_2026.map(i=>i.id));
    return [...oficiais,...lista.filter(i=>!ids.has(i.id))];
  }catch{return BASE_COMERCIAL_2026}
}

export default function GestaoSucesso(){
  const [modo,setModo]=useState('gestao');
  const [registros,setRegistros]=useState([]);
  const [aviso,setAviso]=useState('');
  const [busca,setBusca]=useState('');
  const [filtroStatus,setFiltroStatus]=useState('todos');
  const [comercial]=useState(carregarComercial);
  const [categoriaCatalogo,setCategoriaCatalogo]=useState('Todas');
  const [buscaCatalogo,setBuscaCatalogo]=useState('');
  const [decisoes,setDecisoes]=useState({});
  const [fechamentos,setFechamentos]=useState({});
  const [form,setForm]=useState({responsavel:'',aluno:'',telefone:'',serie:'',categoria:'',produto:'',valor_tabela:'',desconto_solicitado:'',valor_solicitado:'',observacao_solicitacao:''});

  useEffect(()=>{carregar()},[]);

  const categorias=useMemo(()=>[...new Set(comercial.map(i=>i.categoria).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR')),[comercial]);
  const produtosCategoria=useMemo(()=>form.categoria?comercial.filter(i=>i.categoria===form.categoria):comercial,[comercial,form.categoria]);
  const produtosCatalogo=useMemo(()=>comercial.filter(i=>{
    const categoriaOk=categoriaCatalogo==='Todas'||i.categoria===categoriaCatalogo;
    const texto=`${i.produto||''} ${i.categoria||''} ${i.observacao||''}`.toLowerCase();
    return categoriaOk&&texto.includes(buscaCatalogo.toLowerCase());
  }),[comercial,categoriaCatalogo,buscaCatalogo]);
  const contagemCategoria=useMemo(()=>Object.fromEntries(categorias.map(c=>[c,comercial.filter(i=>i.categoria===c).length])),[categorias,comercial]);

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
      setAviso('Modo local ativo. Para sincronizar entre Gestão e Direção, aplique o SQL do módulo Gestão de Sucesso no Supabase.');
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

  function aplicarProduto(p){
    if(!p)return;
    const valor=num(p.valor2027||p.valor2026);
    setForm(f=>({...f,categoria:p.categoria||'',produto:p.produto||'',valor_tabela:valor,desconto_solicitado:'0',valor_solicitado:valor}));
    setTimeout(()=>document.getElementById('gs-form-atendimento')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
  }

  function selecionarProduto(produtoId){
    const p=comercial.find(i=>String(i.id)===String(produtoId));
    if(!p){setForm({...form,produto:'',valor_tabela:'',valor_solicitado:''});return}
    aplicarProduto(p);
  }

  function recalcularDesconto(valor){
    const desc=Math.min(Math.max(num(valor),0),100);
    const tabela=num(form.valor_tabela);
    const solicitado=Number((tabela*(1-desc/100)).toFixed(2));
    setForm({...form,desconto_solicitado:valor,valor_solicitado:solicitado});
  }

  async function solicitar(e){
    e.preventDefault();
    if(!form.responsavel.trim()||!form.aluno.trim()||!form.produto.trim())return;
    const r={id:`local-${Date.now()}`,responsavel:form.responsavel.trim(),aluno:form.aluno.trim(),telefone:form.telefone.trim(),serie:form.serie.trim(),produto:form.produto,categoria:form.categoria,valor_tabela:num(form.valor_tabela),desconto_solicitado:num(form.desconto_solicitado),valor_solicitado:num(form.valor_solicitado),observacao_solicitacao:form.observacao_solicitacao.trim(),status:'aguardando',valor_autorizado:null,observacao_direcao:'',observacao_final:'',created_at:new Date().toISOString()};
    await persistir([r,...registros],r);
    setForm({responsavel:'',aluno:'',telefone:'',serie:'',categoria:'',produto:'',valor_tabela:'',desconto_solicitado:'',valor_solicitado:'',observacao_solicitacao:''});
  }

  function atualizarDecisao(id,campo,valor){setDecisoes(d=>({...d,[id]:{valor:String(d[id]?.valor??registros.find(x=>x.id===id)?.valor_solicitado??''),observacao:d[id]?.observacao||'',[campo]:valor}}))}

  async function decidir(id,status){
    const atual=registros.find(x=>x.id===id);if(!atual)return;
    const d=decisoes[id]||{};
    const valorAut=status==='autorizado'?num(d.valor!==undefined?d.valor:atual.valor_solicitado):null;
    const alterado={...atual,status,valor_autorizado:valorAut,observacao_direcao:String(d.observacao||'').trim(),autorizado_at:new Date().toISOString()};
    await persistir(registros.map(x=>x.id===id?alterado:x),alterado);
  }

  async function concluir(id){
    const atual=registros.find(x=>x.id===id);if(!atual||atual.status!=='autorizado')return;
    const obs=String(fechamentos[id]||'').trim();
    const alterado={...atual,status:'concluido',observacao_final:obs,concluido_at:new Date().toISOString()};
    const novos=registros.map(x=>x.id===id?alterado:x);
    setRegistros(novos);salvarLocal(novos);
    try{
      if(!String(id).startsWith('local-')){
        const {data,error}=await supabase.rpc('concluir_atendimento_gestao',{p_id:id,p_observacao_final:obs||null});
        if(!error&&data){await carregar();return}
      }
      await persistir(novos,alterado);
    }catch{await persistir(novos,alterado)}
  }

  const cont=useMemo(()=>({aguardando:registros.filter(x=>x.status==='aguardando').length,autorizado:registros.filter(x=>x.status==='autorizado').length,negado:registros.filter(x=>x.status==='negado').length,concluido:registros.filter(x=>x.status==='concluido').length}),[registros]);
  const filtrados=useMemo(()=>registros.filter(r=>{
    const texto=`${r.aluno||''} ${r.responsavel||''} ${r.telefone||''} ${r.produto||''}`.toLowerCase();
    return (filtroStatus==='todos'||r.status===filtroStatus)&&texto.includes(busca.toLowerCase());
  }),[registros,busca,filtroStatus]);

  return <section className="gestaoSucessoPage">
    <div className="gsTop">
      <div><p className="eyebrow">APP OPERACIONAL</p><h1>Gestão de Sucesso</h1><p>A equipe recebe a família, consulta os valores oficiais e solicita liberação da Direção antes do fechamento.</p></div>
      <div className="gsMode"><button className={modo==='gestao'?'active':''} onClick={()=>setModo('gestao')}>Equipe Gestão</button><button className={modo==='direcao'?'active':''} onClick={()=>setModo('direcao')}>Direção</button></div>
    </div>

    {aviso&&<div className="alerta">{aviso}</div>}

    <div className="metrics gsMetrics">
      <article><div className="metricIcon"><Clock3 size={21}/></div><div><small>Aguardando</small><strong>{cont.aguardando}</strong><span>pedidos para liberar</span></div></article>
      <article><div className="metricIcon"><ShieldCheck size={21}/></div><div><small>Autorizados</small><strong>{cont.autorizado}</strong><span>podem ser finalizados</span></div></article>
      <article><div className="metricIcon"><XCircle size={21}/></div><div><small>Negados</small><strong>{cont.negado}</strong><span>não liberados</span></div></article>
      <article><div className="metricIcon"><CheckCircle2 size={21}/></div><div><small>Concluídos</small><strong>{cont.concluido}</strong><span>atendimentos encerrados</span></div></article>
    </div>

    {modo==='gestao'&&<>
      <section className="panel gsCatalog">
        <div className="panelHead gsCatalogHead"><div><h3>Consulta de mensalidades, produtos e serviços</h3><p>Valores oficiais disponíveis para apresentar à família durante o atendimento.</p></div><div className="search gsCatalogSearch"><Search size={15}/><input placeholder="Buscar produto ou serviço..." value={buscaCatalogo} onChange={e=>setBuscaCatalogo(e.target.value)}/></div></div>
        <div className="gsCatalogTabs"><button className={categoriaCatalogo==='Todas'?'active':''} onClick={()=>setCategoriaCatalogo('Todas')}>Todas <b>{comercial.length}</b></button>{categorias.map(c=><button key={c} className={categoriaCatalogo===c?'active':''} onClick={()=>setCategoriaCatalogo(c)}>{c} <b>{contagemCategoria[c]}</b></button>)}</div>
        <div className="gsCatalogGrid">{produtosCatalogo.map(p=><article className="gsCatalogCard" key={p.id}><div className="gsCatalogCardTop"><span>{p.categoria}</span><strong>{p.produto}</strong></div><div className="gsCatalogPrices"><div><small>Valor 2026</small><b>{money(p.valor2026)}</b></div><div className="current"><small>Valor 2027</small><b>{money(p.valor2027||p.valor2026)}</b></div></div>{p.observacao&&<p>{p.observacao}</p>}<button type="button" className="primary" onClick={()=>aplicarProduto(p)}>Usar no atendimento</button></article>)}{!produtosCatalogo.length&&<div className="empty">Nenhum produto encontrado nessa categoria.</div>}</div>
      </section>

      <form id="gs-form-atendimento" className="panel gsForm" onSubmit={solicitar}>
      <div className="panelHead"><div><h3>Novo pedido de autorização</h3><p>Preencha o atendimento e escolha um produto da tabela oficial.</p></div></div>
      <div className="gsFormGrid">
        <label>Responsável<input required value={form.responsavel} onChange={e=>setForm({...form,responsavel:e.target.value})}/></label>
        <label>Aluno<input required value={form.aluno} onChange={e=>setForm({...form,aluno:e.target.value})}/></label>
        <label>Telefone<input value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})}/></label>
        <label>Série / turma<input value={form.serie} onChange={e=>setForm({...form,serie:e.target.value})}/></label>
        <label>Categoria<select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value,produto:'',valor_tabela:'',desconto_solicitado:'',valor_solicitado:''})}><option value="">Todas as categorias</option>{categorias.map(c=><option key={c}>{c}</option>)}</select></label>
        <label>Produto / Plano<select required value={comercial.find(i=>i.produto===form.produto)?.id||''} onChange={e=>selecionarProduto(e.target.value)}><option value="">Selecione</option>{produtosCategoria.map(p=><option key={p.id} value={p.id}>{p.produto}</option>)}</select></label>
        <label>Valor de tabela<input readOnly value={form.valor_tabela!==''?money(form.valor_tabela):''}/></label>
        <label>Desconto solicitado %<input inputMode="decimal" value={form.desconto_solicitado} onChange={e=>recalcularDesconto(e.target.value)}/></label>
        <label>Valor solicitado<input inputMode="decimal" value={form.valor_solicitado} onChange={e=>setForm({...form,valor_solicitado:e.target.value})}/></label>
        <label className="gsWide">Observações da equipe<textarea rows="3" value={form.observacao_solicitacao} onChange={e=>setForm({...form,observacao_solicitacao:e.target.value})} placeholder="Motivo do desconto, condição combinada, observações da família..."/></label>
      </div>
      <button className="primary gsSend" type="submit"><Send size={17}/>Solicitar autorização à Direção</button>
    </form></>}

    <div className="panel gsQueue">
      <div className="panelHead gsQueueHead"><div><h3>{modo==='direcao'?'Fila para decisão da Direção':'Atendimentos da Gestão'}</h3><p>{modo==='direcao'?'A Direção pode ajustar o valor e registrar a decisão.':'A Gestão só consegue concluir depois da autorização.'}</p></div><div className="gsFilters"><div className="search"><Search size={15}/><input placeholder="Buscar aluno, responsável..." value={busca} onChange={e=>setBusca(e.target.value)}/></div><select value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)}><option value="todos">Todos</option><option value="aguardando">Aguardando</option><option value="autorizado">Autorizados</option><option value="negado">Negados</option><option value="concluido">Concluídos</option></select></div></div>

      <div className="gsCards">{filtrados.map(r=><article className={`gsCard status-${r.status}`} key={r.id}>
        <div className="gsCardTop"><div><strong>{r.aluno}</strong><small>{r.responsavel} • {r.telefone||'sem telefone'} • {r.serie||'sem série'}</small></div><span className="gsStatus">{STATUS[r.status]||r.status}</span></div>
        <div className="gsProduct"><b>{r.produto||'Produto não informado'}</b><span>{r.categoria||'Sem categoria'}</span></div>
        <div className="gsValues"><div><small>Tabela</small><strong>{money(r.valor_tabela||r.valor_solicitado)}</strong></div><div><small>Desconto pedido</small><strong>{num(r.desconto_solicitado).toFixed(2)}%</strong></div><div><small>Valor solicitado</small><strong>{money(r.valor_solicitado)}</strong></div>{r.valor_autorizado!=null&&<div className="approvedValue"><small>Valor autorizado</small><strong>{money(r.valor_autorizado)}</strong></div>}</div>
        {r.observacao_solicitacao&&<div className="gsNote"><b>Gestão:</b> {r.observacao_solicitacao}</div>}
        {r.observacao_direcao&&<div className="gsNote direction"><b>Direção:</b> {r.observacao_direcao}</div>}
        {r.observacao_final&&<div className="gsNote final"><b>Fechamento:</b> {r.observacao_final}</div>}

        {modo==='direcao'&&r.status==='aguardando'&&<div className="gsDecision"><label>Valor a autorizar<input inputMode="decimal" value={decisoes[r.id]?.valor??r.valor_solicitado??''} onChange={e=>atualizarDecisao(r.id,'valor',e.target.value)}/></label><label>Observação da Direção<input value={decisoes[r.id]?.observacao||''} onChange={e=>atualizarDecisao(r.id,'observacao',e.target.value)} placeholder="Condição autorizada ou motivo"/></label><div className="gsDecisionActions"><button className="primary" onClick={()=>decidir(r.id,'autorizado')}><ShieldCheck size={16}/>Autorizar</button><button className="gsReject" onClick={()=>decidir(r.id,'negado')}><XCircle size={16}/>Negar</button></div></div>}

        {modo==='gestao'&&r.status==='autorizado'&&<div className="gsClose"><textarea rows="2" placeholder="Observações finais do fechamento" value={fechamentos[r.id]||''} onChange={e=>setFechamentos({...fechamentos,[r.id]:e.target.value})}/><button className="primary" onClick={()=>concluir(r.id)}><CheckCircle2 size={16}/>Concluir atendimento</button></div>}
        {modo==='gestao'&&r.status==='aguardando'&&<div className="gsLocked"><LockKeyhole size={15}/>Conclusão bloqueada até a autorização da Direção.</div>}
      </article>)}{!filtrados.length&&<div className="empty">Nenhum atendimento encontrado.</div>}</div>
    </div>
  </section>
}
