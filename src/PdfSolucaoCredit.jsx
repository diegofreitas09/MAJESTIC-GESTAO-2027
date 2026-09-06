const logoPdf = 'https://raw.githubusercontent.com/diegofreitas09/coracoralina/main/logo-pdf-web.png';
const whatsappPdf = `https://wa.me/5585984161882?text=${encodeURIComponent('Olá! Vim por um projeto desenvolvido pela PDF Solução Educacional e gostaria de falar com vocês.')}`;

export default function PdfSolucaoCredit(){
  return (
    <a
      href={whatsappPdf}
      target="_blank"
      rel="noreferrer"
      style={{
        display:'flex',alignItems:'center',justifyContent:'center',gap:12,
        width:'100%',boxSizing:'border-box',padding:'14px 18px',
        background:'#08162f',borderTop:'1px solid rgba(255,255,255,.10)',
        color:'#fff',textDecoration:'none',fontFamily:'inherit'
      }}
      aria-label="Falar com a PDF Solução Educacional"
    >
      <img src={logoPdf} alt="PDF Solução Educacional" style={{height:46,width:'auto',objectFit:'contain'}} />
      <span style={{display:'grid',gap:2,textAlign:'left'}}>
        <small style={{fontSize:10,fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',color:'#9fb0ca'}}>Desenvolvido por</small>
        <strong style={{fontSize:13,fontWeight:900}}>PDF Solução Educacional</strong>
        <span style={{fontSize:12,fontWeight:800,color:'#9ee8ff'}}>(85) 98416-1882</span>
      </span>
    </a>
  );
}
