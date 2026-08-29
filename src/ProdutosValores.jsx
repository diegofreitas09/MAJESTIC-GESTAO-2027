import { Fragment, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { BASE_COMERCIAL_2026 } from './lib/comercial2026';

const moeda=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const KEY='majestic_comercial_2027';
const ORDEM_CATEGORIAS=['Mensalidade','Berçário','Tempo Integral','Fardamento','Material Didático','Material/Serviço','Alimentação','Day Care','Esportes','Taxa','Outros'];
const storage={
 get(){try{return window.localStorage?.getItem(KEY)||null}catch{return null}},
 set(value){try{window.localStorage?.setItem(KEY,value);return true}catch{return false}}
};
const mesclarBaseOficial=salvos=>{
 const lista=Array.isArray(salvos)?salvos:[];
 const mapa=new Map(lista.map(i=>[i.id,i]));
 const oficiais=BASE_COMERCIAL_2026.map(base=>mapa.has(base.id)?{...base,...mapa.get(base.id),valor2026:base.valor2026}:base);
 const ids=new Set(BASE_COMERCIAL_2026.map(i=>i.id));
 const personalizados=lista.filter(i=>!ids.has(i.id));
 return [...oficiais,...personalizados];
};

export default function ProdutosValores(){
 const [itens,setItens]=useState(()=>{const salvo=storage.get();if(!salvo)return BASE_COMERCIAL_2026;try{const mesclados=mesclarBaseOficial(JSON.parse(salvo));storage.set(JSON.stringify(mesclados));return mesclados}catch{return BASE_COMERCIAL_2026}});
 const [salvoLocal,setSalvoLocal]=useState(true);
 const [categoriaAtiva,setCategoriaAtiva]=useState('Todas');
 const [novo,setNovo]=useState({categoria:'Outros',produto:'',valor2026:'',reajuste:'',valor2027:'',observacao:''});
 const salvar=t=>{setItens(t);setSalvoLocal(storage.set(JSON.stringify(t)))};
 const numero=v=>Number(String(v??'').replace(',','.'))||0;
 const atualizar=(id,campo,valor)=>{const t=itens.map(i=>{if(i.id!==id)return i;const prox={...i,[campo]:valor};if(campo==='reajuste')prox.valor2027=Number((numero(i.valor2026)*(1+numero(valor)/100)).toFixed(2));if(campo==='valor2027')prox.valor2027=numero(valor);if(campo==='observacao')prox.observacao=valor;return prox});salvar(t)};
 const adicionar=()=>{if(!novo.produto.trim())return;const v26=numero(novo.valor2026),r=numero(novo.reajuste),v27=novo.valor2027!==''?numero(novo.valor2027):Number((v26*(1+r/100)).toFixed(2));salvar([...itens,{id:`p-${Date.now()}`,categoria:novo.categoria||'Outros',produto:novo.produto,valor2026:v26,reajuste:r,valor2027:v27,observacao:novo.observacao||''}]);setNovo({categoria:'Outros',produto:'',valor2026:'',reajuste:'',valor2027:'',observacao:''})};
 const excluir=id=>salvar(itens.filter(i=>i.id!==id));
 const categorias=useMemo(()=>{
   const existentes=[...new Set(itens.map(i=>i.categoria||'Outros'))];
   return existentes.sort((a,b)=>{const ia=ORDEM_CATEGORIAS.indexOf(a),ib=ORDEM_CATEGORIAS.indexOf(b);return (ia<0?999:ia)-(ib<0?999:ib)||a.localeCompare(b,'pt-BR')});
 },[itens]);
 const itensVisiveis=useMemo(()=>categoriaAtiva==='Todas'?itens:itens.filter(i=>(i.categoria||'Outros')===categoriaAtiva),[itens,categoriaAtiva]);
 const grupos=useMemo(()=>categorias.map(cat=>({categoria:cat,itens:itensVisiveis.filter(i=>(i.categoria||'Outros')===cat)})).filter(g=>g.itens.length),[categorias,itensVisiveis]);
 const max=Math.max(...itensVisiveis.flatMap(i=>[numero(i.valor2026),numero(i.valor2027)]),1);
 const media=useMemo(()=>itens.length?itens.reduce((s,i)=>s+numero(i.reajuste),0)/itens.length:0,[itens]);
 const maior=useMemo(()=>Math.max(...itens.map(i=>numero(i.reajuste)),0),[itens]);
 const contagem=cat=>cat==='Todas'?itens.length:itens.filter(i=>(i.categoria||'Outros')===cat).length;
 return <div className="comercialPage">
  <section className="commercialSummary"><article><small>Produtos cadastrados</small><strong>{itens.length}</strong></article><article><small>Reajuste médio</small><strong>{media.toFixed(2)}%</strong></article><article><small>Maior reajuste</small><strong>{maior.toFixed(2)}%</strong></article><article><small>Base histórica</small><strong>2026 fixa</strong></article></section>

  <section className="panel categoryPanel">
   <div className="panelHead"><div><h3>Categorias</h3><p>Selecione uma categoria para visualizar somente os itens relacionados.</p></div><span className="categoryCount">{itensVisiveis.length} item(ns)</span></div>
   <div className="categoryTabs">
    {['Todas',...categorias].map(cat=><button key={cat} type="button" className={categoriaAtiva===cat?'categoryTab active':'categoryTab'} onClick={()=>setCategoriaAtiva(cat)}><span>{cat}</span><b>{contagem(cat)}</b></button>)}
   </div>
  </section>

  <section className="panel commercialChart"><div className="panelHead"><div><h3>Comparativo 2026 x 2027</h3><p>{categoriaAtiva==='Todas'?'Exibindo todas as categorias.':'Categoria: '+categoriaAtiva}</p></div><div className="legend"><span><i className="dot2026"/>2026</span><span><i className="dot2027"/>2027</span></div></div><div className="chartRows">{itensVisiveis.map(i=><div className="chartItem" key={i.id}><div className="chartLabel"><strong>{i.produto}</strong><small>{i.categoria}</small></div><div className="bars"><div className="barLine"><span>2026</span><div><i className="y2026" style={{width:`${numero(i.valor2026)/max*100}%`}}/></div><b>{moeda(i.valor2026)}</b></div><div className="barLine"><span>2027</span><div><i className="y2027" style={{width:`${numero(i.valor2027)/max*100}%`}}/></div><b>{moeda(i.valor2027)}</b></div></div></div>)}</div></section>

  <section className="panel commercialTable"><div className="panelHead"><div><h3>Tabela comercial por categoria</h3><p>Os produtos foram separados em blocos para facilitar a consulta e edição.</p></div><span className={salvoLocal?'saveHint':'saveHint warn'}><Save size={15}/>{salvoLocal?'Salvo neste aparelho':'Modo temporário no iPhone'}</span></div><div className="tableWrap"><table><thead><tr><th>Produto / Plano</th><th>Valor 2026</th><th>Reajuste %</th><th>Valor 2027</th><th>Observação</th><th></th></tr></thead><tbody>{grupos.map(grupo=><Fragment key={grupo.categoria}><tr className="categoryDivider"><td colSpan="6"><div><strong>{grupo.categoria}</strong><span>{grupo.itens.length} item(ns)</span></div></td></tr>{grupo.itens.map(i=><tr key={i.id}><td><strong>{i.produto}</strong></td><td className="locked">{moeda(i.valor2026)}</td><td><input inputMode="decimal" type="text" value={i.reajuste} onChange={e=>atualizar(i.id,'reajuste',e.target.value)}/></td><td><input inputMode="decimal" type="text" value={i.valor2027} onChange={e=>atualizar(i.id,'valor2027',e.target.value)}/></td><td><input type="text" value={i.observacao||''} onChange={e=>atualizar(i.id,'observacao',e.target.value)}/></td><td><button type="button" className="dangerIcon" onClick={()=>excluir(i.id)} aria-label={`Excluir ${i.produto}`}><Trash2 size={16}/></button></td></tr>)}</Fragment>)}</tbody></table></div></section>

  <section className="panel addProduct"><div className="panelHead"><div><h3>Adicionar produto</h3><p>Inclua o novo item já dentro da categoria correta.</p></div></div><div className="formGrid"><label>Produto<input type="text" value={novo.produto} onChange={e=>setNovo({...novo,produto:e.target.value})} placeholder="Ex.: Camisa oficial"/></label><label>Categoria<select value={novo.categoria} onChange={e=>setNovo({...novo,categoria:e.target.value})}><option>Outros</option><option>Mensalidade</option><option>Berçário</option><option>Tempo Integral</option><option>Material/Serviço</option><option>Material Didático</option><option>Fardamento</option><option>Taxa</option><option>Alimentação</option><option>Day Care</option><option>Esportes</option></select></label><label>Valor 2026<input inputMode="decimal" type="text" value={novo.valor2026} onChange={e=>setNovo({...novo,valor2026:e.target.value})}/></label><label>Reajuste %<input inputMode="decimal" type="text" value={novo.reajuste} onChange={e=>setNovo({...novo,reajuste:e.target.value})}/></label><label>Valor 2027<input inputMode="decimal" type="text" value={novo.valor2027} onChange={e=>setNovo({...novo,valor2027:e.target.value})} placeholder="Opcional"/></label><label className="wide">Observação<input type="text" value={novo.observacao} onChange={e=>setNovo({...novo,observacao:e.target.value})} placeholder="Condição, vencimento, desconto etc."/></label></div><button type="button" className="primary addBtn" onClick={adicionar}><Plus size={17}/>Adicionar produto</button></section>
 </div>
}
