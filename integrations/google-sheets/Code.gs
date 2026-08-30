const SPREADSHEET_ID = '1FKOjprgSW0KhuMJBIKwPTYsk3VwoI7KzL17c8KKDXdU';
const TOKEN_PROPERTY = 'MAJESTIC_SYNC_TOKEN';

const TABLE_MAP = {
  profiles: 'FUNCIONARIOS_ACESSOS',
  gestao_clientes: 'CLIENTES',
  gestao_atendimentos: 'ATENDIMENTOS',
  autorizacoes_gestao: 'AUTORIZACOES',
  produtos: 'PRODUTOS_VALORES'
};

function doGet() {
  return json_({ ok: true, service: 'MAJESTIC Google Sheets Mirror', at: new Date().toISOString() });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const expected = PropertiesService.getScriptProperties().getProperty(TOKEN_PROPERTY);
    if (!expected || body.token !== expected) return json_({ ok: false, error: 'unauthorized' });

    const table = String(body.table || '');
    const operation = String(body.operation || body.type || 'UPSERT').toUpperCase();
    const record = body.record || {};
    const oldRecord = body.old_record || {};

    if (!TABLE_MAP[table]) return json_({ ok: false, error: 'table_not_mapped', table });

    mirrorEvent_(table, operation, record, oldRecord);
    appendAudit_(table, operation, record, oldRecord, body.actor || 'supabase');

    return json_({ ok: true, table, operation });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function mirrorEvent_(table, operation, record, oldRecord) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLE_MAP[table]);
  if (!sheet) throw new Error('Aba não encontrada: ' + TABLE_MAP[table]);

  if (operation === 'DELETE') {
    const id = oldRecord.id || record.id;
    if (id) markDeleted_(sheet, id);
    return;
  }

  upsertByHeaders_(sheet, record);

  if (table === 'gestao_clientes') {
    syncMatricula_(record);
  }
  if (table === 'gestao_atendimentos') {
    syncOrcamento_(record);
  }
}

function upsertByHeaders_(sheet, record) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  const idHeader = headers.includes('id') ? 'id' : headers.includes('auth_uid') ? 'auth_uid' : headers[0];
  const idValue = record[idHeader] || record.id;
  if (!idValue) return;

  const row = headers.map(h => normalize_(record[h]));
  let targetRow = findRowById_(sheet, idValue, headers.indexOf(idHeader) + 1);
  if (!targetRow) targetRow = Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);

  const syncStatusCol = headers.indexOf('sync_status');
  if (syncStatusCol >= 0) sheet.getRange(targetRow, syncStatusCol + 1).setValue('OK');
  const syncAtCol = headers.indexOf('sync_at');
  if (syncAtCol >= 0) sheet.getRange(targetRow, syncAtCol + 1).setValue(new Date());
}

function markDeleted_(sheet, idValue) {
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(String);
  const idHeader = headers.includes('id') ? 'id' : headers.includes('auth_uid') ? 'auth_uid' : headers[0];
  const row = findRowById_(sheet, idValue, headers.indexOf(idHeader) + 1);
  if (!row) return;
  const syncStatusCol = headers.indexOf('sync_status');
  if (syncStatusCol >= 0) sheet.getRange(row, syncStatusCol + 1).setValue('DELETED');
  const syncAtCol = headers.indexOf('sync_at');
  if (syncAtCol >= 0) sheet.getRange(row, syncAtCol + 1).setValue(new Date());
}

function syncMatricula_(record) {
  if (!record || record.matriculado !== true) return;
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('MATRICULAS');
  if (!sheet) return;
  const payload = {
    id: record.id,
    cliente_id: record.id,
    nome_aluno: record.nome_aluno,
    nome_responsavel: record.nome_responsavel,
    telefone: record.telefone,
    email: record.email,
    serie: record.serie,
    turma: record.turma,
    turno: record.turno_preferencia,
    tipo_aluno: record.tipo_aluno,
    matriculado: record.matriculado,
    matriculado_at: record.matriculado_at,
    origem: record.origem,
    created_at: record.created_at,
    updated_at: record.updated_at
  };
  upsertByHeaders_(sheet, payload);
}

function syncOrcamento_(record) {
  if (!record || (!record.orcamento_json && !record.valor_orcamento)) return;
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('ORCAMENTOS');
  if (!sheet) return;
  const payload = {
    id: record.id,
    atendimento_id: record.id,
    cliente_id: record.cliente_id,
    funcionario_id: record.funcionario_id,
    funcionario_nome: record.funcionario_nome,
    orcamento_json: record.orcamento_json,
    valor_orcamento: record.valor_orcamento,
    created_at: record.iniciado_at || record.created_at,
    updated_at: record.updated_at
  };
  upsertByHeaders_(sheet, payload);
}

function appendAudit_(table, operation, record, oldRecord, actor) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('LOG_AUDITORIA');
  if (!sheet) return;
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(String);
  const payload = {
    id: Utilities.getUuid(),
    data_hora: new Date(),
    tabela: table,
    operacao: operation,
    registro_id: record.id || oldRecord.id || '',
    usuario: actor,
    antes_json: JSON.stringify(oldRecord || {}),
    depois_json: JSON.stringify(record || {}),
    origem: 'Supabase',
    status: 'OK',
    detalhe: '',
    sync_at: new Date()
  };
  const row = headers.map(h => normalize_(payload[h]));
  sheet.appendRow(row);
}

function findRowById_(sheet, idValue, col) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const finder = sheet.getRange(2, col, lastRow - 1, 1).createTextFinder(String(idValue)).matchEntireCell(true).findNext();
  return finder ? finder.getRow() : 0;
}

function normalize_(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
