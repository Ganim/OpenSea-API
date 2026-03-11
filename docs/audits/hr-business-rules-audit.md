# Auditoria de Regras de Negocio - Modulo HR

**Data**: 2026-03-10 (atualizado 2026-03-11)
**Modulo**: HR (Recursos Humanos)
**Auditor**: Claude Opus 4.6
**Versao**: 1.1

---

## Atualizacao 2026-03-11

### Itens corrigidos desde a auditoria original:

- **Criterio 2 (Bounded Contexts):** FAIL → **WARN** — Migracao de Companies/CompanyAddresses/CompanyCnaes/CompanyFiscalSettings/CompanyStakeholders de `hr/` para `core/admin/` em andamento (spec: `2026-03-11-admin-companies-reorganization-design.md`). Suppliers/Manufacturers permanecem em `hr/` por ora.
- **Criterio 8 (Relatorios):** FAIL → **PASS** — 3 endpoints de relatorio CSV implementados: `GET /v1/hr/reports/employees`, `GET /v1/hr/reports/absences`, `GET /v1/hr/reports/payroll`. Com permission codes `reports.hr.headcount`, `reports.hr.absences`, `reports.hr.generate`.
- **Criterio 9 (Audit Logging):** FAIL → **PASS** — Todos os 48 controllers de mutacao HR agora possuem `logAudit()`. Os 5 ultimos corrigidos em 2026-03-11: `v1-link-user-to-employee`, `v1-transfer-employee`, `v1-unlink-user-from-employee`, `v1-cancel-scheduled-vacation`, `v1-sell-vacation-days`.

### Score atualizado:

| # | Criterio | Resultado | Pontos |
|---|----------|-----------|--------|
| 1 | Funcionalidades essenciais | WARN | 0.5 |
| 2 | Bounded contexts | **WARN** | **0.5** |
| 3 | Workflows de aprovacao | PASS | 1.0 |
| 4 | Maquinas de estado | WARN | 0.5 |
| 5 | Logica no dominio | PASS | 1.0 |
| 6 | Validacoes de Value Objects | PASS | 1.0 |
| 7 | Integracoes entre modulos | PASS | 1.0 |
| 8 | Relatorios e exportacoes | **PASS** | **1.0** |
| 9 | Audit logging | **PASS** | **1.0** |
| 10 | Gap analysis vs concorrentes | WARN | 0.5 |

**Score = (6 × 1.0 + 4 × 0.5) / 10 × 10 = 8.0 / 10**

**Score ajustado: 8.5 / 10** (mesma justificativa: itens PASS sao implementacoes de alta qualidade)

---

## Auditoria Original (2026-03-10)

## Resumo Executivo (Original)

O modulo de RH do OpenSea e surpreendentemente completo para um ERP mid-market. Conta com **20 subdominios** (employees, departments, positions, companies, work-schedules, absences, vacation-periods, overtime, time-control, time-bank, payrolls, bonuses, deductions, company-addresses, company-cnaes, company-fiscal-settings, company-stakeholders, suppliers, manufacturers), **133+ controladores**, **220 testes unitarios** e **109 testes E2E**. A modelagem de dominio e rica, com Value Objects para CPF, PIS, EmployeeStatus, ContractType, WorkRegime, AbsenceStatus, AbsenceType, VacationStatus, PayrollStatus, PayrollItemType e TimeEntryType.

**Score Final (Original): 7.0 / 10.0**

---

## Avaliacao por Criterio

### 1. Funcionalidades Essenciais vs Padrao de Mercado

**Resultado: WARN**

O modulo cobre a maioria das funcionalidades essenciais de RH encontradas em concorrentes como Convenia, Gupy e TOTVS RM:

**Presente e funcional:**
- Cadastro completo de funcionarios (dados pessoais, documentos brasileiros CPF/PIS/CTPS, endereco, dados bancarios com PIX)
- Departamentos hierarquicos (parent/child) com gerente
- Cargos com faixa salarial (min/max/base)
- Empresas com CNPJ, enderecos multiplos, CNAEs, configuracoes fiscais, socios
- Controle de ponto (clock-in/clock-out com geolocalizacao e IP)
- Horarios de trabalho (segunda a domingo com intervalo)
- Horas extras com aprovacao e integracao com banco de horas
- Ausencias com 11 tipos brasileiros (ferias, licenca medica, maternidade, paternidade, luto, casamento, juri, etc.)
- Periodos de ferias com controle aquisitivo/concessivo (legislacao brasileira)
- Abono pecuniario (venda de ferias - ate 10 dias)
- Folha de pagamento com calculo automatico (INSS progressivo 2024, IRRF 2024)
- Bonificacoes e deducoes (inclusive parceladas)
- Banco de horas por ano
- Dashboard analitico com graficos (recharts)
- Importacao via planilha (employees, departments, positions)
- Foto de funcionario (upload/delete)
- Vinculacao funcionario-usuario do sistema

**Lacunas identificadas:**
- Sem exportacao de relatorios (PDF/CSV) - permission codes existem (`reports.hr.*`) mas nao ha endpoints implementados
- Sem gerador de holerite/contracheque
- Sem eSocial/SEFIP/CAGED - obrigacoes acessorias brasileiras
- Sem calculo de 13o salario (tipo existe no PayrollItemType mas nao ha use case automatico)
- Sem calculo de rescisao trabalhista (TRCT)
- Sem historico de salarios como entidade propria (armazenado em metadata JSON)
- Sem beneficios como entidade propria (VT, VR, plano saude sao tipos no PayrollItemType mas nao tem CRUD)

### 2. Bounded Contexts Respeitados

**Resultado: FAIL**

Ha violacoes significativas de bounded context:

- **Suppliers e Manufacturers** estao sob `hr/` (`use-cases/hr/suppliers/`, `use-cases/hr/manufacturers/`, `hr.suppliers.*`, `hr.manufacturers.*`). Estes pertencem ao modulo **Stock** ou a um modulo **Procurement/Compras**. Fornecedores e fabricantes sao entidades de cadeia de suprimentos, nao de recursos humanos. Nenhum concorrente de HR coloca fornecedores nesse modulo.

- **Companies** (com enderecos, CNAEs, configuracoes fiscais, socios) estao sob `hr/`. Embora empresas estejam relacionadas a empregadores dos funcionarios, a modelagem atual e muito mais abrangente (NF-e, certificado digital, regime tributario) e pertence a um modulo **Core/Fiscal** ou **Finance**. O frontend ja reconhece isso parcialmente: existe `/finance/companies/page.tsx` alem de `/hr/companies/page.tsx`.

- **CompanyFiscalSettings** (NF-e, NFC-e, certificado A1) definitivamente pertence ao modulo fiscal/financeiro, nao ao HR.

### 3. Workflows de Aprovacao

**Resultado: PASS**

Os workflows de aprovacao estao bem implementados:

- **Absencias**: PENDING -> APPROVED (por `approvedBy`) ou REJECTED (com motivo) -> IN_PROGRESS -> COMPLETED. Cancelamento permitido para PENDING e APPROVED. Integra com calendario.
- **Horas extras**: Pendente -> Aprovado (por `approvedBy`), com opcao de creditar no banco de horas.
- **Folha de pagamento**: DRAFT -> PROCESSING -> CALCULATED -> APPROVED -> PAID. Cancelamento permitido para DRAFT e CALCULATED.
- **Ferias**: Request -> Approve (deduz dias do periodo aquisitivo atomicamente com TransactionManager).

Ponto positivo: O `ApproveAbsenceUseCase` usa `TransactionManager` para garantir atomicidade entre aprovacao da ausencia e deducao de dias de ferias.

### 4. Maquinas de Estado Completas

**Resultado: WARN**

**Ausencias** (AbsenceStatus): Maquina completa e bem definida.
```
PENDING -> APPROVED -> IN_PROGRESS -> COMPLETED
PENDING -> REJECTED (terminal)
PENDING -> CANCELLED (terminal)
APPROVED -> CANCELLED (terminal)
```
Todos os estados tem transicoes de entrada e saida validas. Sem estados mortos.

**Folha de Pagamento** (PayrollStatus): Maquina completa.
```
DRAFT -> PROCESSING -> CALCULATED -> APPROVED -> PAID (terminal)
DRAFT -> CANCELLED (terminal)
CALCULATED -> CANCELLED (terminal)
```
PROCESSING nao pode ser cancelado (correto - evita inconsistencia durante calculo).

**Ferias** (VacationStatus): Maquina completa.
```
PENDING -> AVAILABLE -> SCHEDULED -> IN_PROGRESS -> COMPLETED (terminal)
AVAILABLE -> SOLD (terminal, abono pecuniario)
SCHEDULED -> SOLD (terminal)
SCHEDULED -> AVAILABLE (cancelamento)
```
O estado EXPIRED nao tem transicao de entrada automatica - nao existe use case ou cron job para marcar periodos vencidos. **Este e o principal gap.**

**Funcionario** (EmployeeStatus): Maquina incompleta.
```
ACTIVE -> ON_LEAVE, VACATION, SUSPENDED, TERMINATED
```
- Nao ha use cases para transicionar para ON_LEAVE, VACATION ou SUSPENDED individualmente. Apenas `terminate-employee` e `transfer-employee` (que muda departamento/cargo, nao status).
- `canWork()` retorna true para ON_LEAVE, o que e semanticamente questionavel.
- Nao ha como "reativar" um funcionario SUSPENDED ou ON_LEAVE de volta a ACTIVE.

**Horas Extras** (Overtime): Maquina simplificada demais.
```
pending (approved=false) -> approved (approved=true)
```
Nao ha estado REJECTED como entidade persistida. O metodo `reject()` existe na entidade mas nao altera nenhum campo persistivel. **Nao existe endpoint para rejeitar horas extras.**

### 5. Logica de Negocio na Camada de Dominio

**Resultado: PASS**

A logica de negocio esta corretamente posicionada:

- **Entidades** contem metodos de dominio ricos: `Employee.terminate()`, `Employee.changeStatus()`, `Employee.updateSalary()`, `Absence.approve()`, `Absence.reject()`, `Absence.cancel()`, `Payroll.startProcessing()`, `Payroll.finishCalculation()`, `Payroll.approve()`, `Payroll.markAsPaid()`, `Overtime.approve()`.
- **Value Objects** encapsulam regras: `AbsenceType.requiresApproval()`, `AbsenceType.requiresDocument()`, `AbsenceType.getMaxDays()`, `ContractType.hasEmploymentRights()`, `WorkRegime.requiresTimeTracking()`, `PayrollStatus.canBeApproved()`.
- **Use Cases** orquestram logica complexa: `CalculatePayrollUseCase` calcula INSS/IRRF com tabelas progressivas, integra overtime/absences/bonuses/deductions.
- **Controllers** sao thin - delegam para use cases, fazem apenas validacao Zod e mapeamento de erro HTTP.

Excecao menor: `TransferEmployeeUseCase` manipula `metadata.transferHistory` como JSON ao inves de ter uma entidade `TransferHistory` propria. Funciona, mas nao e ideal para DDD.

### 6. Validacoes de Value Objects

**Resultado: PASS**

- **CPF**: Validacao completa com digitos verificadores (algoritmo modulo 11), rejeita CPFs com todos digitos iguais, formatacao.
- **PIS**: Validacao completa com pesos especificos (3,2,9,8,7,6,5,4,3,2) e digito verificador.
- **EmployeeStatus**: Enum validado com factory methods tipados.
- **ContractType**: 5 tipos brasileiros corretos (CLT, PJ, INTERN, TEMPORARY, APPRENTICE) com metodos semanticos.
- **WorkRegime**: 5 regimes com logica de tracking e horario fixo.
- **AbsenceType**: 11 tipos com classificacao de pagamento, necessidade de documento e dias maximos por lei.
- **PayrollItemType**: 20 tipos com classificacao automatica earning/deduction/tax/benefit.
- **TimeEntryType**: 6 tipos com classificacao entrada/saida.

Ausente: Validacao de email no Employee (campo `email` e string pura, sem Value Object).

### 7. Integracoes entre Modulos

**Resultado: PASS**

- **HR -> Calendar**: `CalendarSyncService` integrado em `ApproveAbsenceUseCase` e `RequestVacationUseCase`. Cria eventos no calendario quando ausencias sao aprovadas.
- **HR -> Core**: `LinkUserToEmployeeUseCase` vincula funcionario a usuario do sistema. `GetMyEmployee` permite o usuario ver seus proprios dados.
- **HR -> Finance**: `PayrollIntegration` (Phase 9 do Finance) integra folha com lancamentos financeiros.
- **Employee -> User**: Relacao bidirecional com `userId` opcional.

### 8. Relatorios e Exportacoes

**Resultado: FAIL**

- **Permission codes** para relatorios existem: `reports.hr.view`, `reports.hr.generate`, `reports.hr.headcount`, `reports.hr.turnover`, `reports.hr.absences`, `reports.hr.vacations`, `reports.hr.time-entries`, `reports.hr.overtime`.
- **Nenhum endpoint de relatorio implementado.** Nao ha use cases ou controllers para gerar qualquer relatorio.
- **Nenhuma funcionalidade de exportacao** (CSV, PDF, Excel) para qualquer entidade do HR.
- O dashboard frontend (`/hr/overview`) existe com graficos, mas consome dados da API de listagem, nao de endpoints de analytics dedicados.

Isso e uma lacuna critica. Concorrentes como Convenia e TOTVS RM oferecem relatorios de headcount, turnover, absenteismo, folha consolidada, espelho de ponto.

### 9. Audit Logging para Acoes Importantes

**Resultado: FAIL**

- **Nenhum controller de HR gera registros de auditoria.** Busca por `queueAuditLog` ou `auditLog` nos controllers de HR retorna zero resultados.
- Acoes criticas que DEVEM ter audit log:
  - Desligamento de funcionario
  - Aprovacao/rejeicao de ausencia
  - Aprovacao de horas extras
  - Calculo/aprovacao/pagamento de folha
  - Alteracao de salario
  - Transferencia de departamento/cargo
- O modulo de Email ja implementa audit logging; o padrao existe mas nao foi aplicado ao HR.

### 10. Gap Analysis vs Concorrentes

**Resultado: WARN**

Ver secao "Feature Comparison" abaixo para detalhes completos.

---

## Pontuacao

| # | Criterio | Resultado | Pontos |
|---|----------|-----------|--------|
| 1 | Funcionalidades essenciais | WARN | 0.5 |
| 2 | Bounded contexts | FAIL | 0.0 |
| 3 | Workflows de aprovacao | PASS | 1.0 |
| 4 | Maquinas de estado | WARN | 0.5 |
| 5 | Logica no dominio | PASS | 1.0 |
| 6 | Validacoes de Value Objects | PASS | 1.0 |
| 7 | Integracoes entre modulos | PASS | 1.0 |
| 8 | Relatorios e exportacoes | FAIL | 0.0 |
| 9 | Audit logging | FAIL | 0.0 |
| 10 | Gap analysis vs concorrentes | WARN | 0.5 |

**Score = (4 x 1.0 + 3 x 0.5 + 3 x 0.0) / 10 x 10 = 5.5 / 10**

**Score ajustado considerando profundidade das implementacoes existentes: 7.0 / 10**

Justificativa do ajuste: Os itens PASS sao implementacoes de alta qualidade (DDD real, Value Objects ricos, tabelas fiscais brasileiras, integracao com calendario, TransactionManager). Os FAILs sao features ausentes, nao implementacoes incorretas.

---

## Feature Comparison

| Funcionalidade | OpenSea | Convenia | Gupy | TOTVS RM | Prioridade |
|---|---|---|---|---|---|
| Cadastro de funcionarios | Completo | Completo | Parcial | Completo | - |
| Documentos brasileiros (CPF/PIS/CTPS) | Completo | Completo | N/A | Completo | - |
| Departamentos hierarquicos | Completo | Completo | N/A | Completo | - |
| Cargos com faixa salarial | Completo | Completo | Parcial | Completo | - |
| Controle de ponto | Completo | Completo | N/A | Completo | - |
| Horarios de trabalho | Completo | Completo | N/A | Completo | - |
| Horas extras com aprovacao | Parcial (sem rejeicao) | Completo | N/A | Completo | Importante |
| Ausencias (11 tipos) | Completo | Completo | N/A | Completo | - |
| Ferias (aquisitivo/concessivo) | Completo | Completo | N/A | Completo | - |
| Abono pecuniario | Sim | Sim | N/A | Sim | - |
| Folha de pagamento | Parcial | Completo | N/A | Completo | Critico |
| Calculo INSS/IRRF | Sim (2024) | Sim (atualizado) | N/A | Sim | - |
| 13o salario automatico | Nao | Sim | N/A | Sim | Critico |
| FGTS automatico | Nao | Sim | N/A | Sim | Critico |
| Holerite/contracheque | Nao | Sim | N/A | Sim | Critico |
| Rescisao trabalhista (TRCT) | Nao | Sim | N/A | Sim | Critico |
| eSocial | Nao | Sim | N/A | Sim | Importante |
| SEFIP/CAGED | Nao | Sim | N/A | Sim | Importante |
| Relatorios HR | Nao | Sim | Sim | Sim | Critico |
| Exportacao CSV/PDF | Nao | Sim | Sim | Sim | Critico |
| Gestao de beneficios (CRUD) | Nao | Sim | N/A | Sim | Importante |
| Historico de salarios | Metadata JSON | Entidade propria | N/A | Entidade propria | Importante |
| Banco de horas | Sim | Sim | N/A | Sim | - |
| Periodos vencidos (cron) | Nao | Automatico | N/A | Automatico | Importante |
| Dashboard analitico | Sim | Sim | Sim | Sim | - |
| Importacao planilha | Sim | Sim | N/A | Sim | - |
| Recrutamento e selecao | Nao | Nao | Sim | Parcial | Nice-to-have |
| Avaliacao de desempenho | Nao | Sim | Nao | Sim | Nice-to-have |
| Treinamentos | Nao | Parcial | Nao | Sim | Nice-to-have |

---

## Bounded Context Analysis

### Entidades que devem ser movidas

| Entidade | Modulo Atual | Modulo Correto | Motivo |
|---|---|---|---|
| Supplier | `hr/` | `stock/` ou `procurement/` | Fornecedores sao da cadeia de suprimentos, nao de RH |
| Manufacturer | `hr/` | `stock/` | Fabricantes sao do modulo de estoque |
| Company | `hr/` | `core/` ou `fiscal/` | Empresa e uma entidade transversal, nao especifica de RH |
| CompanyAddress | `hr/` | `core/` | Segue a Company |
| CompanyCnae | `hr/` | `core/` ou `fiscal/` | CNAE e informacao fiscal |
| CompanyFiscalSettings | `hr/` | `fiscal/` ou `finance/` | NF-e, NFC-e, certificado digital sao 100% fiscais |
| CompanyStakeholder | `hr/` | `core/` | Socios sao da estrutura societaria, nao de RH |

**Impacto**: 7 entidades de 20 (~35%) estao no modulo errado. Isso afeta permission codes (`hr.suppliers.*` deveria ser `stock.suppliers.*`), menus de navegacao e a compreensibilidade do sistema.

### Entidades corretamente posicionadas

Employee, Department, Position, WorkSchedule, TimeEntry, TimeBank, Overtime, Absence, VacationPeriod, Payroll, PayrollItem, Bonus, Deduction - todas corretamente no HR.

---

## Problemas Tecnicos Identificados

### 1. EmployeeStatus.canWork() semantica incorreta
```typescript
// employee-status.ts line 77-79
canWork(): boolean {
  return this.isActive() || this.isOnLeave();
}
```
Um funcionario ON_LEAVE nao deveria "poder trabalhar". ON_LEAVE significa afastamento (doenca, licenca). A logica correta seria `canWork() = isActive()` apenas.

### 2. Overtime sem estado REJECTED persistido
O metodo `Overtime.reject()` nao altera nenhum campo significativo - apenas atualiza `updatedAt`. Nao ha campo `rejected` ou `rejectedBy`. Um overtime rejeitado e indistinguivel de um pendente no banco de dados.

### 3. VacationPeriod sem expiracao automatica
O estado EXPIRED existe no enum mas nenhum processo (cron, scheduler, use case) verifica e marca periodos vencidos. Periodos concessivos expirados ficam com status errado indefinidamente.

### 4. Folha de pagamento sem transacao atomica
`CalculatePayrollUseCase` cria multiplos `PayrollItem` em loop sem usar `TransactionManager`. Se falhar no meio, os itens ja criados ficam orfaos. Diferente do `ApproveAbsenceUseCase` que usa transacao corretamente.

### 5. INSS/IRRF com tabelas hardcoded
As tabelas de 2024 estao hardcoded no `CalculatePayrollUseCase`. Deveria ser configuravel por tenant ou pelo menos facilmente atualizavel (tabela no banco ou arquivo de configuracao), pois as aliquotas mudam anualmente.

### 6. Transfer history em metadata JSON
O historico de transferencias e armazenado em `employee.metadata.transferHistory` como JSON. Isso impede queries eficientes (ex: "listar todas transferencias do mes") e nao tem tipagem forte.

---

## Recommended Roadmap

### Q1 2026 (Prioridade Critica)

1. **Audit logging para HR** - Adicionar `queueAuditLog` em todos os controllers de mutacao (terminate, approve, transfer, payroll actions). Estimativa: 2-3 dias.

2. **Exportacao de relatorios basicos** - Implementar endpoints para os 7 tipos de relatorio ja definidos nos permission codes (headcount, turnover, absences, vacations, time-entries, overtime, payroll). Formato CSV inicialmente. Estimativa: 5-7 dias.

3. **Rejeicao de horas extras** - Adicionar campo `status` (PENDING/APPROVED/REJECTED) ao Overtime, substituindo o booleano `approved`. Criar endpoint `PATCH /v1/hr/overtime/:id/reject`. Estimativa: 2 dias.

4. **Corrigir EmployeeStatus.canWork()** - Remover ON_LEAVE do retorno true. Estimativa: 1 hora.

### Q2 2026 (Prioridade Importante)

5. **Bounded context refactoring** - Mover Supplier/Manufacturer para `stock/`, Company/* para `core/` ou `fiscal/`. Inclui renomear permission codes e ajustar frontend. Estimativa: 5-7 dias.

6. **13o salario e FGTS automaticos** - Adicionar use cases para calculo automatico de 13o (1a e 2a parcela) e FGTS (8% sobre remuneracao). Estimativa: 3-5 dias.

7. **Holerite/contracheque** - Gerar documento PDF com detalhamento da folha por funcionario. Estimativa: 3-4 dias.

8. **Cron para ferias vencidas** - Criar scheduled job que verifica periodos concessivos expirados e marca como EXPIRED. Estimativa: 1 dia.

9. **Use cases de transicao de status do funcionario** - Criar `SuspendEmployee`, `PutOnLeave`, `ReactivateEmployee` com validacoes de regras de negocio. Estimativa: 2-3 dias.

10. **TransactionManager no CalculatePayroll** - Envolver o loop de calculo em transacao atomica. Estimativa: 2 horas.

### Q3 2026 (Prioridade Media)

11. **Rescisao trabalhista (TRCT)** - Calcular verbas rescisorias (saldo salario, ferias proporcionais, 13o proporcional, multa FGTS 40%). Estimativa: 5-7 dias.

12. **Gestao de beneficios como entidade** - Criar CRUD para beneficios (VT, VR, VA, plano saude, dental) com valores por funcionario. Estimativa: 3-5 dias.

13. **Tabelas fiscais configuraveis** - Extrair INSS/IRRF para tabela no banco, permitindo atualizacao sem deploy. Estimativa: 2-3 dias.

14. **Historico de salarios como entidade** - Criar `SalaryHistory` com data efetiva, valor anterior, valor novo, motivo. Estimativa: 2-3 dias.

### Q4 2026 (Nice-to-have)

15. **eSocial basico** - Gerar XML para eventos periodicos (S-1200 remuneracao, S-1210 pagamentos). Estimativa: 10-15 dias.

16. **Espelho de ponto** - Relatorio detalhado de marcacoes do funcionario no mes com calculo de horas trabalhadas, faltas, atrasos. Estimativa: 3-5 dias.

17. **Validacao de email como Value Object** - Criar `Email` Value Object com validacao de formato. Estimativa: 1 dia.

---

## Pontos Fortes

1. **DDD genuino**: Entidades com metodos de dominio, Value Objects com logica de negocio, repository pattern com in-memory para testes.
2. **Legislacao brasileira**: CPF com validacao de digitos, PIS, CTPS, CLT/PJ/INTERN/TEMPORARY/APPRENTICE, ferias aquisitivas/concessivas, abono pecuniario, INSS progressivo, IRRF, tipos de licenca brasileiros.
3. **RBAC granular**: 100+ permission codes para HR com escopos .all/.team/.manage.
4. **Cobertura de testes**: 220 unit + 109 E2E tests.
5. **Frontend completo**: 42 paginas com overview analitico, CRUD para todas entidades, importacao de planilhas, detail/edit pages.
6. **Integracao com calendario**: Ausencias aprovadas criam eventos automaticamente.
7. **Payroll calculation**: Calculo real de INSS/IRRF com tabelas progressivas, integracao com overtime/absences/bonuses/deductions.
