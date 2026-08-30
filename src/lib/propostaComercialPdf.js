import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import majesticLogo from '../../majestic-logo.png';

const moeda=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

async function carregarLogo(){
  try{
    const r=await fetch(majesticLogo,{cache:'force-cache'});
    if(!r.ok)return null;
    const blob=await r.blob();
    return await new Promise(resolve=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=()=>resolve(null);fr.readAsDataURL(blob)});
  }catch{return null}
}

function periodicidadeLabel(p=''){
  const x=String(p).toLowerCase();
  if(x.includes('mensal'))return 'Mensal';
  if(x.includes('anual'))return 'Anual';
  if(x.includes('avul'))return 'Avulso';
  if(x.includes('únic')||x.includes('unico'))return 'Pagamento único';
  return p||'Conforme contratação';
}

function extrairParcelas(produto=''){
  const m=String(produto).match(/(\d+)\s*parcelas?/i);
  return m?Number(m[1]):null;
}

function classificar(item){
  const p=String(item.periodicidade||'').toLowerCase();
  if(p.includes('mensal'))return 'mensal';
  if(p.includes('anual'))return 'anual';
  return 'outros';
}

function rodape(doc){
  const pages=doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){
    doc.setPage(i);doc.setDrawColor(225);doc.line(14,284,196,284);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(95);
    doc.text(`Berçário e Creche Escola Majestic • Proposta Comercial 2027 • Página ${i} de ${pages}`,14,290);
  }
}

export async function gerarPropostaComercialPDF({form={},itens=[],atendente='',observacao=''}){
  if(!form.nome_aluno||!form.nome_responsavel) throw new Error('Preencha responsável e aluno antes de gerar a proposta.');
  const doc=new jsPDF({unit:'mm',format:'a4'}),logo=await carregarLogo(),emitida=new Date();
  const mensal=itens.filter(i=>classificar(i)==='mensal');
  const anual=itens.filter(i=>classificar(i)==='anual');
  const outros=itens.filter(i=>classificar(i)==='outros');
  const totalMensal=mensal.reduce((s,i)=>s+Number(i.valor2027??i.valor2026??i.valor??0),0);
  const totalAnual=anual.reduce((s,i)=>s+Number(i.valor2027??i.valor2026??i.valor??0),0);
  const totalOutros=outros.reduce((s,i)=>s+Number(i.valor2027??i.valor2026??i.valor??0),0);

  if(logo){try{doc.addImage(logo,'PNG',14,8,55,24,undefined,'FAST')}catch{}}
  doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(16,42,86);doc.text('PROPOSTA COMERCIAL 2027',logo?76:14,16);
  doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(55,68,88);doc.text(`Preparada para ${form.nome_aluno}`,logo?76:14,23);doc.text(`Atendimento: ${atendente||'Equipe Majestic'} • ${emitida.toLocaleString('pt-BR')}`,logo?76:14,29);

  autoTable(doc,{startY:39,theme:'grid',head:[['Informações da família','Dados']],body:[
    ['Aluno(a)',form.nome_aluno],['Responsável',form.nome_responsavel],['Série pretendida',form.serie||'-'],['Turno',form.turno_preferencia||'-'],['Telefone',form.telefone||'-'],['E-mail',form.email||'-']
  ],styles:{fontSize:9,cellPadding:2.2},headStyles:{fillColor:[16,42,86]}});

  let y=(doc.lastAutoTable?.finalY||78)+9;
  doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(16,42,86);doc.text('Condições apresentadas',14,y);
  autoTable(doc,{startY:y+4,head:[['Produto / plano','Periodicidade','Condição','Valor']],body:itens.length?itens.map(i=>{
    const valor=Number(i.valor2027??i.valor2026??i.valor??0),parcelas=extrairParcelas(i.produto);
    const cond=parcelas?`${parcelas} parcelas de ${moeda(valor)}`:periodicidadeLabel(i.periodicidade);
    return [i.produto||'-',periodicidadeLabel(i.periodicidade),cond,moeda(valor)];
  }):[['Nenhum item selecionado','-','-','-']],styles:{fontSize:8,cellPadding:2,overflow:'linebreak'},headStyles:{fillColor:[16,42,86]}});

  y=(doc.lastAutoTable?.finalY||y+30)+9;
  const resumo=[];
  if(totalMensal>0)resumo.push(['Compromisso mensal',moeda(totalMensal)]);
  if(totalAnual>0)resumo.push(['Itens anuais',moeda(totalAnual)]);
  if(totalOutros>0)resumo.push(['Itens avulsos / únicos',moeda(totalOutros)]);
  if(resumo.length){
    doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(16,42,86);doc.text('Resumo financeiro',14,y);
    autoTable(doc,{startY:y+4,theme:'grid',body:resumo,styles:{fontSize:10,cellPadding:2.4,fontStyle:'bold'},columnStyles:{1:{halign:'right'}},tableWidth:110});
    y=(doc.lastAutoTable?.finalY||y+20)+8;
  }

  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(55);
  const notas=[
    'Os valores acima correspondem às condições apresentadas neste atendimento para o ano letivo de 2027.',
    'Produtos e serviços com periodicidades diferentes não devem ser somados como se fossem uma única mensalidade.',
    'Descontos ou condições especiais dependem de autorização da Direção quando aplicável.'
  ];
  notas.forEach(t=>{doc.text(doc.splitTextToSize(`• ${t}`,180),14,y);y+=8});
  if(observacao){doc.setFont('helvetica','bold');doc.setTextColor(16,42,86);doc.text('Observações',14,y+2);doc.setFont('helvetica','normal');doc.setTextColor(55);doc.text(doc.splitTextToSize(observacao,180),14,y+8)}

  rodape(doc);
  const nome=`majestic-proposta-${String(form.nome_aluno).replace(/\s+/g,'-').toLowerCase()}.pdf`;
  try{doc.save(nome,{returnPromise:true})}catch{doc.save(nome)}
}
