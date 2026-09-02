import { supabase } from './supabase';
import { BASE_COMERCIAL_2026 } from './comercial2026';

export function normalizarProdutoDb(p){
  return {
    id:p.id,
    categoria:p.categoria||'Outros',
    produto:p.produto||'',
    plano:p.plano||'',
    valor2026:Number(p.valor_2026??0),
    reajuste:Number(p.reajuste_percentual??0),
    valor2027:Number(p.valor_2027??p.valor_2026??0),
    primeiraParcela2026:p.primeira_parcela_2026==null?'':Number(p.primeira_parcela_2026),
    primeiraParcela2027:p.primeira_parcela_2027==null?'':Number(p.primeira_parcela_2027),
    quantidadeParcelas:p.quantidade_parcelas==null?'':Number(p.quantidade_parcelas),
    valorParcela2026:p.valor_parcela_2026==null?'':Number(p.valor_parcela_2026),
    valorParcela2027:p.valor_parcela_2027==null?'':Number(p.valor_parcela_2027),
    observacao:p.observacao||'',
    serieAplicavel:Array.isArray(p.serie_aplicavel)?p.serie_aplicavel:[],
    turmaAplicavel:Array.isArray(p.turma_aplicavel)?p.turma_aplicavel:[],
    periodicidade:p.periodicidade||'avulso',
    obrigatorio:p.obrigatorio===true,
    ativo:p.ativo!==false,
    vigenciaInicio:p.vigencia_inicio||null,
    vigenciaFim:p.vigencia_fim||null,
    alteradoPor:p.alterado_por||null,
    updatedAt:p.updated_at||null
  };
}

const nullableNumero=v=>v===''||v==null?null:Number(v||0);
export function produtoParaDb(p){
  return {
    id:String(p.id),
    produto:String(p.produto||''),
    categoria:String(p.categoria||'Outros'),
    plano:String(p.plano||'')||null,
    serie_aplicavel:Array.isArray(p.serieAplicavel)?p.serieAplicavel:[],
    turma_aplicavel:Array.isArray(p.turmaAplicavel)?p.turmaAplicavel:[],
    valor_2026:Number(p.valor2026||0),
    reajuste_percentual:Number(p.reajuste||0),
    valor_2027:Number(p.valor2027??p.valor2026??0),
    primeira_parcela_2026:nullableNumero(p.primeiraParcela2026),
    primeira_parcela_2027:nullableNumero(p.primeiraParcela2027),
    quantidade_parcelas:p.quantidadeParcelas===''||p.quantidadeParcelas==null?null:Number(p.quantidadeParcelas),
    valor_parcela_2026:nullableNumero(p.valorParcela2026),
    valor_parcela_2027:nullableNumero(p.valorParcela2027),
    periodicidade:String(p.periodicidade||'avulso'),
    obrigatorio:p.obrigatorio===true,
    ativo:p.ativo!==false,
    observacao:String(p.observacao||''),
    vigencia_inicio:p.vigenciaInicio||'2027-01-01',
    vigencia_fim:p.vigenciaFim||null
  };
}

export async function carregarCatalogoOficial({somenteAtivos=true}={}){
  let q=supabase.from('produtos_comerciais').select('*').order('categoria').order('produto');
  if(somenteAtivos)q=q.eq('ativo',true);
  const {data,error}=await q;
  if(error)throw error;
  return (data||[]).map(normalizarProdutoDb);
}

export async function carregarMensalidadesOficiais(){
  const {data,error}=await supabase.from('mensalidades_config_2027').select('*').eq('id',1).maybeSingle();
  if(error)throw error;
  if(!data)return [];
  const series=['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'];
  const baseApos=Number(data.valor_2026_apos_vencimento||0);
  const mk=(plano,parcelas,ate,apos)=>({
    id:`mensalidade-${plano.toLowerCase().replace(' ','-')}`,
    categoria:'Mensalidade',
    produto:`${plano} • ${Number(parcelas||0)}x • até o vencimento`,
    plano,
    valor2026:Number(data.valor_2026_ate_vencimento||0),
    reajuste:baseApos?((Number(ate||0)-Number(data.valor_2026_ate_vencimento||0))/Number(data.valor_2026_ate_vencimento||1))*100:0,
    valor2027:Number(ate||0),
    valorAposVencimento:Number(apos||0),
    anuidadeAte:Number(parcelas||0)*Number(ate||0),
    anuidadeApos:Number(parcelas||0)*Number(apos||0),
    quantidadeParcelas:Number(parcelas||0),
    periodicidade:'mensal',
    obrigatorio:true,
    ativo:true,
    serieAplicavel:series,
    turmaAplicavel:[],
    observacao:`Após o vencimento: ${Number(apos||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}. Aplicável do Infantil I ao 5º ano.`
  });
  return [
    mk('Plano A',data.plano_a_parcelas,data.plano_a_ate_vencimento,data.plano_a_apos_vencimento),
    mk('Plano B',data.plano_b_parcelas,data.plano_b_ate_vencimento,data.plano_b_apos_vencimento)
  ];
}

export async function carregarCatalogoAtendimento(){
  const [produtos,mensalidades]=await Promise.all([carregarCatalogoOficial(),carregarMensalidadesOficiais().catch(()=>[])]);
  return [...mensalidades,...produtos.filter(p=>p.categoria!=='Mensalidade')];
}

export async function upsertProdutoOficial(p){
  const payload=produtoParaDb(p);
  const {data,error}=await supabase.from('produtos_comerciais').upsert(payload,{onConflict:'id'}).select().single();
  if(error)throw error;
  return normalizarProdutoDb(data);
}

export async function desativarProdutoOficial(id){
  const {error}=await supabase.from('produtos_comerciais').update({ativo:false}).eq('id',id);
  if(error)throw error;
}

export function fallbackCatalogo(){
  return BASE_COMERCIAL_2026.map(p=>({...p,plano:'',primeiraParcela2026:'',primeiraParcela2027:'',quantidadeParcelas:'',valorParcela2026:p.valor2026,valorParcela2027:p.valor2027,serieAplicavel:[],turmaAplicavel:[],periodicidade:'avulso',obrigatorio:false,ativo:true}));
}
