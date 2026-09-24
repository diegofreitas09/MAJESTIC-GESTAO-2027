const SPREADSHEET_ID = '1FKOjprgSW0KhuMJBIKwPTYsk3VwoI7KzL17c8KKDXdU';
const TOKEN_PROPERTY = 'MAJESTIC_SYNC_TOKEN';
const DB_VERSION = '2027.1';

const TABLE_MAP = {
  profiles: 'FUNCIONARIOS_ACESSOS',
  gestao_clientes: 'CLIENTES',
  gestao_atendimentos: 'ATENDIMENTOS',
  autorizacoes_gestao: 'AUTORIZACOES',
  matriculas: 'MATRICULAS',
  orcamentos: 'ORCAMENTOS',
  produtos: 'PRODUTOS_VALORES',
  produtos_comerciais: 'PRODUTOS_VALORES',
  auditoria_eventos: 'LOG_AUDITORIA',
  log_auditoria: 'LOG_AUDITORIA',
  config: 'CONFIG'
};

function doGet() {
  // GET nunca recebe credenciais. Mantém apenas um health check público e sem dados da planilha.
  return json_({
    ok:true,
    service:'MAJESTIC Google Sheets Database',
    version:DB_VERSION,
    at:new Date().toISOString()
  });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    authorize_(body.token);
    const action = String(body.action || body.operation || (body.events ? 'batch' : 'upsert')).toLowerCase();
    if (action === 'batch') return json_({ok:true,...processBatch_(body.events || [],body.actor || 'app')});
    if (action === 'upsert') return json_({ok:true,record:write_(body.table,body.record || {},body.actor || 'app')});
    if (action === 'delete') {
      const oldRecord = body.old_record || {};
      const record = body.record || {};
      const deleteId = body.id || record.id || record.auth_uid || oldRecord.id || oldRecord.auth_uid;
      if (!deleteId) throw new Error('delete_without_id');
      return json_({ok:true,deleted:softDelete_(body.table,deleteId,body.actor || 'app')});
    }
    if (action === 'transaction') return json_({ok:true,...transaction_(body.operations || [],body.actor || 'app')});
    throw new Error('action_not_supported');
  } catch(err) { return json_({ok:false,error:String(err && err.message || err)}); }
}

function authorize_(token) {
  const expected=PropertiesService.getScriptProperties().getProperty(TOKEN_PROPERTY);
  if (!expected || String(token||'') !== String(expected)) throw new Error('unauthorized');
}

function sheet_(table) {
  const name=TABLE_MAP[String(table||'')];
  if(!name) throw new Error('table_not_mapped:'+table);
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
  if(!sh) throw new Error('sheet_not_found:'+name);
  return sh;
}

function headers_(sh){return sh.getRange(1,1,1,Math.max(sh.getLastColumn(),1)).getValues()[0].map(String);}
function idHeader_(headers){return headers.includes('id')?'id':headers.includes('auth_uid')?'auth_uid':headers[0];}

function list_(table,p){
  const sh=sheet_(table), h=headers_(sh), last=sh.getLastRow();
  if(last<2)return [];
  let rows=sh.getRange(2,1,last-1,h.length).getValues().map(r=>rowObject_(h,r));
  rows=rows.filter(r=>String(r.sync_status||'').toUpperCase()!=='DELETED');
  if(p && p.updated_after){const t=new Date(p.updated_after).getTime();rows=rows.filter(r=>new Date(r.updated_at||r.sync_at||0).getTime()>t);}
  const limit=Math.min(Math.max(Number((p&&p.limit)||1000),1),5000);
  return rows.slice(0,limit);
}

function get_(table,id){
  const sh=sheet_(table),h=headers_(sh),idH=idHeader_(h),row=findRowById_(sh,id,h.indexOf(idH)+1);
  if(!row)return null;
  const obj=rowObject_(h,sh.getRange(row,1,1,h.length).getValues()[0]);
  return String(obj.sync_status||'').toUpperCase()==='DELETED'?null:obj;
}

function changes_(table,since){
  const sh=sheet_(table),h=headers_(sh),last=sh.getLastRow(); if(last<2)return [];
  const t=since?new Date(since).getTime():0;
  return sh.getRange(2,1,last-1,h.length).getValues().map(r=>rowObject_(h,r)).filter(r=>new Date(r.sync_at||r.updated_at||0).getTime()>t);
}

function write_(table,record,actor){
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try{
    const sh=sheet_(table),h=headers_(sh),idH=idHeader_(h);
    const rec=Object.assign({},record);
    if(!rec[idH] && rec.id) rec[idH]=rec.id;
    if(!rec[idH] && !rec.id) rec[idH]=Utilities.getUuid();
    if(h.includes('updated_at'))rec.updated_at=new Date().toISOString();
    if(h.includes('sync_status'))rec.sync_status='OK';
    if(h.includes('sync_at'))rec.sync_at=new Date().toISOString();
    upsertByHeaders_(sh,rec);
    if(table==='gestao_clientes')syncMatricula_(rec);
    if(table==='gestao_atendimentos')syncOrcamento_(rec);
    audit_('UPSERT',table,rec[idH]||rec.id,actor,rec);
    touchResumo_(TABLE_MAP[table]);
    return rec;
  } finally {lock.releaseLock();}
}

function softDelete_(table,id,actor){
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try{
    const sh=sheet_(table),h=headers_(sh),idH=idHeader_(h),row=findRowById_(sh,id,h.indexOf(idH)+1);
    if(!row)return false;
    markDeletedByHeaders_(sh,row,h); audit_('DELETE',table,id,actor,{}); touchResumo_(TABLE_MAP[table]); return true;
  } finally {lock.releaseLock();}
}

function processBatch_(events,actor){return transaction_((events||[]).map(ev=>({action:String(ev.operation||ev.action||'upsert').toLowerCase(),table:ev.table,record:ev.record||{},id:ev.id||((ev.record||{}).id)||((ev.record||{}).auth_uid)||((ev.old_record||{}).id)||((ev.old_record||{}).auth_uid)})),actor);}

function transaction_(ops,actor){
  const lock=LockService.getScriptLock();lock.waitLock(30000);let processed=0,errors=[];
  try{
    (ops||[]).forEach((op,i)=>{try{
      const sh=sheet_(op.table),h=headers_(sh),idH=idHeader_(h);
      if(op.action==='delete'){
        const row=findRowById_(sh,op.id,h.indexOf(idH)+1);if(row)markDeletedByHeaders_(sh,row,h);
        audit_('DELETE',op.table,op.id,actor,{});
      } else {
        const rec=Object.assign({},op.record||{});if(!rec[idH]&&rec.id)rec[idH]=rec.id;if(!rec[idH]&&!rec.id)rec[idH]=Utilities.getUuid();
        if(h.includes('updated_at'))rec.updated_at=new Date().toISOString();if(h.includes('sync_status'))rec.sync_status='OK';if(h.includes('sync_at'))rec.sync_at=new Date().toISOString();
        upsertByHeaders_(sh,rec);if(op.table==='gestao_clientes')syncMatricula_(rec);if(op.table==='gestao_atendimentos')syncOrcamento_(rec);audit_('UPSERT',op.table,rec[idH]||rec.id,actor,rec);
      }
      touchResumo_(TABLE_MAP[op.table]);processed++;
    }catch(err){errors.push({index:i,table:op.table,error:String(err&&err.message||err)});}});
    return {processed,errors};
  } finally {lock.releaseLock();}
}

function upsertByHeaders_(sh,record){
  const h=headers_(sh),idH=idHeader_(h),id=record[idH]||record.id;if(!id)throw new Error('record_without_id');
  const row=h.map(k=>normalize_(record[k]));let target=findRowById_(sh,id,h.indexOf(idH)+1);if(!target)target=Math.max(sh.getLastRow()+1,2);
  sh.getRange(target,1,1,row.length).setValues([row]);
  const s=h.indexOf('sync_status');if(s>=0)sh.getRange(target,s+1).setValue('OK');const a=h.indexOf('sync_at');if(a>=0)sh.getRange(target,a+1).setValue(new Date());
}
function markDeletedByHeaders_(sh,row,h){const s=h.indexOf('sync_status');if(s>=0)sh.getRange(row,s+1).setValue('DELETED');const a=h.indexOf('sync_at');if(a>=0)sh.getRange(row,a+1).setValue(new Date());}
function findRowById_(sh,id,col){const n=sh.getLastRow();if(n<2)return 0;const f=sh.getRange(2,col,n-1,1).createTextFinder(String(id)).matchEntireCell(true).findNext();return f?f.getRow():0;}
function rowObject_(h,row){const o={};h.forEach((k,i)=>{let v=row[i];if(v instanceof Date)v=v.toISOString();o[k]=v;});return o;}
function neutralizeFormula_(v){
  if(typeof v!=='string') return v;
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
function normalize_(v){
  if(v===undefined||v===null)return '';
  if(v instanceof Date)return v;
  if(typeof v==='object')return neutralizeFormula_(JSON.stringify(v));
  if(typeof v==='string')return neutralizeFormula_(v);
  return v;
}

function syncMatricula_(r){if(!r||r.matriculado!==true)return;const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('MATRICULAS');if(!sh)return;upsertByHeaders_(sh,{id:r.id,cliente_id:r.id,nome_aluno:r.nome_aluno,nome_responsavel:r.nome_responsavel,telefone:r.telefone,email:r.email,serie:r.serie,turma:r.turma,turno:r.turno_preferencia,tipo_aluno:r.tipo_aluno,matriculado:r.matriculado,matriculado_at:r.matriculado_at,origem:r.origem,created_at:r.created_at,updated_at:r.updated_at,sync_status:'OK',sync_at:new Date()});}
function syncOrcamento_(r){if(!r||(!r.orcamento_json&&!r.valor_orcamento))return;const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('ORCAMENTOS');if(!sh)return;upsertByHeaders_(sh,{id:r.id,atendimento_id:r.id,cliente_id:r.cliente_id,funcionario_id:r.funcionario_id,funcionario_nome:r.funcionario_nome,orcamento_json:r.orcamento_json,valor_orcamento:r.valor_orcamento,created_at:r.iniciado_at||r.created_at,updated_at:r.updated_at,sync_status:'OK',sync_at:new Date()});}

function audit_(acao,modulo,id,actor,data){try{const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('LOG_AUDITORIA');if(!sh)return;const h=headers_(sh),rec={id:Utilities.getUuid(),id_evento:Utilities.getUuid(),ocorrido_em:new Date().toISOString(),acao,modulo,entidade:modulo,registro_id:id,usuario_nome:actor,origem:'google-sheets-db',dados_novos:data,resultado:'OK',sync_status:'OK',sync_at:new Date().toISOString()};const row=h.map(k=>normalize_(rec[k]));sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);}catch(err){console.error('audit_write_failed',String(err&&err.message||err));}}
function touchResumo_(moduleName){try{const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('RESUMO');if(!sh)return;const last=sh.getLastRow();if(last<2)return;const vals=sh.getRange(2,1,last-1,1).getValues();for(let i=0;i<vals.length;i++){if(String(vals[i][0])===String(moduleName)){sh.getRange(i+2,3).setValue('Banco operacional');sh.getRange(i+2,4).setValue(new Date());break;}}}catch(_){}}
function health_(){const ss=SpreadsheetApp.openById(SPREADSHEET_ID);const checks={};Object.keys(TABLE_MAP).forEach(k=>{const n=TABLE_MAP[k];checks[k]=!!ss.getSheetByName(n);});return {ok:true,service:'MAJESTIC Google Sheets Database',version:DB_VERSION,spreadsheet:SPREADSHEET_ID,tables:checks,at:new Date().toISOString()};}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
