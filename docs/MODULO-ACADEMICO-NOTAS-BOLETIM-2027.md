# MAJESTIC 2027 — Módulo Acadêmico, Notas e Boletim

## Objetivo
Criar um app/PWA integrado para professores lançarem notas e frequência diretamente na base acadêmica oficial. O mesmo dado alimentará Secretaria, ficha do aluno, boletim, indicadores pedagógicos e ranking interno, sem redigitação.

## Princípio de dados
- Um aluno = um cadastro oficial, ligado à matrícula 2027.
- Notas não ficam duplicadas em planilhas isoladas.
- Cada lançamento registra professor, disciplina, turma, período, avaliação, valor, data e auditoria.
- Alterações de nota preservam histórico (valor anterior, novo valor, usuário e horário).
- Publicação para família é separada do simples lançamento: professor lança; coordenação/direção pode revisar/publicar conforme configuração.

## App Professor (PWA)
Fluxo principal:
1. Login individual do professor.
2. Minhas turmas e disciplinas.
3. Seleção do período (1º/2º/3º/4º bimestre, configurável).
4. Mapa de notas da turma em formato de grade.
5. Lançamento rápido por aluno, com salvamento automático/confirmado.
6. Frequência/faltas no mesmo contexto.
7. Recuperação, 2ª chamada e observação pedagógica quando habilitadas.
8. Fechamento do período com bloqueio posterior, salvo reabertura pela coordenação.

## Estrutura de banco proposta
### disciplinas
id, nome, sigla, area_bncc, ativo

### professores
id, profile_id, nome, email, ativo

### turmas_academicas
id, ano_letivo, serie, turma, turno, ativo

### professor_turma_disciplina
id, professor_id, turma_id, disciplina_id, ativo

### periodos_avaliativos
id, ano_letivo, nome, ordem, inicio, fim, data_limite_lancamento, publicado

### avaliacoes
id, turma_id, disciplina_id, periodo_id, professor_id, titulo, tipo, peso, valor_maximo, data_avaliacao, ativo

### notas
id, aluno_id, matricula_id, turma_id, disciplina_id, periodo_id, avaliacao_id, professor_id, nota, recuperacao, segunda_chamada, observacao, status, criado_em, atualizado_em

### frequencias
id, aluno_id, matricula_id, turma_id, disciplina_id, professor_id, data_aula, presente, falta_justificada, observacao

### notas_auditoria
id, nota_id, usuario_id, valor_anterior, valor_novo, motivo, ocorrido_em

### boletins_publicacoes
id, aluno_id, matricula_id, periodo_id, publicado_em, publicado_por, versao

## Regras configuráveis
Não fixar fórmula de média no código. Criar configuração por segmento/série para média aritmética ou ponderada, recuperação, nota mínima, arredondamento, quantidade de períodos e regra de aprovação. Educação Infantil deve permitir conceitos/pareceres em vez de nota numérica.

## Boletim Majestic 2027
Cabeçalho com identidade Majestic e ano letivo. Dados vindos automaticamente da matrícula: foto, nome completo, código/matrícula, nascimento, série, turma, turno e responsável.

Tabela acadêmica por componente curricular:
- notas por período;
- recuperação/2ª chamada quando aplicável;
- média parcial/final;
- faltas e frequência;
- situação.

Área visual de rendimento:
- gráfico de evolução por período;
- gráfico por componente curricular;
- média do aluno x média da turma (quando autorizado);
- indicador de tendência de rendimento;
- destaque pedagógico de disciplinas abaixo da média.

Rodapé:
- observações pedagógicas;
- situação final;
- legenda do sistema avaliativo;
- assinaturas/campos institucionais;
- data de emissão e código de validação/QR futuramente.

## Ranking
Ranking é recurso interno de gestão pedagógica, calculado a partir de critérios configurados. Evitar exposição pública da colocação individual sem decisão institucional. Permitir ranking por turma, série, disciplina e período, com média, evolução e frequência. No boletim da família, o ranking deve ser opcional e desligado por padrão.

## Integrações
Professor -> Notas/Frequência -> Banco acadêmico -> Secretaria -> Ficha do aluno -> Boletim -> Dashboard/Ranking.

A matrícula confirmada cria/atualiza o vínculo acadêmico do aluno. A Secretaria não redigita nome, série ou matrícula para gerar boletim.

## Permissões
- professor: somente suas turmas/disciplinas e períodos abertos;
- coordenação: todas as turmas acadêmicas, revisão e reabertura;
- secretaria: dados cadastrais, matrícula e emissão de documentos; não altera nota sem permissão acadêmica;
- direção: visão completa, configurações e auditoria;
- família/aluno (fase posterior): somente boletins já publicados.

## Referências pesquisadas em setembro/2026
O desenho considera padrões observados em sistemas escolares brasileiros atuais: boletim com notas por período e frequência; impressão individual/em lote; modelos por série; publicação controlada; cálculo automático de médias/recuperação; gráficos de desempenho; e integração entre lançamento docente, secretaria e boletim.
