# Matriz de Permissões

Legenda: R=ler, C=criar, E=editar, X=excluir, A=aprovar/admin.

| Recurso | Direção | Gestão | Matrícula |
|---|---|---|---|
| profiles | R/E/A | próprio perfil R | próprio perfil R |
| clientes | R/C/E/X | R/C/E | R/C/E |
| atendimentos | R/C/E/X | R/C/E | R/C/E |
| alunos | R/C/E/X | R/C/E | R/C/E |
| matrículas | R/C/E/X | R/C/E | R/C/E |
| produtos | R/C/E/A | R | R |
| mensalidades config | R/C/E/A | R | R |
| autorizações | R/C/E/X/A | R/C/E limitado | R/C/E limitado |
| integração config | R/C/E/A | — | — |
| log auditoria | R | — | — |

Observação: o frontend não é a barreira de segurança. A matriz acima deriva das RLS/policies e triggers examinados em 2026-09-24.
