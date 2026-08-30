import { useEffect, useMemo, useState } from 'react';
import { Download, FileSignature, ListChecks, RefreshCw, Search, Tags, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './lib/supabase';
import majesticLogo from '../majestic-logo.png';

const ANO=2027;
const clean=v=>String(v||'').trim();
const dataBR=v=>v?new Date(`${String(v).slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR'):'—';

async function carregarLogo(){
  try{const r=await fetch(majesticLogo,{cache:'force-cache'});if(!r.ok)return null;const blob=await r.blob();return await new Promise(resolve=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=()=>resolve(null);fr.readAsDataURL(blob)})}catch{return null}
}

function rodape(doc,titulo){
  const pages=doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){
    doc.setPage(i);doc.setDrawColor(225);doc.line(14,284,196,284);doc.setFontSize(8);doc.setTextColor(95);doc.text(`Berçário e Creche Escola Majestic • ${titulo} • Página ${i} de ${pages}`,14,290);
  }
}

export default function Alunos2027(){
  const [alunos,setAlunos]=useState([]),[erro,setErro]=useState(''),[carregando,setCarregando]=useState(true);
  const [busca,setBusca]=useState(''),[serie,setSerie]=useState(''),[turma,setTurma]=useState(''),[turno,setTurno]=useState('');

  async function carregar(){
    setCarregando(true);setErro('');
    const {data,error}=await supabase.from('vw_lista_alunos_2027').select('*').order('serie').order('turma').order('turno').order('numero_chamada',{ascending:true,nullsFirst:false}).order('aluno');
    if(error){setErro(error.message);setAlunos([])}else setAlunos(data||[]);
    setCarregando(false);
  }

  useEffect(()=>{carregar();const canal=supabase.channel('majestic-alunos-2027').on('postgres_changes',{event:'*',schema:'public',table:'alunos'},carregar).on('postgres_changes',{event:'*',schema:'public',table:'matriculas_academicas'},carregar).subscribe();return()=>supabase.removeChannel(canal)},[]);

  const series=useMemo(()=>[...new Set(alunos.map(a=>clean(a.serie)).filter(Boolean))].sort(),[alunos]);
  const turmas=useMemo(()=>[...new Set(alunos.filter(a=>!serie||a.serie===serie).map(a=>clean(a.turma)).filter(Boolean))].sort(),[alunos,serie]);
  const turnos=useMemo(()=>[...new Set(alunos.filter(a=>(!serie||a.serie===serie)&&(!turma||a.turma===turma)).map(a=>clean(a.turno)).filter(Boolean))].sort(),[alunos,serie,turma]);
  const filtrados=useMemo(()=>{const q=busca.trim().toLowerCase();return alunos.filter(a=>(!serie||a.serie===serie)&&(!turma||a.turma===turma)&&(!turno||a.turno===turno)&&(!q||`${a.aluno||''} ${a.nome_lista||''} ${a.responsavel_nome||''} ${a.responsavel_telefone||''} ${a.codigo_aluno||''}`.toLowerCase().includes(q)))},[alunos,busca,serie,turma,turno]);
  const grupos=useMemo(()=>new Set(filtrados.map(a=>`${a.serie}|${a.turma||''}|${a.turno}`)).size,[filtrados]);

  async function gerar(tipo){
    if(!filtrados.length)return;
    const logo=await carregarLogo(),doc=new jsPDF({unit:'mm',format:'a4'}),titulo=tipo==='chamada'?'LISTA DE CHAMADA':tipo==='assinatura'?'LISTA DE ASSINATURA':'LISTA DE ALUNOS';
    if(logo){try{doc.addImage(logo,'PNG',14,8,50,22,undefined,'FAST')}catch{}}
    doc.setFont('helvetica','bold');doc.setFontSize(17);doc.setTextColor(16,42,86);doc.text(`${titulo} • ${ANO}`,logo?72:14,16);
    doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(70);
    doc.text(`Série: ${serie||'Todas'} • Turma: ${turma||'Todas'} • Turno: ${turno||'Todos'}`,logo?72:14,23);
    doc.text(`${filtrados.length} aluno(s) • Emitido em ${new Date().toLocaleString('pt-BR')}`,logo?72:14,29);
    let head,body;
    if(tipo==='chamada'){
      head=[['Nº','Aluno','1','2','3','4','5','6','7','8','9','10']];
      body=filtrados.map((a,i)=>[a.numero_chamada||i+1,a.nome_lista||a.aluno,'','','','','','','','','','']);
    }else if(tipo==='assinatura'){
      head=[['Nº','Aluno','Responsável','Assinatura']];
      body=filtrados.map((a,i)=>[a.numero_chamada||i+1,a.nome_lista||a.aluno,a.responsavel_nome||'','']);
    }else{
      head=[['Nº','Aluno','Série','Turma','Turno','Responsável','Telefone']];
      body=filtrados.map((a,i)=>[a.numero_chamada||i+1,a.nome_lista||a.aluno,a.serie||'',a.turma||'',a.turno||'',a.responsavel_nome||'',a.responsavel_telefone||'']);
    }
    autoTable(doc,{startY:37,head,body,theme:'grid',styles:{fontSize:tipo==='chamada'?6.5:7.2,cellPadding:1.8,overflow:'linebreak'},headStyles:{fillColor:[16,42,86]},columnStyles:tipo==='assinatura'?{3:{cellWidth:62}}:{}});
    rodape(doc,titulo);doc.save(`majestic-${tipo}-${ANO}.pdf`);
  }

  return <section className="modulePage">
    <section className="panel" style={{padding:24}}>
      <div className="panelHead" style={{alignItems:'flex-start',gap:14}}><div><p className="eyebrow">BASE ACADÊMICA • {ANO}</p><h3 style={{fontSize:24,margin:'4px 0'}}>Alunos 2027</h3><p>Organize os matriculados por série, turma e turno e gere listas prontas para o uso escolar.</p></div><button className="icon" type="button" onClick={carregar}><RefreshCw size={18}/></button></div>
      {erro&&<div className="alerta" style={{marginTop:12}}>Base acadêmica: {erro}. Confirme se as migrations de Alunos 2027 já foram executadas no Supabase.</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,margin:'18px 0'}}>
        <article style={{padding:16,border:'1px solid #e4ebf4',borderRadius:14}}><Users size={20}/><small style={{display:'block',marginTop:7}}>Alunos matriculados</small><strong style={{fontSize:27}}>{carregando?'...':alunos.length}</strong></article>
        <article style={{padding:16,border:'1px solid #e4ebf4',borderRadius:14}}><ListChecks size={20}/><small style={{display:'block',marginTop:7}}>Alunos no filtro</small><strong style={{fontSize:27}}>{filtrados.length}</strong></article>
        <article style={{padding:16,border:'1px solid #e4ebf4',borderRadius:14}}><Tags size={20}/><small style={{display:'block',marginTop:7}}>Turmas / grupos</small><strong style={{fontSize:27}}>{grupos}</strong></article>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr repeat(3,minmax(130px,1fr))',gap:10,alignItems:'end'}}>
        <label>Buscar aluno ou responsável<div className="crmSearch"><Search size={17}/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Nome, responsável, telefone ou código"/></div></label>
        <label>Série<select value={serie} onChange={e=>{setSerie(e.target.value);setTurma('');setTurno('')}}><option value="">Todas</option>{series.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Turma<select value={turma} onChange={e=>{setTurma(e.target.value);setTurno('')}}><option value="">Todas</option>{turmas.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Turno<select value={turno} onChange={e=>setTurno(e.target.value)}><option value="">Todos</option>{turnos.map(x=><option key={x}>{x}</option>)}</select></label>
      </div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:16}}>
        <button className="primary" type="button" onClick={()=>gerar('lista')}><Download size={17}/>Lista de alunos</button>
        <button className="primary" type="button" onClick={()=>gerar('chamada')}><ListChecks size={17}/>Lista de chamada</button>
        <button className="primary" type="button" onClick={()=>gerar('assinatura')}><FileSignature size={17}/>Lista de assinatura</button>
      </div>
    </section>

    <section className="panel" style={{marginTop:16,padding:20,overflowX:'auto'}}>
      <div className="panelHead"><div><h3>Relação de alunos</h3><p>{filtrados.length} registro(s) no filtro atual.</p></div></div>
      <table style={{width:'100%',borderCollapse:'collapse',minWidth:900}}><thead><tr>{['Nº','Aluno','Nascimento','Série','Turma','Turno','Responsável','Telefone','Atendente'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 8px',borderBottom:'1px solid #dbe4ef'}}>{h}</th>)}</tr></thead><tbody>{filtrados.map((a,i)=><tr key={a.matricula_id||a.aluno_id||i}><td style={{padding:8,borderBottom:'1px solid #edf1f6'}}>{a.numero_chamada||'—'}</td><td style={{padding:8,borderBottom:'1px solid #edf1f6'}}><strong>{a.nome_lista||a.aluno}</strong><br/><small>{a.codigo_aluno||''}</small></td><td style={{padding:8,borderBottom:'1px solid #edf1f6'}}>{dataBR(a.data_nascimento)}</td><td style={{padding:8,borderBottom:'1px solid #edf1f6'}}>{a.serie}</td><td style={{padding:8,borderBottom:'1px solid #edf1f6'}}>{a.turma||'—'}</td><td style={{padding:8,borderBottom:'1px solid #edf1f6'}}>{a.turno}</td><td style={{padding:8,borderBottom:'1px solid #edf1f6'}}>{a.responsavel_nome||'—'}</td><td style={{padding:8,borderBottom:'1px solid #edf1f6'}}>{a.responsavel_telefone||'—'}</td><td style={{padding:8,borderBottom:'1px solid #edf1f6'}}>{a.atendente_nome||'—'}</td></tr>)}{!filtrados.length&&<tr><td colSpan="9" style={{padding:24,textAlign:'center'}}>Nenhum aluno encontrado.</td></tr>}</tbody></table>
    </section>
  </section>;
}
