import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import majesticLogo from '../../majestic-logo.png';

const money = value => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value||0));
const txt = (...v) => v.find(x=>x!==undefined&&x!==null&&String(x).trim()!=='') ?? '';

async function carregarLogo(){
  try{
    const r=await fetch(majesticLogo,{cache:'force-cache'});
    if(!r.ok)return null;
    const blob=await r.blob();
    return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>resolve(null);reader.readAsDataURL(blob)});
  }catch{return null}
}

export async function gerarRelatorioExecutivoPDF({periodo='Campanha 2027',resumo={},funil=[],interessados=[],atendimentos=[],matriculas=[],produtosSupabase=[],produtosComerciais=[],perguntas=[]}={}){
  const doc=new jsPDF({unit:'mm',format:'a4'}), agora=new Date(), logo=await carregarLogo();
  if(logo){try{doc.addImage(logo,'PNG',14,8,62,27,undefined,'FAST')}catch{}}
  doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(16,42,86);doc.text('MAJESTIC GESTÃO 2027',logo?82:14,18);
  doc.setFontSize(11);doc.setFont('helvetica','normal');doc.setTextColor(50,65,85);doc.text(`Relatório Executivo — ${periodo}`,logo?82:14,25);doc.text(`Gerado em ${agora.toLocaleString('pt-BR')}`,logo?82:14,31);
  autoTable(doc,{startY:40,head:[['Indicador','Total']],body:[['Procuras / interessados',resumo.interessados??0],['Atendimentos realizados',resumo.atendimentos??0],['Visitas',resumo.visitas??0],['Propostas',resumo.propostas??0],['Matrículas',resumo.matriculas??0],['Conversão geral',`${Number(resumo.conversao||0).toLocaleString('pt-BR',{maximumFractionDigits:2})}%`]],headStyles:{fillColor:[16,42,86]}});
  let y=doc.lastAutoTable.finalY+8;
  const sec=(titulo,head,body,opts={})=>{if(!body.length)return;y=doc.lastAutoTable?.finalY?doc.lastAutoTable.finalY+8:y;doc.setFont('helvetica','bold');doc.setTextColor(16,42,86);doc.text(titulo,14,y);autoTable(doc,{startY:y+3,head:[head],body,styles:{fontSize:opts.fontSize||7.5,cellPadding:1.7,overflow:'linebreak'},headStyles:{fillColor:[16,42,86]},...opts});y=doc.lastAutoTable.finalY+8};
  sec('Funil de matrículas',['Etapa','Quantidade'],funil.map(i=>[i.nome,i.total]));
  sec('Procuras e interessados',['Aluno','Responsável','Telefone','E-mail','Etapa'],interessados.map(i=>[txt(i.nome_aluno,i.aluno,i.nome),txt(i.nome_responsavel,i.responsavel),txt(i.telefone),txt(i.email,i['e-mail']),txt(i.etapa,i.status)]),{fontSize:6.8});
  sec('Atendimentos',['Data','Responsável','Aluno','Canal','Atendente','Resultado'],atendimentos.map(a=>[txt(a.data,a.created_at),txt(a.responsavel,a.nome_responsavel),txt(a.aluno,a.nome_aluno),txt(a.canal),txt(a.atendente),txt(a.resultado,a.status)]),{fontSize:6.6});
  sec('Matrículas 2027',['Aluno','Responsável','Série/Turma','Plano','Valor','Status'],matriculas.map(m=>[txt(m.nome_aluno,m.aluno,m.nome),txt(m.nome_responsavel,m.responsavel),txt(m.serie,m.turma,m.segmento),txt(m.plano,m.modalidade),m.valor!=null?money(m.valor):'',txt(m.status,m.situacao)]),{fontSize:6.6});
  sec('Tabela comercial — comparação 2026 x 2027',['Produto / Plano','Categoria','2026','Reajuste','2027','Observação'],produtosComerciais.map(p=>[txt(p.produto,p.nome),txt(p.categoria,p.segmento),money(p.valor2026),`${Number(p.reajuste||0).toLocaleString('pt-BR',{maximumFractionDigits:2})}%`,money(p.valor2027),txt(p.observacao)]),{fontSize:6.4});
  sec('Produtos cadastrados no Supabase',['Produto','Segmento','Valor','Vigência','Status'],produtosSupabase.map(p=>[txt(p.nome,p.produto),txt(p.segmento,p.categoria),money(txt(p.valor,p.valor2027)),txt(p.vigencia),p.publicado===true?'Publicado':txt(p.status,'Interno')]),{fontSize:6.8});
  sec('Central da Direção',['Status','Pergunta','Resposta / orientação'],perguntas.map(p=>[txt(p.status),txt(p.pergunta),txt(p.resposta,'Aguardando resposta')]),{fontSize:6.8});
  const pages=doc.internal.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor(225);doc.line(14,285,196,285);doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(90);doc.text(`Berçário e Creche Escola Majestic • Gestão 2027 • Página ${i} de ${pages}`,14,290)}
  const nome=`majestic-relatorio-completo-${agora.toISOString().slice(0,10)}.pdf`;
  try{doc.save(nome,{returnPromise:true})}catch{doc.save(nome)}
}
