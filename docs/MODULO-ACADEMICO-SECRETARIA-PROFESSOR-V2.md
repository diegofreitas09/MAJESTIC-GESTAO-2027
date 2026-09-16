# MAJESTIC 2027 — Secretaria + App Professor + Notas

## Fonte oficial
Google Sheets é o banco operacional acadêmico. O cadastro oficial do aluno/matrícula alimenta automaticamente turmas, diário, notas, frequência, boletim, secretaria e indicadores. Não redigitar aluno.

## Secretaria — cadastro acadêmico
A Secretaria administra:
- ano letivo e etapas/períodos;
- turmas (série, turma, turno, sala);
- disciplinas/componentes curriculares;
- professores;
- vínculo de um professor com uma ou várias disciplinas;
- vínculo de cada disciplina/professor com uma ou várias turmas;
- calendário de lançamento e fechamento;
- modelos de avaliação por etapa;
- credencial individual do professor.

A senha nunca será gravada em texto puro na planilha. A planilha guarda apenas identificação, perfil, vínculos e status de acesso; autenticação deve usar provedor seguro.

## App Professor (PWA)
Ao entrar, o professor recebe automaticamente os vínculos feitos pela Secretaria. Ele não escolhe turmas ou disciplinas fora de sua lotação.

Fluxo:
1. Login individual.
2. Minhas turmas.
3. Selecionar disciplina (inclusive múltiplas disciplinas atribuídas ao mesmo professor).
4. Selecionar etapa.
5. Ver alunos matriculados na turma, com foto, nome e matrícula.
6. Diário: registrar presença/falta e falta justificada.
7. Avaliações: visualizar modelo definido pela Secretaria e lançar notas/conceitos.
8. Recuperação e 2ª chamada quando habilitadas.
9. Observação pedagógica.
10. Salvar e receber confirmação de sincronização.
11. Fechar etapa quando autorizado.

## Modelos de avaliação por etapa
A estrutura é configurável por segmento/série/etapa. Exemplos de tipos suportados, sem fixar pesos até a escola definir sua regra oficial:
- atividade/trabalho;
- avaliação parcial;
- avaliação bimestral;
- projeto;
- participação;
- produção textual;
- recuperação;
- 2ª chamada;
- conceito/parecer para segmentos que não usam nota numérica.

Cada modelo pode definir: nome, tipo, valor máximo, peso, obrigatório, permite recuperação, permite 2ª chamada e ordem no mapa de notas.

## Frequência/faltas
Registrar por data de aula, turma, disciplina, professor e aluno:
- presente;
- falta;
- falta justificada;
- quantidade de aulas do dia;
- observação;
- data/hora do lançamento e alteração.

O sistema consolida automaticamente faltas e percentual de frequência para Secretaria e boletim.

## Abas acadêmicas no Google Sheets
Criar/usar as seguintes tabelas lógicas:
- ACADEMICO_TURMAS
- ACADEMICO_DISCIPLINAS
- ACADEMICO_PROFESSORES
- ACADEMICO_LOTACOES
- ACADEMICO_ETAPAS
- ACADEMICO_MODELOS_AVALIACAO
- ACADEMICO_AVALIACOES
- ACADEMICO_NOTAS
- ACADEMICO_FREQUENCIA
- ACADEMICO_FECHAMENTOS
- ACADEMICO_AUDITORIA
- ACADEMICO_BOLETINS

## Relacionamentos essenciais
ALUNO/MATRÍCULA -> TURMA
PROFESSOR -> LOTAÇÃO -> TURMA + DISCIPLINA(S)
ETAPA -> MODELO DE AVALIAÇÃO -> AVALIAÇÕES
ALUNO + AVALIAÇÃO -> NOTA
ALUNO + DATA/AULA -> FREQUÊNCIA
NOTAS + FREQUÊNCIA + CADASTRO DO ALUNO -> BOLETIM

## Segurança e auditoria
Professor só altera notas/frequência de suas lotações e etapas abertas. Secretaria gerencia cadastro e vínculos. Coordenação/Direção reabre etapa e audita alterações. Toda alteração de nota preserva valor anterior, novo valor, usuário, data/hora e motivo quando exigido.

## Boletim e indicadores
O boletim consome diretamente cadastro do aluno, matrícula, turma, notas e frequência. Deve suportar foto, código/matrícula, notas por etapa, recuperação, média, faltas, frequência, situação, gráfico de rendimento e comparação pedagógica configurável. Ranking permanece interno por padrão.
