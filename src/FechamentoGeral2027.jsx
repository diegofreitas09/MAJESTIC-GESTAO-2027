import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { supabase } from './lib/supabase';

const moeda=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const num=v=>Number(String(v??'').replace(',','.'))||0;
const pct=(novo,base)=>base?((num(novo)-num(base))/num(base))*100:0;
const desconto=(apos,ate)=>num(apos)?((num(apos)-num(ate))/num(apos))*100:0;
const padrao={id:1,aplicacao:'Infantil I ao 5º ano',valor_2026_ate_vencimento:608.27,valor_2026_apos_vencimento:670,plano_a_parcelas:13,plano_a_ate_vencimento:637,plano_a_apos_vencimento:685,plano_b_parcelas:12,plano_b_ate_vencimento:690,plano_b_apos_vencimento:742,observacao:''};

export default function FechamentoGeral2027(){
 const [cfg,setCfg]=useState(padrao),[status,setStatus]=useState('Carregando mensalidades...'),[salvando,setSalvando]=useState(false);
 async function carregar(){const {data,error}=await supabase.from('mensalidades_config_2027').select('*').eq('id',1).maybeSingle();if(error){setCfg(padrao);setStatus(`Execute mensalidades_simples_2027.sql • ${error.message}`);return}setCfg(data||padrao);setStatus('Mensalidades sincronizadas com o Supabase')}
 useEffect(()=>{carregar();const c=supabase.channel('mensalidades-config-direcao').on('postgres_changes',{event:'*',schema:'public',table:'mensalidades_config_2027'},carregar).subscribe();return()=>supabase.removeChannel(c)},[]);
 const campo=(k,v)=>setCfg(x=>({...x,[k]:v}));
 async function salvar(){setSalvando(true);setStatus('Salvando...');const payload={...cfg,id:1,valor_2026_ate_vencimento:num(cfg.valor_2026_ate_vencimento),valor_2026_apos_vencimento:num(cfg.valor_2026_apos_vencimento),plano_a_parcelas:Number(cfg.plano_a_parcelas||13),plano_a_ate_vencimento:num(cfg.plano_a_ate_vencimento),plano_a_apos_vencimento:num(cfg.plano_a_apos_vencimento),plano_b_parcelas:Number(cfg.plano_b_parcelas||12),plano_b_ate_vencimento:num(cfg.plano_b_ate_vencimento),plano_b_apos_vencimento:num(cfg.plano_b_apos_vencimento),observacao:cfg.observacao||null};const {error}=await supabase.from('mensalidades_config_2027').upsert(payload,{onConflict:'id'});if(error)setStatus(`Erro ao salvar: ${error.message}`);else{setStatus('Salvo. A equipe recebe os novos valores em tempo real.');await carregar()}setSalvando(false)}
 const calculos=useMemo(()=>({
  desc26:desconto(cfg.valor_2026_apos_vencimento,cfg.valor_2026_ate_vencimento),
  aAte:pct(cfg.plano_a_ate_vencimento,cfg.valor_2026_ate_vencimento),
  aApos:pct(cfg.plano_a_apos_vencimento,cfg.valor_2026_apos_vencimento),
  bAte:pct(cfg.plano_b_ate_vencimento,cfg.valor_2026_ate_vencimento),
  bApos:pct(cfg.plano_b_apos_vencimento,cfg.valor_2026_apos_vencimento),
  descA:desconto(cfg.plano_a_apos_vencimento,cfg.plano_a_ate_vencimento),
  descB:desconto(cfg.plano_b_apos_vencimento,cfg.plano_b_ate_vencimento),
  anualAAte:num(cfg.plano_a_parcelas)*num(cfg.plano_a_ate_vencimento),
  anualAApos:num(cfg.plano_a_parcelas)*num(cfg.plano_a_apos_vencimento),
  anualBAte:num(cfg.plano_b_parcelas)*num(cfg.plano_b_ate_vencimento),
  anualBApos:num(cfg.plano_b_parcelas)*num(cfg.plano_b_apos_vencimento)
 }),[cfg]);
 const input=(k)=><input inputMode="decimal" value={cfg[k]??''} onChange={e=>campo(k,e.target.value)}/>;
 const badge=v=><span style={{fontWeight:800,color:v>=0?'#166534':'#991b1b'}}>{v>=0?'+':''}{v.toFixed(2)}%</span>;
 return <section className="panel" style={{marginBottom:18}}>
  <div className="panelHead"><div><p className="eyebrow">MENSALIDADES • 2027</p><h3>Infantil I ao 5º ano</h3><p>Primeiro confira a base de 2026. Depois ajuste somente os Planos A e B de 2027; anualidades e reajustes são calculados automaticamente.</p></div><div style={{display:'flex',gap:8}}><button onClick={carregar}><RefreshCw size={16}/>Atualizar</button><button className="primary" onClick={salvar} disabled={salvando}><Save size={16}/>{salvando?'Salvando...':'Salvar mensalidades'}</button></div></div>
  <p style={{fontSize:12,opacity:.75,margin:'8px 0 16px'}}>{status}</p>

  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginBottom:16}}>
   <article className="panel" style={{padding:16,margin:0}}><small>2026 • até o vencimento</small><div style={{marginTop:7}}>{input('valor_2026_ate_vencimento')}</div></article>
   <article className="panel" style={{padding:16,margin:0}}><small>2026 • após o vencimento</small><div style={{marginTop:7}}>{input('valor_2026_apos_vencimento')}</div></article>
   <article className="panel" style={{padding:16,margin:0}}><small>Desconto de pontualidade 2026</small><strong style={{display:'block',fontSize:24,marginTop:8}}>{calculos.desc26.toFixed(2)}%</strong></article>
  </div>

  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
   <article className="panel" style={{padding:18,margin:0}}><p className="eyebrow">PLANO A</p><h3 style={{marginTop:3}}>Plano A • {cfg.plano_a_parcelas}x</h3><div className="formGrid" style={{marginTop:12}}><label>Parcelas<input type="number" min="1" value={cfg.plano_a_parcelas} onChange={e=>campo('plano_a_parcelas',e.target.value)}/></label><label>Até o vencimento{input('plano_a_ate_vencimento')}</label><label>Após o vencimento{input('plano_a_apos_vencimento')}</label></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:14}}><div><small>Anuidade até venc.</small><strong style={{display:'block'}}>{moeda(calculos.anualAAte)}</strong><small>Reajuste vs. 2026: {badge(calculos.aAte)}</small></div><div><small>Anuidade após venc.</small><strong style={{display:'block'}}>{moeda(calculos.anualAApos)}</strong><small>Reajuste vs. 2026: {badge(calculos.aApos)}</small></div></div><p style={{margin:'12px 0 0',fontSize:12}}>Desconto de pontualidade 2027: <b>{calculos.descA.toFixed(2)}%</b></p></article>

   <article className="panel" style={{padding:18,margin:0}}><p className="eyebrow">PLANO B</p><h3 style={{marginTop:3}}>Plano B • {cfg.plano_b_parcelas}x</h3><div className="formGrid" style={{marginTop:12}}><label>Parcelas<input type="number" min="1" value={cfg.plano_b_parcelas} onChange={e=>campo('plano_b_parcelas',e.target.value)}/></label><label>Até o vencimento{input('plano_b_ate_vencimento')}</label><label>Após o vencimento{input('plano_b_apos_vencimento')}</label></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:14}}><div><small>Anuidade até venc.</small><strong style={{display:'block'}}>{moeda(calculos.anualBAte)}</strong><small>Reajuste vs. 2026: {badge(calculos.bAte)}</small></div><div><small>Anuidade após venc.</small><strong style={{display:'block'}}>{moeda(calculos.anualBApos)}</strong><small>Reajuste vs. 2026: {badge(calculos.bApos)}</small></div></div><p style={{margin:'12px 0 0',fontSize:12}}>Desconto de pontualidade 2027: <b>{calculos.descB.toFixed(2)}%</b></p></article>
  </div>
  <label style={{display:'block',marginTop:14}}>Observação<input style={{width:'100%',marginTop:5}} value={cfg.observacao||''} onChange={e=>campo('observacao',e.target.value)}/></label>
 </section>
}
