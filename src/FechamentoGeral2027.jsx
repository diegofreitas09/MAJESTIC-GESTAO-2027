import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { supabase } from './lib/supabase';

const SERIES=['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'];
const num=v=>Number(String(v??'').replace(',','.'))||0;
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

export default function FechamentoGeral2027(){
 const [linhas,setLinhas]=useState([]),[status,setStatus]=useState('Carregando mensalidades...'),[salvando,setSalvando]=useState(false);
 async function carregar(){
  const {data,error}=await supabase.from('fechamento_comercial_2027').select('*').eq('ativo',true).in('serie',SERIES).order('ordem').order('serie');
  if(error){setStatus(`Execute mensalidades_2027_formato_final.sql • ${error.message}`);setLinhas([]);return}
  setLinhas(data||[]);setStatus('Mensalidades 2027 sincronizadas com o Supabase');
 }
 useEffect(()=>{carregar();const c=supabase.channel('mensalidades-final-2027').on('postgres_changes',{event:'*',schema:'public',table:'fechamento_comercial_2027'},carregar).subscribe();return()=>supabase.removeChannel(c)},[]);
 const atualizar=(id,campo,valor)=>setLinhas(v=>v.map(x=>x.id===id?{...x,[campo]:valor}:x));
 const mediaA=useMemo(()=>{const v=linhas.filter(x=>num(x.plano_a_ate_vencimento)>0);return v.length?v.reduce((s,x)=>s+num(x.plano_a_ate_vencimento),0)/v.length:0},[linhas]);
 const mediaB=useMemo(()=>{const v=linhas.filter(x=>num(x.plano_b_ate_vencimento)>0);return v.length?v.reduce((s,x)=>s+num(x.plano_b_ate_vencimento),0)/v.length:0},[linhas]);
 async function salvar(){
  setSalvando(true);setStatus('Salvando mensalidades...');
  try{
   const payload=linhas.map(x=>({id:x.id,ordem:x.ordem,serie:x.serie,modalidade:'Regular',valor_base_2026:num(x.valor_2026_ate_vencimento||x.valor_base_2026),valor_2026_ate_vencimento:num(x.valor_2026_ate_vencimento),valor_2026_apos_vencimento:num(x.valor_2026_apos_vencimento),reajuste_percentual:num(x.reajuste_percentual),plano_a_parcelas:Number(x.plano_a_parcelas||12),plano_a_ate_vencimento:num(x.plano_a_ate_vencimento),plano_a_apos_vencimento:num(x.plano_a_apos_vencimento),plano_b_parcelas:Number(x.plano_b_parcelas||13),plano_b_ate_vencimento:num(x.plano_b_ate_vencimento),plano_b_apos_vencimento:num(x.plano_b_apos_vencimento),observacao:x.observacao||null,ativo:true}));
   const {error}=await supabase.from('fechamento_comercial_2027').upsert(payload,{onConflict:'id'});if(error)throw error;
   setStatus('Mensalidades salvas. A equipe recebe os mesmos valores em tempo real.');await carregar();
  }catch(e){setStatus(`Erro ao salvar: ${e.message}`)}finally{setSalvando(false)}
 }
 const inp=(x,c,w=96)=><input style={{width:w}} inputMode="decimal" value={x[c]??''} onChange={e=>atualizar(x.id,c,e.target.value)}/>;
 return <section className="panel commercialTable" style={{marginBottom:18}}>
  <div className="panelHead"><div><p className="eyebrow">MENSALIDADES • MATRÍCULAS 2027</p><h3>Fechamento Geral — Infantil I ao 5º ano</h3><p>2026 fica somente para comparação. Em 2027, o que muda é o plano: Plano A em 12x e Plano B em 13x, ambos com valor até e após o vencimento.</p></div><div style={{display:'flex',gap:8}}><button onClick={carregar}><RefreshCw size={16}/>Atualizar</button><button className="primary" onClick={salvar} disabled={salvando}><Save size={16}/>{salvando?'Salvando...':'Salvar mensalidades'}</button></div></div>
  <div style={{display:'flex',gap:14,flexWrap:'wrap',margin:'10px 0 14px'}}><span><b>{linhas.length}</b> séries</span><span>Plano A médio: <b>{money(mediaA)}</b></span><span>Plano B médio: <b>{money(mediaB)}</b></span><span>{status}</span></div>
  <div className="tableWrap"><table><thead><tr><th>Série</th><th>2026 • até venc.</th><th>2026 • após venc.</th><th>Plano A</th><th>A • até venc.</th><th>A • após venc.</th><th>Plano B</th><th>B • até venc.</th><th>B • após venc.</th><th>Observação</th></tr></thead><tbody>{linhas.map(x=><tr key={x.id}><td><strong>{x.serie}</strong></td><td className="locked">{money(x.valor_2026_ate_vencimento||x.valor_base_2026)}</td><td className="locked">{money(x.valor_2026_apos_vencimento)}</td><td><div style={{display:'flex',alignItems:'center',gap:4}}><input style={{width:58}} type="number" min="1" value={x.plano_a_parcelas??12} onChange={e=>atualizar(x.id,'plano_a_parcelas',e.target.value)}/><b>x</b></div></td><td>{inp(x,'plano_a_ate_vencimento')}</td><td>{inp(x,'plano_a_apos_vencimento')}</td><td><div style={{display:'flex',alignItems:'center',gap:4}}><input style={{width:58}} type="number" min="1" value={x.plano_b_parcelas??13} onChange={e=>atualizar(x.id,'plano_b_parcelas',e.target.value)}/><b>x</b></div></td><td>{inp(x,'plano_b_ate_vencimento')}</td><td>{inp(x,'plano_b_apos_vencimento')}</td><td><input style={{minWidth:170}} value={x.observacao||''} onChange={e=>atualizar(x.id,'observacao',e.target.value)} placeholder="Condição comercial..."/></td></tr>)}</tbody></table></div>
  <div style={{marginTop:12,fontSize:12,color:'#667085'}}>Valores de 2026 ficam bloqueados como histórico comparativo. Apenas as condições de 2027 são editadas pela Direção e sincronizadas com o App da Equipe.</div>
 </section>
}
