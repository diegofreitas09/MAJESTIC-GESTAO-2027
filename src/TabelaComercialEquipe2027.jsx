import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { supabase } from './lib/supabase';

const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));

export default function TabelaComercialEquipe2027(){
  const [linhas,setLinhas]=useState([]);
  const [busca,setBusca]=useState('');
  const [status,setStatus]=useState('Carregando fechamento oficial...');
  const [carregando,setCarregando]=useState(true);

  async function carregar(){
    setCarregando(true);
    const {data,error}=await supabase
      .from('fechamento_comercial_2027')
      .select('*')
      .eq('ativo',true)
      .order('ordem',{ascending:true})
      .order('serie',{ascending:true});
    if(error){
      setLinhas([]);
      setStatus(`Fechamento Geral ainda não liberado no Supabase • ${error.message}`);
    }else{
      setLinhas(data||[]);
      setStatus('Sincronizado com a Direção em tempo real');
    }
    setCarregando(false);
  }

  useEffect(()=>{
    carregar();
    const canal=supabase.channel('fechamento-2027-equipe-live')
      .on('postgres_changes',{event:'*',schema:'public',table:'fechamento_comercial_2027'},carregar)
      .subscribe();
    return()=>supabase.removeChannel(canal);
  },[]);

  const filtradas=useMemo(()=>{
    const q=busca.trim().toLowerCase();
    if(!q)return linhas;
    return linhas.filter(i=>`${i.serie||''} ${i.modalidade||''} ${i.observacao||''}`.toLowerCase().includes(q));
  },[linhas,busca]);

  return <section className="panel" style={{marginBottom:18}}>
    <div className="panelHead">
      <div>
        <p className="eyebrow">FECHAMENTO GERAL • MATRÍCULAS 2027</p>
        <h3>Tabela oficial definida pela Direção</h3>
        <p>Plano A e Plano B por série e modalidade. Qualquer alteração feita pela Direção aparece aqui automaticamente.</p>
      </div>
      <button type="button" onClick={carregar}><RefreshCw size={16}/>Atualizar</button>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:10,margin:'12px 0'}}>
      <div className="search" style={{maxWidth:360,width:'100%'}}><Search size={15}/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar série ou modalidade..."/></div>
      <span style={{fontSize:12,opacity:.75}}>{status}</span>
    </div>
    <div className="tableWrap"><table>
      <thead><tr><th>Série</th><th>Modalidade</th><th>Base 2026</th><th>Reajuste %</th><th>Plano A</th><th>A • até venc.</th><th>A • após venc.</th><th>Plano B</th><th>B • até venc.</th><th>B • após venc.</th><th>Observação</th></tr></thead>
      <tbody>
        {!carregando&&!filtradas.length&&<tr><td colSpan="11" style={{padding:24,textAlign:'center'}}>Nenhuma linha disponível. A Direção precisa liberar/preencher o Fechamento Geral no Supabase.</td></tr>}
        {filtradas.map(i=><tr key={i.id}>
          <td><strong>{i.serie}</strong></td>
          <td>{i.modalidade||'Regular'}</td>
          <td>{money(i.valor_base_2026)}</td>
          <td>{Number(i.reajuste_percentual||0).toLocaleString('pt-BR',{maximumFractionDigits:3})}%</td>
          <td><strong>{i.plano_a_parcelas}x</strong></td>
          <td><strong>{money(i.plano_a_ate_vencimento)}</strong></td>
          <td>{money(i.plano_a_apos_vencimento)}</td>
          <td><strong>{i.plano_b_parcelas}x</strong></td>
          <td><strong>{money(i.plano_b_ate_vencimento)}</strong></td>
          <td>{money(i.plano_b_apos_vencimento)}</td>
          <td>{i.observacao||'—'}</td>
        </tr>)}
      </tbody>
    </table></div>
  </section>
}
