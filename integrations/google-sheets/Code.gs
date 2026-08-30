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

    if (Array.isArray(body.events)) {
      const result = processBatch_(body.events, body.actor || 'supabase');
      return json_({ ok: true, mode: 'batch', received: body.events.length, processed: result.processed, errors: result.errors });
    }

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

function processBatch_(events, defaultActor) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const byTable = {};
  const errors = [];
  let processed = 0;

  events.forEach((ev, idx) => {
    try {
      const table = String(ev.table || '');
      const operation = String(ev.operation || ev.type || 'UPSERT').toUpperCase();
      if (!TABLE_MAP[table]) throw new Error('table_not_mapped:' + table);
      if (!byTable[table]) byTable[table] = [];
      byTable[table].push({ operation, record: ev.record || {}, oldRecord: ev.old_record || {}, actor: ev.actor || defaultActor });
    } catch (err) {
      errors.push({ index: idx, error: String(err && err.message || err) });
    }
  });

  Object.keys(byTable).forEach(table => {
    const sheet = ss.getSheetByName(TABLE_MAP[table]);
    if (!sheet) {
      errors.push({ table, error: 'Aba não encontrada: ' + TABLE_MAP[table] });
      return;
    }

    const eventsTable = byTable[table];
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    const idHeader = headers.includes('id') ? 'id' : headers.includes('auth_uid') ? 'auth_uid' : headers[0];
    const idCol = headers.indexOf(idHeader);
    const existing = {};

    if (sheet.getLastRow() >= 2 && idCol >= 0) {
      const ids = sheet.getRange(2, idCol + 1, sheet.getLastRow() - 1, 1).getValues();
      ids.forEach((r, i) => { if (r[0] !== '' && r[0] != null) existing[String(r[0])] = i + 2; });
    }

    const appendRows = [];
    const updates = [];

    eventsTable.forEach(ev => {
      try {
        if (ev.operation === 'DELETE') {
          const id = ev.oldRecord.id || ev.record.id;
          if (id && existing[String(id)]) markDeletedByHeaders_(sheet, existing[String(id)], headers);
          appendAudit_(table, ev.operation, ev.record, ev.oldRecord, ev.actor);
          processed++;
          return;
        }

        const idValue = ev.record[idHeader] || ev.record.id;
        if (!idValue) throw new Error('registro_sem_id');
        const row = headers.map(h => normalize_(ev.record[h]));
        const syncStatusCol = headers.indexOf('sync_status');
        const syncAtCol = headers.indexOf('sync_at');
        if (syncStatusCol >= 0) row[syncStatusCol] = 'OK';
        if (syncAtCol >= 0) row[syncAtCol] = new Date();

        const rowNumber = existing[String(idValue)];
        if (rowNumber) updates.push({ rowNumber, row });
        else {
          appendRows.push(row);
          existing[String(idValue)] = sheet.getLastRow() + appendRows.length;
        }

        if (table === 'gestao_clientes') syncMatricula_(ev.record);
        if (table === 'gestao_atendimentos') syncOrcamento_(ev.record);
        appendAudit_(table, ev.operation, ev.record, ev.oldRecord, ev.actor);
        processed++;
      } catch (err) {
        errors.push({ table, id: ev.record && ev.record.id, error: String(err && err.message || err) });
      }
    });

    updates.forEach(u => sheet.getRange(u.rowNumber, 1, 1, u.row.length).setValues([u.row]));
    if (appendRows.length) sheet.getRange(sheet.getLastRow() + 1, 1, appendRows.length, headers.length).setValues(appendRows);
  });

  return { processed, errors };
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
  if (table === 'gestao_clientes') syncMatricula_(record);
  if (table === 'gestao_atendimentos') syncOrcamento_(record);
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

function markDeletedByHeaders_(sheet, row, headers) {
  const syncStatusCol = headers.indexOf('sync_status');
  if (syncStatusCol >= 0) sheet.getRange(row, syncStatusCol + 1).setValue('DELETED');
  const syncAtCol = headers.indexOf('sync_at');
  if (syncAtCol >= 0) sheet.getRange(row, syncAtCol + 1).setValue(new Date());
}

function markDeleted_(sheet, idValue) {
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(String);
  const idHeader = headers.includes('id') ? 'id' : headers.includes('auth_uid') ? 'auth_uid' : headers[0];
  const row = findRowById_(sheet, idValue, headers.indexOf(idHeader) + 1);
  if (!row) return;
  markDeletedByHeaders_(sheet, row, headers);
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
    id_evento: Utilities.getUuid(),
    id: Utilities.getUuid(),
    timestamp: new Date(),
    data_hora: new Date(),
    usuario_id: '',
    usuario_nome: actor,
    usuario: actor,
    role: '',
    acao: operation,
    operacao: operation,
    modulo: table,
    tabela: table,
    entidade: table,
    entidade_id: record.id || oldRecord.id || '',
    registro_id: record.id || oldRecord.id || '',
    valor_anterior: JSON.stringify(oldRecord || {}),
    antes_json: JSON.stringify(oldRecord || {}),
    valor_novo: JSON.stringify(record || {}),
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
