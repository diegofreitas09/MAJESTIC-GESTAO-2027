import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

export function gerarRelatorioExecutivoPDF({ periodo = 'Campanha 2027', resumo = {}, funil = [], atendimentos = [], produtos = [], perguntas = [] } = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const agora = new Date();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MAJESTIC GESTÃO 2027', 14, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Relatório Executivo — ${periodo}`, 14, 25);
  doc.text(`Gerado em ${agora.toLocaleString('pt-BR')}`, 14, 31);

  autoTable(doc, {
    startY: 38,
    head: [['Indicador', 'Total']],
    body: [
      ['Procuras / interessados', resumo.interessados ?? 0],
      ['Atendimentos realizados', resumo.atendimentos ?? 0],
      ['Visitas', resumo.visitas ?? 0],
      ['Propostas', resumo.propostas ?? 0],
      ['Matrículas', resumo.matriculas ?? 0],
      ['Conversão geral', `${resumo.conversao ?? 0}%`],
    ],
  });

  let y = doc.lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Funil de matrículas', 14, y);
  autoTable(doc, {
    startY: y + 3,
    head: [['Etapa', 'Quantidade']],
    body: funil.map((item) => [item.nome, item.total]),
  });

  y = doc.lastAutoTable.finalY + 8;
  if (atendimentos.length) {
    doc.setFont('helvetica', 'bold');
    doc.text('Atendimentos', 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [['Data', 'Responsável', 'Aluno', 'Canal', 'Atendente', 'Resultado']],
      body: atendimentos.map((a) => [a.data || '', a.responsavel || '', a.aluno || '', a.canal || '', a.atendente || '', a.resultado || '']),
      styles: { fontSize: 7.5 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (produtos.length) {
    doc.setFont('helvetica', 'bold');
    doc.text('Valores oficiais definidos pela Direção', 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [['Produto', 'Segmento', 'Valor', 'Vigência', 'Status']],
      body: produtos.map((p) => [p.nome || '', p.segmento || '', money(p.valor), p.vigencia || '', p.publicado ? 'Publicado' : 'Interno']),
      styles: { fontSize: 8 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (perguntas.length) {
    doc.setFont('helvetica', 'bold');
    doc.text('Central da Direção', 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [['Status', 'Pergunta', 'Resposta / orientação']],
      body: perguntas.map((p) => [p.status || '', p.pergunta || '', p.resposta || 'Aguardando resposta']),
      styles: { fontSize: 8 },
    });
  }

  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Majestic Gestão 2027 • Página ${i} de ${pages}`, 14, 290);
  }

  doc.save(`majestic-relatorio-${agora.toISOString().slice(0, 10)}.pdf`);
}
