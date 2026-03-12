# Module: Finance

## Overview

O módulo Finance é responsável pela gestão financeira completa de um tenant no OpenSea. Abrange o ciclo de vida de contas a pagar e a receber (lançamentos), boletos bancários, categorias financeiras, centros de custo, contas bancárias, empréstimos, consórcios, contratos, lançamentos recorrentes, exportação contábil e integração com folha de pagamento do módulo HR.

O módulo é protegido pelo middleware `verifyModule('FINANCE')`, ou seja, apenas tenants que possuam o módulo FINANCE habilitado em seu plano conseguem acessar qualquer endpoint da área financeira.

**Dependências com outros módulos:**

| Módulo | Dependência |
|--------|-------------|
| `core` | Autenticação JWT, verificação de tenant, auditoria |
| `hr` | Importação de folha de pagamento via `PayrollToFinanceUseCase` |
| `calendar` | Sincronização de vencimentos via `CalendarSyncService` (fire-and-forget) |
| `sales` | Referência a pedidos de venda via `salesOrderId` nos lançamentos |
| `stock` | Referência indireta via ordens de compra que geram lançamentos financeiros |

---

## Entities

### FinanceEntry

Representa um lançamento financeiro individual — contas a pagar (`PAYABLE`) ou a receber (`RECEIVABLE`).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `UniqueEntityID` | Sim | Identificador único |
| `tenantId` | `UniqueEntityID` | Sim | Tenant ao qual pertence o lançamento |
| `type` | `'PAYABLE' \| 'RECEIVABLE'` | Sim | Tipo do lançamento |
| `code` | `string` | Sim | Código sequencial auto-gerado (ex.: `P-0001`, `R-0042`) |
| `description` | `string` | Sim | Descrição do lançamento |
| `notes` | `string?` | Não | Observações adicionais |
| `categoryId` | `UniqueEntityID` | Sim | Categoria financeira obrigatória |
| `costCenterId` | `UniqueEntityID?` | Cond. | Centro de custo simples (mutuamente exclusivo com rateio) |
| `bankAccountId` | `UniqueEntityID?` | Não | Conta bancária associada |
| `supplierName` | `string?` | Não | Nome do fornecedor (para PAYABLE) |
| `customerName` | `string?` | Não | Nome do cliente (para RECEIVABLE) |
| `supplierId` | `string?` | Não | ID do fornecedor |
| `customerId` | `string?` | Não | ID do cliente |
| `salesOrderId` | `string?` | Não | Pedido de venda originador |
| `expectedAmount` | `number` | Sim | Valor previsto (deve ser > 0) |
| `actualAmount` | `number?` | Não | Valor efetivamente pago/recebido |
| `discount` | `number` | Sim | Desconto (padrão: 0) |
| `interest` | `number` | Sim | Juros (padrão: 0) |
| `penalty` | `number` | Sim | Multa (padrão: 0) |
| `issueDate` | `Date` | Sim | Data de emissão |
| `dueDate` | `Date` | Sim | Data de vencimento |
| `competenceDate` | `Date?` | Não | Data de competência contábil |
| `paymentDate` | `Date?` | Não | Data do pagamento efetivo |
| `status` | `string` | Sim | Status do lançamento (ver enumeração abaixo) |
| `recurrenceType` | `'SINGLE' \| 'RECURRING' \| 'INSTALLMENT'` | Sim | Tipo de recorrência (padrão: `SINGLE`) |
| `recurrenceInterval` | `number?` | Cond. | Intervalo da recorrência |
| `recurrenceUnit` | `string?` | Cond. | Unidade da recorrência |
| `totalInstallments` | `number?` | Cond. | Total de parcelas (mín. 2 para INSTALLMENT) |
| `currentInstallment` | `number?` | Não | Número da parcela atual |
| `parentEntryId` | `UniqueEntityID?` | Não | Lançamento-pai (para filhos de INSTALLMENT/RECURRING) |
| `contractId` | `string?` | Não | Contrato originador |
| `boletoBarcode` | `string?` | Não | Código de barras do boleto |
| `boletoDigitLine` | `string?` | Não | Linha digitável do boleto |
| `metadata` | `Record<string, unknown>` | Sim | Metadados livres (padrão: `{}`) |
| `tags` | `string[]` | Sim | Tags para busca e agrupamento (padrão: `[]`) |
| `createdBy` | `string?` | Não | ID do usuário criador |
| `createdAt` | `Date` | Sim | Data de criação |
| `updatedAt` | `Date?` | Não | Data da última atualização |
| `deletedAt` | `Date?` | Não | Soft delete |

**Status do lançamento:**

| Valor | Descrição |
|-------|-----------|
| `PENDING` | Pendente — aguardando pagamento/recebimento |
| `OVERDUE` | Vencido — a data de vencimento passou sem pagamento |
| `PAID` | Pago (PAYABLE quitado) |
| `RECEIVED` | Recebido (RECEIVABLE quitado) |
| `PARTIALLY_PAID` | Parcialmente pago |
| `CANCELLED` | Cancelado |
| `SCHEDULED` | Agendado para data futura |

**Computed getters relevantes:**

- `isOverdue`: retorna `true` se `dueDate < now` e status não é `PAID`, `RECEIVED` ou `CANCELLED`
- `totalDue`: `expectedAmount - discount + interest + penalty`
- `remainingBalance`: `totalDue - (actualAmount ?? 0)`
- `isPayable` / `isReceivable`: shortcuts de tipo

**Unidades de recorrência (`recurrenceUnit`):**

`DAILY | WEEKLY | BIWEEKLY | MONTHLY | QUARTERLY | SEMIANNUAL | ANNUAL`

---

### BankAccount

Representa uma conta bancária do tenant.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `UniqueEntityID` | Sim | Identificador único |
| `tenantId` | `UniqueEntityID` | Sim | Tenant |
| `companyId` | `UniqueEntityID?` | Não | Empresa associada |
| `name` | `string` | Sim | Nome da conta (ex.: "Conta Principal Itaú") |
| `bankCode` | `string` | Sim | Código do banco (ex.: `"341"`) |
| `bankName` | `string?` | Não | Nome do banco |
| `agency` | `string` | Sim | Número da agência |
| `agencyDigit` | `string?` | Não | Dígito da agência |
| `accountNumber` | `string` | Sim | Número da conta |
| `accountDigit` | `string?` | Não | Dígito da conta |
| `accountType` | `string` | Sim | Tipo (`CHECKING`, `SAVINGS`, `INVESTMENT`, etc.) |
| `status` | `string` | Sim | `ACTIVE \| INACTIVE \| CLOSED` (padrão: `ACTIVE`) |
| `pixKeyType` | `string?` | Não | Tipo de chave Pix |
| `pixKey` | `string?` | Não | Chave Pix |
| `currentBalance` | `number` | Sim | Saldo atual (padrão: 0) |
| `balanceUpdatedAt` | `Date?` | Não | Data da última atualização de saldo |
| `color` | `string?` | Não | Cor para identificação visual |
| `isDefault` | `boolean` | Sim | Conta padrão do tenant (padrão: `false`) |
| `createdAt` | `Date` | Sim | Data de criação |

**Computed getters:** `displayAccount` (`accountNumber-accountDigit`), `displayAgency` (`agency-agencyDigit`)

---

### FinanceCategory

Categorias financeiras hierárquicas para classificação de lançamentos.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `UniqueEntityID` | Sim | Identificador único |
| `tenantId` | `UniqueEntityID` | Sim | Tenant |
| `name` | `string` | Sim | Nome da categoria |
| `slug` | `string` | Sim | Slug único por tenant (usado na integração HR) |
| `description` | `string?` | Não | Descrição |
| `iconUrl` | `string?` | Não | URL do ícone |
| `color` | `string?` | Não | Cor para identificação visual |
| `type` | `string` | Sim | `INCOME` (receita) ou `EXPENSE` (despesa) |
| `parentId` | `UniqueEntityID?` | Não | Categoria-pai (hierarquia) |
| `displayOrder` | `number` | Sim | Ordem de exibição (padrão: 0) |
| `isActive` | `boolean` | Sim | Ativa/inativa (padrão: `true`) |
| `isSystem` | `boolean` | Sim | Categoria do sistema — não pode ser excluída (padrão: `false`) |
| `interestRate` | `number?` | Não | Taxa de juros por dia para cálculo automático em atrasos |
| `penaltyRate` | `number?` | Não | Taxa de multa para cálculo automático em atrasos |
| `createdAt` | `Date` | Sim | Data de criação |

**Slugs reservados pelo sistema** (gerados via `SeedFinanceCategoriesUseCase`):

`salarios-e-ordenados`, `gratificacoes-e-bonus`, `encargos-sociais-inss`, `encargos-sociais-fgts`, `impostos-irrf`, `beneficios-plano-saude`, `beneficios-vale-transporte`, `beneficios-vale-refeicao`

---

### CostCenter

Centros de custo para rastreamento e rateio de despesas/receitas.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `UniqueEntityID` | Sim | Identificador único |
| `tenantId` | `UniqueEntityID` | Sim | Tenant |
| `companyId` | `UniqueEntityID?` | Não | Empresa associada |
| `code` | `string` | Sim | Código único do centro de custo |
| `name` | `string` | Sim | Nome |
| `description` | `string?` | Não | Descrição |
| `isActive` | `boolean` | Sim | Ativo/inativo (padrão: `true`) |
| `monthlyBudget` | `number?` | Não | Orçamento mensal |
| `annualBudget` | `number?` | Não | Orçamento anual |
| `parentId` | `UniqueEntityID?` | Não | Centro de custo-pai (hierarquia) |
| `createdAt` | `Date` | Sim | Data de criação |

---

### Loan

Representa um empréstimo ou financiamento do tenant.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `UniqueEntityID` | Sim | Identificador único |
| `tenantId` | `UniqueEntityID` | Sim | Tenant |
| `bankAccountId` | `UniqueEntityID` | Sim | Conta bancária vinculada |
| `costCenterId` | `UniqueEntityID` | Sim | Centro de custo vinculado |
| `name` | `string` | Sim | Nome do empréstimo |
| `type` | `string` | Sim | Tipo (ver tabela abaixo) |
| `contractNumber` | `string?` | Não | Número do contrato |
| `status` | `string` | Sim | `ACTIVE \| PAID_OFF \| DEFAULTED \| RENEGOTIATED \| CANCELLED` |
| `principalAmount` | `number` | Sim | Valor principal |
| `outstandingBalance` | `number` | Sim | Saldo devedor atual |
| `interestRate` | `number` | Sim | Taxa de juros |
| `interestType` | `string?` | Não | Tipo de juros (ex.: `SAC`, `PRICE`, `SIMPLE`) |
| `startDate` | `Date` | Sim | Data de início |
| `endDate` | `Date?` | Não | Data de encerramento prevista |
| `totalInstallments` | `number` | Sim | Total de parcelas |
| `paidInstallments` | `number` | Sim | Parcelas já pagas (padrão: 0) |
| `installmentDay` | `number?` | Não | Dia do mês para vencimento das parcelas |
| `notes` | `string?` | Não | Observações |
| `metadata` | `Record<string, unknown>` | Sim | Metadados |
| `createdAt` | `Date` | Sim | Data de criação |

**Tipos de empréstimo:**
`PERSONAL | BUSINESS | WORKING_CAPITAL | EQUIPMENT | REAL_ESTATE | CREDIT_LINE | OTHER`

**Computed getters:** `progressPercentage`, `remainingInstallments`, `isActive`, `isDefaulted`

---

### LoanInstallment

Parcela individual de um empréstimo.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `UniqueEntityID` | Sim | Identificador único |
| `loanId` | `UniqueEntityID` | Sim | Empréstimo pai |
| `bankAccountId` | `UniqueEntityID?` | Não | Conta bancária do pagamento |
| `installmentNumber` | `number` | Sim | Número sequencial da parcela |
| `dueDate` | `Date` | Sim | Data de vencimento |
| `principalAmount` | `number` | Sim | Parcela de principal |
| `interestAmount` | `number` | Sim | Parcela de juros |
| `totalAmount` | `number` | Sim | Total da parcela (`principal + juros`) |
| `paidAmount` | `number?` | Não | Valor efetivamente pago |
| `paidAt` | `Date?` | Não | Data do pagamento |
| `status` | `string` | Sim | `PENDING \| PAID \| OVERDUE \| CANCELLED` |

---

### Consortium

Representa uma cota de consórcio.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `UniqueEntityID` | Sim | Identificador único |
| `tenantId` | `UniqueEntityID` | Sim | Tenant |
| `bankAccountId` | `UniqueEntityID` | Sim | Conta bancária vinculada |
| `costCenterId` | `UniqueEntityID` | Sim | Centro de custo vinculado |
| `name` | `string` | Sim | Nome do consórcio |
| `administrator` | `string` | Sim | Nome da administradora |
| `groupNumber` | `string?` | Não | Número do grupo |
| `quotaNumber` | `string?` | Não | Número da cota |
| `contractNumber` | `string?` | Não | Número do contrato |
| `status` | `string` | Sim | `ACTIVE \| CONTEMPLATED \| WITHDRAWN \| COMPLETED \| CANCELLED` |
| `creditValue` | `number` | Sim | Valor total do crédito |
| `monthlyPayment` | `number` | Sim | Valor da parcela mensal |
| `totalInstallments` | `number` | Sim | Total de parcelas |
| `paidInstallments` | `number` | Sim | Parcelas pagas (padrão: 0) |
| `isContemplated` | `boolean` | Sim | Se foi contemplado (padrão: `false`) |
| `contemplatedAt` | `Date?` | Não | Data da contemplação |
| `contemplationType` | `'BID' \| 'DRAW'?` | Não | Tipo de contemplação: lance ou sorteio |
| `startDate` | `Date` | Sim | Data de início |
| `endDate` | `Date?` | Não | Data de encerramento |
| `paymentDay` | `number?` | Não | Dia do mês para pagamento |
| `notes` | `string?` | Não | Observações |

**Computed getters:** `progressPercentage`, `remainingInstallments`, `isDeleted`

---

### RecurringConfig

Configuração de lançamentos recorrentes automáticos.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `UniqueEntityID` | Sim | Identificador único |
| `tenantId` | `UniqueEntityID` | Sim | Tenant |
| `type` | `'PAYABLE' \| 'RECEIVABLE'` | Sim | Tipo de lançamento a gerar |
| `status` | `'ACTIVE' \| 'PAUSED' \| 'CANCELLED'` | Sim | Estado da configuração |
| `description` | `string` | Sim | Descrição base para os lançamentos gerados |
| `categoryId` | `UniqueEntityID` | Sim | Categoria financeira |
| `costCenterId` | `UniqueEntityID?` | Não | Centro de custo |
| `bankAccountId` | `UniqueEntityID?` | Não | Conta bancária |
| `expectedAmount` | `number` | Sim | Valor esperado |
| `isVariable` | `boolean` | Sim | Se o valor pode variar entre ocorrências (padrão: `false`) |
| `frequencyUnit` | `string` | Sim | Unidade de frequência |
| `frequencyInterval` | `number` | Sim | Intervalo (padrão: 1) |
| `startDate` | `Date` | Sim | Data de início |
| `endDate` | `Date?` | Não | Data de encerramento da recorrência |
| `totalOccurrences` | `number?` | Não | Limite de ocorrências |
| `generatedCount` | `number` | Sim | Quantidade já gerada (padrão: 0) |
| `lastGeneratedDate` | `Date?` | Não | Data da última geração |
| `nextDueDate` | `Date?` | Não | Próxima data de vencimento |
| `interestRate` | `number?` | Não | Taxa de juros para os lançamentos gerados |
| `penaltyRate` | `number?` | Não | Taxa de multa para os lançamentos gerados |

**Computed getters:** `hasReachedLimit`, `hasPassedEndDate`, `isActive`, `isPaused`, `isCancelled`

---

### Contract

Contratos com fornecedores que geram lançamentos financeiros periódicos.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `UniqueEntityID` | Sim | Identificador único |
| `tenantId` | `UniqueEntityID` | Sim | Tenant |
| `code` | `string` | Sim | Código único do contrato |
| `title` | `string` | Sim | Título do contrato |
| `description` | `string?` | Não | Descrição |
| `status` | `string` | Sim | `DRAFT \| ACTIVE \| EXPIRED \| RENEWED \| CANCELLED` |
| `companyId` | `string?` | Não | ID da empresa/fornecedor |
| `companyName` | `string` | Sim | Nome da empresa/fornecedor |
| `contactName` | `string?` | Não | Nome do contato |
| `contactEmail` | `string?` | Não | E-mail do contato |
| `totalValue` | `number` | Sim | Valor total do contrato |
| `paymentFrequency` | `string` | Sim | Frequência de pagamento (RecurrenceUnit) |
| `paymentAmount` | `number` | Sim | Valor de cada pagamento |
| `categoryId` | `string?` | Não | Categoria financeira |
| `costCenterId` | `string?` | Não | Centro de custo |
| `bankAccountId` | `string?` | Não | Conta bancária |
| `startDate` | `Date` | Sim | Início do contrato |
| `endDate` | `Date` | Sim | Fim do contrato |
| `autoRenew` | `boolean` | Sim | Renovação automática (padrão: `false`) |
| `renewalPeriodMonths` | `number?` | Não | Período de renovação em meses |
| `alertDaysBefore` | `number` | Sim | Dias de antecedência para alerta de vencimento (padrão: 30) |
| `folderPath` | `string?` | Não | Caminho para arquivos do contrato |
| `notes` | `string?` | Não | Observações |

**Computed getter:** `daysUntilExpiration` (número de dias até `endDate`)

---

### FinanceEntryPayment _(value object de pagamento)_

Armazenado via `FinanceEntryPaymentsRepository`. Representa um registro de pagamento parcial ou total de um lançamento.

| Field | Type | Description |
|-------|------|-------------|
| `entryId` | `string` | Lançamento ao qual pertence |
| `amount` | `number` | Valor pago nesta ocorrência |
| `paidAt` | `Date` | Data do pagamento |
| `bankAccountId` | `string?` | Conta bancária usada |
| `method` | `string?` | Forma de pagamento |
| `reference` | `string?` | Referência externa (ex.: comprovante) |
| `notes` | `string?` | Observações |
| `createdBy` | `string?` | ID do usuário |

### FinanceEntryCostCenter _(valor de rateio)_

Representa a alocação percentual de um lançamento entre múltiplos centros de custo.

| Field | Type | Description |
|-------|------|-------------|
| `entryId` | `string` | Lançamento |
| `costCenterId` | `string` | Centro de custo |
| `percentage` | `number` | Percentual (0–100) |
| `amount` | `number` | Valor absoluto calculado |

### FinanceAttachment

Anexo de arquivo vinculado a um lançamento financeiro.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identificador único |
| `entryId` | `string` | Lançamento |
| `fileName` | `string` | Nome do arquivo |
| `fileUrl` | `string` | URL de acesso |
| `fileSize` | `number` | Tamanho em bytes |
| `mimeType` | `string` | Tipo MIME |

---

## Endpoints

Todos os endpoints requerem:
- JWT válido (`verifyJwt`)
- Tenant selecionado (`verifyTenant`)
- Módulo FINANCE habilitado no plano (`verifyModule('FINANCE')`)
- Permissão RBAC específica (`createPermissionMiddleware`)

### Lançamentos (`/v1/finance/entries`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/finance/entries` | `finance.entries.list` | Lista lançamentos paginada |
| `POST` | `/v1/finance/entries` | `finance.entries.create` | Cria lançamento (simples, parcelado ou recorrente) |
| `GET` | `/v1/finance/entries/:id` | `finance.entries.read` | Busca lançamento por ID |
| `PATCH` | `/v1/finance/entries/:id` | `finance.entries.update` | Atualiza lançamento |
| `DELETE` | `/v1/finance/entries/:id` | `finance.entries.delete` | Soft delete de lançamento |
| `POST` | `/v1/finance/entries/:id/payments` | `finance.entries.pay` | Registra pagamento (parcial ou total) |
| `POST` | `/v1/finance/entries/:id/cancel` | `finance.entries.cancel` | Cancela lançamento |
| `POST` | `/v1/finance/parse-boleto` | `finance.entries.create` | Analisa linha digitável de boleto |
| `POST` | `/v1/finance/check-overdue` | `finance.entries.manage` | Marca lançamentos vencidos e cria notificações |
| `POST` | `/v1/finance/import/payroll/:payrollId` | `finance.entries.create` | Importa folha de pagamento como lançamentos |

### Contas Bancárias (`/v1/finance/bank-accounts`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/finance/bank-accounts` | `finance.bank-accounts.list` | Lista contas bancárias |
| `POST` | `/v1/finance/bank-accounts` | `finance.bank-accounts.create` | Cria conta bancária |
| `GET` | `/v1/finance/bank-accounts/:id` | `finance.bank-accounts.read` | Busca conta por ID |
| `PATCH` | `/v1/finance/bank-accounts/:id` | `finance.bank-accounts.update` | Atualiza conta bancária |
| `DELETE` | `/v1/finance/bank-accounts/:id` | `finance.bank-accounts.delete` | Remove conta bancária |

### Categorias (`/v1/finance/categories`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/finance/categories` | `finance.categories.list` | Lista categorias |
| `POST` | `/v1/finance/categories` | `finance.categories.create` | Cria categoria |
| `GET` | `/v1/finance/categories/:id` | `finance.categories.read` | Busca categoria por ID |
| `PATCH` | `/v1/finance/categories/:id` | `finance.categories.update` | Atualiza categoria |
| `DELETE` | `/v1/finance/categories/:id` | `finance.categories.delete` | Remove categoria |

### Centros de Custo (`/v1/finance/cost-centers`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/finance/cost-centers` | `finance.cost-centers.list` | Lista centros de custo |
| `POST` | `/v1/finance/cost-centers` | `finance.cost-centers.create` | Cria centro de custo |
| `GET` | `/v1/finance/cost-centers/:id` | `finance.cost-centers.read` | Busca por ID |
| `PATCH` | `/v1/finance/cost-centers/:id` | `finance.cost-centers.update` | Atualiza |
| `DELETE` | `/v1/finance/cost-centers/:id` | `finance.cost-centers.delete` | Remove |

### Empréstimos (`/v1/finance/loans`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/finance/loans` | `finance.loans.list` | Lista empréstimos |
| `POST` | `/v1/finance/loans` | `finance.loans.create` | Cria empréstimo e gera parcelas |
| `GET` | `/v1/finance/loans/:id` | `finance.loans.read` | Busca por ID |
| `PATCH` | `/v1/finance/loans/:id` | `finance.loans.update` | Atualiza empréstimo |
| `DELETE` | `/v1/finance/loans/:id` | `finance.loans.delete` | Remove empréstimo |
| `POST` | `/v1/finance/loans/:id/payments` | `finance.loans.pay` | Registra pagamento de parcela |

### Consórcios (`/v1/finance/consortia`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/finance/consortia` | `finance.consortia.list` | Lista consórcios |
| `POST` | `/v1/finance/consortia` | `finance.consortia.create` | Cria consórcio |
| `GET` | `/v1/finance/consortia/:id` | `finance.consortia.read` | Busca por ID |
| `PATCH` | `/v1/finance/consortia/:id` | `finance.consortia.update` | Atualiza consórcio |
| `DELETE` | `/v1/finance/consortia/:id` | `finance.consortia.delete` | Remove consórcio |
| `POST` | `/v1/finance/consortia/:id/payments` | `finance.consortia.pay` | Registra pagamento de parcela |
| `PATCH` | `/v1/finance/consortia/:id/contemplated` | `finance.consortia.manage` | Marca consórcio como contemplado |

### Recorrências (`/v1/finance/recurring`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/finance/recurring` | `finance.recurring.list` | Lista configurações recorrentes |
| `POST` | `/v1/finance/recurring` | `finance.recurring.create` | Cria configuração recorrente |
| `GET` | `/v1/finance/recurring/:id` | `finance.recurring.read` | Busca por ID |
| `PATCH` | `/v1/finance/recurring/:id` | `finance.recurring.update` | Atualiza configuração |
| `POST` | `/v1/finance/recurring/:id/pause` | `finance.recurring.manage` | Pausa recorrência |
| `POST` | `/v1/finance/recurring/:id/resume` | `finance.recurring.manage` | Retoma recorrência |
| `POST` | `/v1/finance/recurring/:id/cancel` | `finance.recurring.manage` | Cancela recorrência |

### Contratos (`/v1/finance/contracts`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/finance/contracts` | `finance.contracts.list` | Lista contratos |
| `POST` | `/v1/finance/contracts` | `finance.contracts.create` | Cria contrato |
| `GET` | `/v1/finance/contracts/:id` | `finance.contracts.read` | Busca por ID |
| `PATCH` | `/v1/finance/contracts/:id` | `finance.contracts.update` | Atualiza contrato |
| `DELETE` | `/v1/finance/contracts/:id` | `finance.contracts.delete` | Remove contrato |
| `POST` | `/v1/finance/contracts/:id/generate-entries` | `finance.contracts.manage` | Gera lançamentos a partir do contrato |
| `GET` | `/v1/finance/contracts/supplier-history` | `finance.contracts.read` | Histórico de pagamentos por fornecedor |

### Anexos (`/v1/finance/entries/:id/attachments`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/finance/entries/:id/attachments` | `finance.attachments.list` | Lista anexos do lançamento |
| `POST` | `/v1/finance/entries/:id/attachments` | `finance.attachments.create` | Faz upload de anexo |
| `DELETE` | `/v1/finance/entries/:id/attachments/:attachmentId` | `finance.attachments.delete` | Remove anexo |

### Dashboard e Relatórios

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/finance/dashboard` | `finance.dashboard.view` | Dashboard financeiro principal |
| `GET` | `/v1/finance/dashboard/dre` | `finance.dashboard.view` | DRE interativa |
| `GET` | `/v1/finance/cashflow` | `finance.dashboard.view` | Fluxo de caixa |
| `GET` | `/v1/finance/forecast` | `finance.dashboard.view` | Previsão financeira |
| `GET` | `/v1/finance/export/accounting` | `finance.export.generate` | Exportação contábil CSV |

---

### Request/Response Examples

#### Criar lançamento simples

```http
POST /v1/finance/entries
Authorization: Bearer {token}

{
  "type": "PAYABLE",
  "description": "Aluguel do escritório",
  "categoryId": "cat-uuid",
  "costCenterId": "cc-uuid",
  "expectedAmount": 4500.00,
  "issueDate": "2026-03-01",
  "dueDate": "2026-03-10"
}
```

```json
HTTP/1.1 201 Created
{
  "entry": {
    "id": "entry-uuid",
    "code": "P-0001",
    "type": "PAYABLE",
    "description": "Aluguel do escritório",
    "status": "PENDING",
    "expectedAmount": 4500.00,
    "totalDue": 4500.00,
    "dueDate": "2026-03-10T00:00:00.000Z"
  }
}
```

#### Criar lançamento parcelado (3x)

```http
POST /v1/finance/entries

{
  "type": "PAYABLE",
  "description": "Equipamentos TI",
  "categoryId": "cat-uuid",
  "costCenterId": "cc-uuid",
  "expectedAmount": 9000.00,
  "issueDate": "2026-03-01",
  "dueDate": "2026-03-10",
  "recurrenceType": "INSTALLMENT",
  "totalInstallments": 3,
  "recurrenceInterval": 1,
  "recurrenceUnit": "MONTHLY"
}
```

Retorna o lançamento-pai (`entry`) e o array de parcelas filhas (`installments`). Cada parcela recebe descrição `"Equipamentos TI (1/3)"`, `"(2/3)"`, `"(3/3)"` e valor de `R$ 3.000,00`.

#### Registrar pagamento

```http
POST /v1/finance/entries/{id}/payments

{
  "amount": 4500.00,
  "paidAt": "2026-03-08",
  "bankAccountId": "ba-uuid",
  "method": "PIX"
}
```

```json
{
  "entry": { "id": "...", "status": "PAID", "actualAmount": 4500.00 },
  "payment": { "id": "...", "amount": 4500.00, "paidAt": "2026-03-08T00:00:00.000Z" },
  "calculatedInterest": null,
  "calculatedPenalty": null
}
```

#### Exportação contábil

```http
GET /v1/finance/export/accounting?reportType=ENTRIES&startDate=2026-01-01&endDate=2026-01-31
```

Retorna arquivo CSV com UTF-8 BOM, separador `;`, pronto para Excel.

---

## Business Rules

### Regra 1: Criação de lançamento — centros de custo (XOR simples vs. rateio)

Um lançamento deve ter **exatamente uma** das seguintes configurações de centro de custo:

- **`costCenterId`** (centro único): um único centro de custo absorve 100% do valor.
- **`costCenterAllocations`** (rateio): array de alocações cujos percentuais devem somar exatamente 100%.

Fornecer ambos ou nenhum resulta em erro `400` com código `FINANCE_RATEIO_CONFLICT`. Quando rateio é usado, o campo `costCenterId` no lançamento e em suas parcelas fica `null`; as alocações são armazenadas em `FinanceEntryCostCenter`.

### Regra 2: Geração de parcelas (INSTALLMENT)

Ao criar um lançamento com `recurrenceType: 'INSTALLMENT'`:

1. O lançamento-pai é criado primeiro (é o "container" do parcelamento).
2. São criados N lançamentos-filhos, onde N = `totalInstallments` (mínimo: 2).
3. Cada filho recebe:
   - Valor = `expectedAmount / totalInstallments` (divisão exata; sem arredondamento especial por parcela).
   - Descrição sufixada com `(i/N)`.
   - `parentEntryId` apontando para o pai.
   - Data de vencimento calculada como `dueDate + (i-1) * interval * unit`.
4. Se há rateio (`costCenterAllocations`), as alocações são criadas para **cada parcela filha** individualmente.
5. Toda a operação corre dentro de uma transação (`TransactionManager`).

### Regra 3: Geração de próxima ocorrência (RECURRING)

Ao registrar o pagamento total de uma ocorrência de tipo `RECURRING`:

1. O sistema verifica se a entrada tem `parentEntryId` (indica que é filha de uma cadeia recorrente).
2. Automaticamente cria a próxima ocorrência com:
   - `currentInstallment = currentInstallment + 1`
   - `dueDate = dueDate + interval * unit`
   - Mesmos campos de categoria, centro de custo, valor e tags.
3. A próxima ocorrência não é criada se `RecurringConfig.hasReachedLimit` ou `hasPassedEndDate` for verdadeiro.

### Regra 4: Status de parcelas INSTALLMENT — propagação para o pai

Quando o pagamento total de uma parcela filha (`INSTALLMENT`) é registrado:

1. O sistema consulta todas as irmãs com o mesmo `parentEntryId`.
2. Se **todas** estiverem com status `PAID` ou `RECEIVED`, o lançamento-pai também é marcado como `PAID` / `RECEIVED`.

### Regra 5: Cálculo automático de juros e multa no pagamento em atraso

Ao registrar pagamento (`RegisterPaymentUseCase`), se `paidAt > dueDate`:

1. O sistema busca a categoria do lançamento.
2. Se a categoria tiver `interestRate` definido:
   - `calculatedInterest = expectedAmount × (interestRate / 30) × overdueDays`
3. Se a categoria tiver `penaltyRate` definido:
   - `calculatedPenalty = expectedAmount × penaltyRate`
4. O chamador pode sobrescrever os valores calculados enviando `interest` e `penalty` no body.
5. Os valores finais são persistidos no lançamento antes do registro do pagamento.

### Regra 6: Validação de pagamento — não pode exceder o saldo devedor

O valor acumulado de todos os pagamentos (`sumByEntryId`) mais o novo pagamento não pode exceder `totalDue`. Caso contrário, erro `400`.

### Regra 7: Detecção e notificação de inadimplência (`check-overdue`)

O endpoint `POST /v1/finance/check-overdue` executa duas varreduras:

1. **Marcação de vencidos**: busca entradas `PENDING` com `dueDate < hoje` e muda status para `OVERDUE`. Cria notificação `IN_APP` de prioridade `HIGH` para cada uma.
2. **Alertas de proximidade**: busca entradas `PENDING` com `dueDate` entre hoje e `hoje + dueSoonDays` (padrão: 3). Cria notificação `REMINDER` de prioridade `NORMAL`.

Este endpoint é projetado para ser chamado por um cron job externo (`scripts/check-overdue-cron.ts`), passando o `createdBy` como o userId que receberá as notificações.

### Regra 8: Categorias do sistema (`isSystem: true`)

Categorias com `isSystem: true` são criadas automaticamente pelo `SeedFinanceCategoriesUseCase` na inicialização do tenant. Estas categorias **não podem ser excluídas** e são referenciadas por slug fixo na integração com a folha de pagamento.

### Regra 9: Sincronização com Agenda (CalendarSyncService)

Ao criar um lançamento com `dueDate` no futuro, o sistema chama `CalendarSyncService.syncFinanceEntry()` de forma **fire-and-forget** (fora da transação). Isso cria um evento na agenda corporativa com o vencimento do lançamento.

Ao registrar um pagamento, `CalendarSyncService.updateFinanceEventOnPayment()` é chamado para atualizar o status do evento na agenda. Falhas no sync nunca bloqueiam ou revertam a operação financeira.

### Regra 10: Idempotência na importação de folha de pagamento

`PayrollToFinanceUseCase` verifica a existência de lançamentos com a tag `FOLHA-{payrollId}` antes de criar novos. Se já existirem, lança erro impedindo duplicação.

---

## Use Cases

### Entries

| Use Case | Arquivo | Descrição |
|----------|---------|-----------|
| `CreateFinanceEntryUseCase` | `create-finance-entry.ts` | Cria lançamento; suporta SINGLE, INSTALLMENT, RECURRING e rateio de centros de custo |
| `UpdateFinanceEntryUseCase` | `update-finance-entry.ts` | Atualiza campos de um lançamento existente |
| `DeleteFinanceEntryUseCase` | `delete-finance-entry.ts` | Soft delete de lançamento |
| `GetFinanceEntryByIdUseCase` | `get-finance-entry-by-id.ts` | Busca lançamento por ID com isolamento de tenant |
| `ListFinanceEntriesUseCase` | `list-finance-entries.ts` | Lista paginada com filtros (tipo, status, datas, categoria, centro de custo, busca) |
| `RegisterPaymentUseCase` | `register-payment.ts` | Registra pagamento parcial/total; calcula juros/multa automáticos; gera próxima recorrência |
| `CancelFinanceEntryUseCase` | `cancel-finance-entry.ts` | Cancela lançamento (status → CANCELLED) |
| `CheckOverdueEntriesUseCase` | `check-overdue-entries.ts` | Marca vencidos e cria notificações de inadimplência e proximidade |
| `GenerateRecurringEntriesUseCase` | `generate-recurring-entries.ts` | Gera batch de ocorrências recorrentes (chamado por cron ou manualmente) |
| `ParseBoletoUseCase` | `parse-boleto.ts` | Analisa linha digitável de boleto e extrai banco, valor e data de vencimento |
| `PayrollToFinanceUseCase` | `payroll-to-finance.ts` | Converte folha de pagamento aprovada em lançamentos financeiros |

### Bank Accounts

| Use Case | Descrição |
|----------|-----------|
| `CreateBankAccountUseCase` | Cria conta bancária |
| `UpdateBankAccountUseCase` | Atualiza dados da conta |
| `DeleteBankAccountUseCase` | Remove conta bancária (soft delete) |
| `GetBankAccountByIdUseCase` | Busca por ID |
| `ListBankAccountsUseCase` | Lista contas do tenant |

### Categories

| Use Case | Descrição |
|----------|-----------|
| `CreateFinanceCategoryUseCase` | Cria categoria |
| `UpdateFinanceCategoryUseCase` | Atualiza categoria |
| `DeleteFinanceCategoryUseCase` | Remove (bloqueia se `isSystem: true`) |
| `GetFinanceCategoryByIdUseCase` | Busca por ID |
| `ListFinanceCategoriesUseCase` | Lista categorias |
| `SeedFinanceCategoriesUseCase` | Popula categorias padrão do sistema para um tenant |

### Cost Centers

| Use Case | Descrição |
|----------|-----------|
| `CreateCostCenterUseCase` | Cria centro de custo |
| `UpdateCostCenterUseCase` | Atualiza |
| `DeleteCostCenterUseCase` | Remove |
| `GetCostCenterByIdUseCase` | Busca por ID |
| `ListCostCentersUseCase` | Lista centros do tenant |

### Loans

| Use Case | Descrição |
|----------|-----------|
| `CreateLoanUseCase` | Cria empréstimo e gera todas as parcelas (`LoanInstallment`) via transação |
| `UpdateLoanUseCase` | Atualiza dados do empréstimo |
| `DeleteLoanUseCase` | Remove empréstimo |
| `GetLoanByIdUseCase` | Busca por ID com parcelas |
| `ListLoansUseCase` | Lista empréstimos paginada |
| `RegisterLoanPaymentUseCase` | Registra pagamento de parcela; atualiza `outstandingBalance` e `paidInstallments` |

### Consortia

| Use Case | Descrição |
|----------|-----------|
| `CreateConsortiumUseCase` | Cria consórcio |
| `UpdateConsortiumUseCase` | Atualiza |
| `DeleteConsortiumUseCase` | Remove |
| `GetConsortiumByIdUseCase` | Busca por ID |
| `ListConsortiaUseCase` | Lista consórcios paginada |
| `RegisterConsortiumPaymentUseCase` | Registra pagamento de parcela mensal |
| `MarkContemplatedUseCase` | Registra contemplação (lance ou sorteio); muda status para `CONTEMPLATED` |

### Recurring

| Use Case | Descrição |
|----------|-----------|
| `CreateRecurringConfigUseCase` | Cria configuração recorrente |
| `UpdateRecurringConfigUseCase` | Atualiza configuração |
| `CancelRecurringUseCase` | Cancela (status → CANCELLED) |
| `PauseRecurringUseCase` | Pausa (status → PAUSED) |
| `ResumeRecurringUseCase` | Retoma (status → ACTIVE) |
| `ListRecurringConfigsUseCase` | Lista configurações |
| `GenerateRecurringBatchUseCase` | Gera batch de ocorrências para configs ativas |

### Contracts

| Use Case | Descrição |
|----------|-----------|
| `CreateContractUseCase` | Cria contrato |
| `UpdateContractUseCase` | Atualiza |
| `DeleteContractUseCase` | Remove |
| `GetContractByIdUseCase` | Busca por ID |
| `ListContractsUseCase` | Lista contratos |
| `GenerateContractEntriesUseCase` | Gera lançamentos financeiros a partir do contrato |
| `GetSupplierHistoryUseCase` | Retorna histórico de pagamentos por fornecedor |

### Dashboard

| Use Case | Descrição |
|----------|-----------|
| `GetFinanceDashboardUseCase` | KPIs: total a pagar, a receber, vencidos, saldo de contas |
| `GetDreInteractiveUseCase` | DRE interativa por período e categoria |
| `GetCashflowUseCase` | Fluxo de caixa: entradas vs. saídas por período |
| `GetForecastUseCase` | Previsão financeira com base em lançamentos pendentes |

### Export

| Use Case | Descrição |
|----------|-----------|
| `ExportAccountingDataUseCase` | Gera CSV contábil em 4 formatos: ENTRIES, DRE, BALANCE, CASHFLOW |

### Attachments

| Use Case | Descrição |
|----------|-----------|
| `UploadAttachmentUseCase` | Faz upload de arquivo e vincula ao lançamento |
| `ListAttachmentsUseCase` | Lista anexos de um lançamento |
| `DeleteAttachmentUseCase` | Remove anexo |

---

## Accounting Export

O `ExportAccountingDataUseCase` gera arquivos CSV com UTF-8 BOM (`\ufeff`) e separador `;` para compatibilidade com Excel. Todos os valores monetários usam vírgula como separador decimal.

### ENTRIES — Listagem de Lançamentos

Arquivo: `lancamentos_DD-MM-AAAA_DD-MM-AAAA.csv`

Colunas: `Código; Tipo; Descrição; Categoria; Centro de Custo; Valor Previsto; Valor Pago; Desconto; Juros; Multa; Total Devido; Vencimento; Pagamento; Status; Fornecedor/Cliente; Competência`

Filtros disponíveis: `type`, `costCenterId`, `categoryId`, `startDate`, `endDate`. Limite de 10.000 registros por exportação.

### DRE — Demonstrativo de Resultado do Exercício

Arquivo: `dre_DD-MM-AAAA_DD-MM-AAAA.csv`

Estrutura:
```
RECEITAS
  Receitas Operacionais    R$ X.XXX,XX

(-) CUSTOS E DESPESAS
  Despesas Operacionais    R$ X.XXX,XX

(=) RESULTADO DO PERÍODO  R$ X.XXX,XX
```

Considera lançamentos com status `PAID`, `RECEIVED` ou `PARTIALLY_PAID` no período.

### BALANCE — Balancete por Centro de Custo

Arquivo: `balancete_DD-MM-AAAA_DD-MM-AAAA.csv`

Colunas: `Centro de Custo; Débitos; Créditos; Saldo`

Agrega via `sumByCostCenter()` — resolve o nome do centro de custo a partir do repositório. Linha de totais ao final.

### CASHFLOW — Fluxo de Caixa

Arquivo: `fluxo_caixa_DD-MM-AAAA_DD-MM-AAAA.csv`

Estrutura:
```
RECEBIMENTOS OPERACIONAIS
  Entradas    R$ X.XXX,XX

(-) PAGAMENTOS OPERACIONAIS
  Saídas      R$ X.XXX,XX

(=) CAIXA LÍQUIDO OPERACIONAL  R$ X.XXX,XX
```

---

## Loan Workflow

```
Criação do Empréstimo
        │
        ▼
  [CreateLoanUseCase]
  ┌─────────────────────────────────────────┐
  │ 1. Valida bankAccountId e costCenterId  │
  │ 2. Cria Loan (status: ACTIVE)           │
  │ 3. Gera N LoanInstallments (transação)  │
  │    - principalAmount / totalInstallments│
  │    - interestAmount calculado por taxa  │
  │    - dueDate por installmentDay         │
  └─────────────────────────────────────────┘
        │
        ▼ (ao longo do tempo)
  [RegisterLoanPaymentUseCase]
  ┌─────────────────────────────────────────┐
  │ 1. Localiza LoanInstallment pelo número │
  │ 2. Valida que não está PAID/CANCELLED   │
  │ 3. Marca installment como PAID          │
  │ 4. Atualiza outstandingBalance do Loan  │
  │ 5. Incrementa paidInstallments          │
  │ 6. Se todas pagas → Loan status PAID_OFF│
  └─────────────────────────────────────────┘
```

---

## Consortium Workflow

```
Criação do Consórcio (status: ACTIVE)
        │
        ▼ (mensalmente)
  [RegisterConsortiumPaymentUseCase]
  → Registra parcela mensal
  → Incrementa paidInstallments
        │
        ▼ (evento: contemplação)
  [MarkContemplatedUseCase]
  → isContemplated = true
  → contemplatedAt = now
  → contemplationType = 'BID' | 'DRAW'
  → status = 'CONTEMPLATED'
        │
        ▼ (encerramento)
  → status = 'COMPLETED'
```

---

## Payroll Integration

O `PayrollToFinanceUseCase` converte uma folha de pagamento aprovada em lançamentos financeiros. Requer que o payroll esteja com status `APPROVED` ou `PAID`.

**Lançamentos gerados:**

1. **Um `PAYABLE` por funcionário** com o salário líquido (`gross - deductions`), categoria `salarios-e-ordenados`, tag `FOLHA-{payrollId}` e tag `EMP-{employeeId}`.

2. **Um `PAYABLE` agregado por tipo de encargo** (INSS, FGTS, IRRF), somando os valores de todos os funcionários, com a categoria correspondente.

3. **Um `PAYABLE` agregado por tipo de benefício** (Vale Transporte, Vale Refeição, Plano de Saúde, Plano Odontológico), somando os valores de todos os funcionários.

**Datas:**
- `issueDate`: data da importação
- `dueDate`: último dia do mês de referência da folha
- `competenceDate`: primeiro dia do mês de referência

**Mapeamento de tipos para categorias (por slug):**

| Tipo HR | Slug da Categoria |
|---------|-------------------|
| `BASE_SALARY`, `OVERTIME`, `COMMISSION`, etc. | `salarios-e-ordenados` |
| `BONUS` | `gratificacoes-e-bonus` |
| `INSS` | `encargos-sociais-inss` |
| `FGTS` | `encargos-sociais-fgts` |
| `IRRF` | `impostos-irrf` |
| `HEALTH_PLAN`, `DENTAL_PLAN` | `beneficios-plano-saude` |
| `TRANSPORT_VOUCHER` | `beneficios-vale-transporte` |
| `MEAL_VOUCHER` | `beneficios-vale-refeicao` |

---

## Permissions

| Code | Descrição | Recurso |
|------|-----------|---------|
| `admin.companies.create` | Criar empresas | Companies (migrado para Admin) |
| `admin.companies.read` | Visualizar empresa | Companies (migrado para Admin) |
| `admin.companies.update` | Atualizar empresa | Companies (migrado para Admin) |
| `admin.companies.delete` | Remover empresa | Companies (migrado para Admin) |
| `admin.companies.list` | Listar empresas | Companies (migrado para Admin) |
| `admin.companies.manage` | Gestão total de empresas | Companies (migrado para Admin) |
| `finance.cost-centers.create` | Criar centros de custo | Cost Centers |
| `finance.cost-centers.read` | Visualizar centro de custo | Cost Centers |
| `finance.cost-centers.update` | Atualizar centro de custo | Cost Centers |
| `finance.cost-centers.delete` | Remover centro de custo | Cost Centers |
| `finance.cost-centers.list` | Listar centros de custo | Cost Centers |
| `finance.cost-centers.manage` | Gestão total | Cost Centers |
| `finance.bank-accounts.create` | Criar conta bancária | Bank Accounts |
| `finance.bank-accounts.read` | Visualizar conta | Bank Accounts |
| `finance.bank-accounts.update` | Atualizar conta | Bank Accounts |
| `finance.bank-accounts.delete` | Remover conta | Bank Accounts |
| `finance.bank-accounts.list` | Listar contas | Bank Accounts |
| `finance.bank-accounts.manage` | Gestão total | Bank Accounts |
| `finance.categories.create` | Criar categoria | Categories |
| `finance.categories.read` | Visualizar categoria | Categories |
| `finance.categories.update` | Atualizar categoria | Categories |
| `finance.categories.delete` | Remover categoria | Categories |
| `finance.categories.list` | Listar categorias | Categories |
| `finance.categories.manage` | Gestão total | Categories |
| `finance.entries.create` | Criar lançamento | Entries |
| `finance.entries.read` | Visualizar lançamento | Entries |
| `finance.entries.update` | Atualizar lançamento | Entries |
| `finance.entries.delete` | Remover lançamento | Entries |
| `finance.entries.list` | Listar lançamentos | Entries |
| `finance.entries.pay` | Registrar pagamento | Entries |
| `finance.entries.cancel` | Cancelar lançamento | Entries |
| `finance.entries.manage` | Gestão total (inclui check-overdue) | Entries |
| `finance.attachments.create` | Upload de anexo | Attachments |
| `finance.attachments.read` | Visualizar anexo | Attachments |
| `finance.attachments.delete` | Remover anexo | Attachments |
| `finance.attachments.list` | Listar anexos | Attachments |
| `finance.loans.create` | Criar empréstimo | Loans |
| `finance.loans.read` | Visualizar empréstimo | Loans |
| `finance.loans.update` | Atualizar empréstimo | Loans |
| `finance.loans.delete` | Remover empréstimo | Loans |
| `finance.loans.list` | Listar empréstimos | Loans |
| `finance.loans.pay` | Registrar pagamento de parcela | Loans |
| `finance.loans.manage` | Gestão total | Loans |
| `finance.consortia.create` | Criar consórcio | Consortia |
| `finance.consortia.read` | Visualizar consórcio | Consortia |
| `finance.consortia.update` | Atualizar consórcio | Consortia |
| `finance.consortia.delete` | Remover consórcio | Consortia |
| `finance.consortia.list` | Listar consórcios | Consortia |
| `finance.consortia.pay` | Registrar pagamento | Consortia |
| `finance.consortia.manage` | Gestão total (contemplação) | Consortia |
| `finance.recurring.create` | Criar recorrência | Recurring |
| `finance.recurring.read` | Visualizar recorrência | Recurring |
| `finance.recurring.update` | Atualizar recorrência | Recurring |
| `finance.recurring.delete` | Remover recorrência | Recurring |
| `finance.recurring.list` | Listar recorrências | Recurring |
| `finance.recurring.manage` | Pausar/retomar/cancelar | Recurring |
| `finance.dashboard.view` | Visualizar dashboard e relatórios | Dashboard |
| `finance.export.generate` | Gerar exportação contábil | Export |
| `finance.contracts.create` | Criar contrato | Contracts |
| `finance.contracts.read` | Visualizar contrato | Contracts |
| `finance.contracts.update` | Atualizar contrato | Contracts |
| `finance.contracts.delete` | Remover contrato | Contracts |
| `finance.contracts.list` | Listar contratos | Contracts |
| `finance.contracts.manage` | Gerar lançamentos do contrato | Contracts |

**Total: 48 códigos de permissão**

---

## Data Model

Modelos Prisma relevantes para o módulo Finance. Todos os modelos usam isolamento multi-tenant via campo `tenantId`.

```prisma
model FinanceEntry {
  id                  String    @id @default(uuid())
  tenantId            String    @map("tenant_id")
  type                String    // PAYABLE | RECEIVABLE
  code                String
  description         String
  notes               String?
  categoryId          String    @map("category_id")
  costCenterId        String?   @map("cost_center_id")
  bankAccountId       String?   @map("bank_account_id")
  supplierName        String?   @map("supplier_name")
  customerName        String?   @map("customer_name")
  supplierId          String?   @map("supplier_id")
  customerId          String?   @map("customer_id")
  salesOrderId        String?   @map("sales_order_id")
  expectedAmount      Decimal   @map("expected_amount")
  actualAmount        Decimal?  @map("actual_amount")
  discount            Decimal   @default(0)
  interest            Decimal   @default(0)
  penalty             Decimal   @default(0)
  issueDate           DateTime  @map("issue_date")
  dueDate             DateTime  @map("due_date")
  competenceDate      DateTime? @map("competence_date")
  paymentDate         DateTime? @map("payment_date")
  status              String    @default("PENDING")
  recurrenceType      String    @default("SINGLE") @map("recurrence_type")
  recurrenceInterval  Int?      @map("recurrence_interval")
  recurrenceUnit      String?   @map("recurrence_unit")
  totalInstallments   Int?      @map("total_installments")
  currentInstallment  Int?      @map("current_installment")
  parentEntryId       String?   @map("parent_entry_id")
  contractId          String?   @map("contract_id")
  boletoBarcode       String?   @map("boleto_barcode")
  boletoDigitLine     String?   @map("boleto_digit_line")
  metadata            Json      @default("{}")
  tags                String[]  @default([])
  createdBy           String?   @map("created_by")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime? @updatedAt @map("updated_at")
  deletedAt           DateTime? @map("deleted_at")

  @@unique([tenantId, code])
  @@index([tenantId, type, status])
  @@index([tenantId, dueDate])
  @@index([tenantId, parentEntryId])
  @@map("finance_entries")
}

model BankAccount {
  id               String    @id @default(uuid())
  tenantId         String    @map("tenant_id")
  companyId        String?   @map("company_id")
  name             String
  bankCode         String    @map("bank_code")
  bankName         String?   @map("bank_name")
  agency           String
  agencyDigit      String?   @map("agency_digit")
  accountNumber    String    @map("account_number")
  accountDigit     String?   @map("account_digit")
  accountType      String    @map("account_type")
  status           String    @default("ACTIVE")
  pixKeyType       String?   @map("pix_key_type")
  pixKey           String?   @map("pix_key")
  currentBalance   Decimal   @default(0) @map("current_balance")
  balanceUpdatedAt DateTime? @map("balance_updated_at")
  color            String?
  isDefault        Boolean   @default(false) @map("is_default")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime? @updatedAt @map("updated_at")
  deletedAt        DateTime? @map("deleted_at")

  @@index([tenantId, status])
  @@map("bank_accounts")
}

model FinanceCategory {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  name          String
  slug          String
  type          String    // INCOME | EXPENSE
  parentId      String?   @map("parent_id")
  displayOrder  Int       @default(0) @map("display_order")
  isActive      Boolean   @default(true) @map("is_active")
  isSystem      Boolean   @default(false) @map("is_system")
  interestRate  Decimal?  @map("interest_rate")
  penaltyRate   Decimal?  @map("penalty_rate")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime? @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  @@unique([tenantId, slug])
  @@index([tenantId, type, isActive])
  @@map("finance_categories")
}

model CostCenter {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  companyId     String?   @map("company_id")
  code          String
  name          String
  isActive      Boolean   @default(true) @map("is_active")
  monthlyBudget Decimal?  @map("monthly_budget")
  annualBudget  Decimal?  @map("annual_budget")
  parentId      String?   @map("parent_id")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime? @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  @@unique([tenantId, code])
  @@index([tenantId, isActive])
  @@map("cost_centers")
}

model Loan {
  id                String    @id @default(uuid())
  tenantId          String    @map("tenant_id")
  bankAccountId     String    @map("bank_account_id")
  costCenterId      String    @map("cost_center_id")
  name              String
  type              String
  contractNumber    String?   @map("contract_number")
  status            String    @default("ACTIVE")
  principalAmount   Decimal   @map("principal_amount")
  outstandingBalance Decimal  @map("outstanding_balance")
  interestRate      Decimal   @map("interest_rate")
  interestType      String?   @map("interest_type")
  startDate         DateTime  @map("start_date")
  endDate           DateTime? @map("end_date")
  totalInstallments Int       @map("total_installments")
  paidInstallments  Int       @default(0) @map("paid_installments")
  installmentDay    Int?      @map("installment_day")
  notes             String?
  metadata          Json      @default("{}")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime? @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at")

  installments LoanInstallment[]

  @@index([tenantId, status])
  @@map("loans")
}

model Consortium {
  id                  String    @id @default(uuid())
  tenantId            String    @map("tenant_id")
  bankAccountId       String    @map("bank_account_id")
  costCenterId        String    @map("cost_center_id")
  name                String
  administrator       String
  groupNumber         String?   @map("group_number")
  quotaNumber         String?   @map("quota_number")
  contractNumber      String?   @map("contract_number")
  status              String    @default("ACTIVE")
  creditValue         Decimal   @map("credit_value")
  monthlyPayment      Decimal   @map("monthly_payment")
  totalInstallments   Int       @map("total_installments")
  paidInstallments    Int       @default(0) @map("paid_installments")
  isContemplated      Boolean   @default(false) @map("is_contemplated")
  contemplatedAt      DateTime? @map("contemplated_at")
  contemplationType   String?   @map("contemplation_type")
  startDate           DateTime  @map("start_date")
  endDate             DateTime? @map("end_date")
  paymentDay          Int?      @map("payment_day")
  notes               String?
  metadata            Json      @default("{}")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime? @updatedAt @map("updated_at")
  deletedAt           DateTime? @map("deleted_at")

  @@index([tenantId, status])
  @@map("consortia")
}
```

---

## Tests

### Testes Unitários

| Recurso | Arquivo(s) | Cobertura |
|---------|------------|-----------|
| Entries | `create-finance-entry.spec.ts`, `register-payment.spec.ts`, `cancel-finance-entry.spec.ts`, `check-overdue-entries.spec.ts`, `generate-recurring-entries.spec.ts`, `parse-boleto.spec.ts`, `payroll-to-finance.spec.ts`, `update-finance-entry.spec.ts`, `delete-finance-entry.spec.ts`, `list-finance-entries.spec.ts`, `get-finance-entry-by-id.spec.ts` | 11 arquivos |
| Bank Accounts | `create-bank-account.spec.ts`, `update-bank-account.spec.ts`, `delete-bank-account.spec.ts`, `get-bank-account-by-id.spec.ts`, `list-bank-accounts.spec.ts` | 5 arquivos |
| Categories | `create-finance-category.spec.ts`, `update-finance-category.spec.ts`, `delete-finance-category.spec.ts`, `get-finance-category-by-id.spec.ts`, `list-finance-categories.spec.ts`, `seed-finance-categories.spec.ts` | 6 arquivos |
| Cost Centers | `create-cost-center.spec.ts`, `update-cost-center.spec.ts`, `delete-cost-center.spec.ts`, `get-cost-center-by-id.spec.ts`, `list-cost-centers.spec.ts` | 5 arquivos |
| Loans | `create-loan.spec.ts`, `update-loan.spec.ts`, `delete-loan.spec.ts`, `get-loan-by-id.spec.ts`, `list-loans.spec.ts`, `register-loan-payment.spec.ts` | 6 arquivos |
| Consortia | `create-consortium.spec.ts`, `update-consortium.spec.ts`, `delete-consortium.spec.ts`, `get-consortium-by-id.spec.ts`, `list-consortia.spec.ts`, `register-consortium-payment.spec.ts`, `mark-contemplated.spec.ts` | 7 arquivos |
| Recurring | `create-recurring-config.spec.ts`, `update-recurring-config.spec.ts`, `cancel-recurring.spec.ts`, `pause-recurring.spec.ts`, `resume-recurring.spec.ts`, `list-recurring-configs.spec.ts`, `generate-recurring-batch.spec.ts` | 7 arquivos |
| Contracts | `create-contract.spec.ts`, `update-contract.spec.ts`, `delete-contract.spec.ts`, `get-contract-by-id.spec.ts`, `list-contracts.spec.ts`, `generate-contract-entries.spec.ts`, `get-supplier-history.spec.ts` | 7 arquivos |
| Attachments | `upload-attachment.spec.ts`, `list-attachments.spec.ts`, `delete-attachment.spec.ts` | 3 arquivos |
| Dashboard | `get-finance-dashboard.spec.ts`, `get-cashflow.spec.ts`, `get-dre-interactive.spec.ts`, `get-forecast.spec.ts` | 4 arquivos |
| Export | `export-accounting-data.spec.ts` | 1 arquivo |

**Total estimado: ~61 arquivos de teste unitário**

### Testes E2E

Cada controller possui seu próprio `*.e2e.spec.ts`. Recursos cobertos:

- Criação, atualização, listagem, busca por ID e remoção para todos os recursos
- Parcelamento: validação de mínimo de 2 parcelas, geração correta de filhas
- Rateio: validação de soma 100%, exclusividade com `costCenterId`
- Pagamento: parcial, total, excesso de saldo, cálculo de juros/multa em atraso
- Recorrência: geração automática da próxima ocorrência ao quitar
- Inadimplência: marcação de `OVERDUE` e criação de notificações
- Importação de folha: idempotência, mapeamento de tipos, payroll não aprovado
- Exportação contábil: 4 tipos de relatório, CSV com BOM

### Factories (Testes)

| Localização | Função |
|-------------|--------|
| `src/use-cases/finance/entries/factories/` | `make-create-finance-entry-use-case.ts` e demais |
| `src/use-cases/finance/loans/factories/` | `make-create-loan-use-case.ts` e demais |
| `src/use-cases/finance/consortia/factories/` | `make-create-consortium-use-case.ts` e demais |
| `src/use-cases/finance/bank-accounts/factories/` | `make-create-bank-account-use-case.ts` e demais |
| `src/use-cases/finance/categories/factories/` | `make-create-finance-category-use-case.ts` e demais |
| `src/use-cases/finance/cost-centers/factories/` | `make-create-cost-center-use-case.ts` e demais |
| `src/use-cases/finance/export/factories/` | `make-export-accounting-data-use-case.ts` |
| `src/use-cases/finance/dashboard/factories/` | `make-get-finance-dashboard-use-case.ts` e demais |

---

## Audit History

| Date | Dimension | Score | Report |
|------|-----------|-------|--------|
| 2026-03-10 | Documentação inicial | — | Criado este arquivo |
| 2026-03-10 | Auditoria consolidada (12 dims) | 7.8/10 | `docs/audits/2026-03-10-finance-consolidated.md` |
| 2026-03-11 | Correções de auditoria | ~9.0/10 | Todas as issues CRIT/MED resolvidas: |
| | Segurança | 8.0→9.5 | `createPermissionMiddleware` em 63 controllers |
| | Integridade de Dados | 7.5→9.0 | `generateNextCode` atômico (FinanceCodeSequence), RegisterPayment com TransactionManager, guard delete paid entries |
| | Performance | 7.0→9.0 | Endpoint consolidado `/v1/finance/overview` (9→1 request), supplierName/customerName removidos de criptografia |
| | Padronização | 8.0→9.5 | Entity props `string`→union types (7 novos tipos), `calculateNextDate` extraído para utility |
| | Acessibilidade | 6.5→9.0 | aria-label em todas as 22 tabelas do módulo |
| | Regras de Negócio | 8.5→9.0 | Validação `dueDate >= issueDate` via .refine(), competenceDate default issueDate |
| | Governança | 8.0→9.0 | 4 ADRs criados (019-022): field-encryption, cost-center-allocation, code-sequence, transactions |
| | UI/UX | 7.5→9.0 | ~90 correções de acentos PT-BR em 16 arquivos |
| 2026-03-11 | Companies reorganization | — | Empresas migradas de HR/Finance para Admin (`/v1/admin/companies`). Finance consome via `admin.companies.*` permissions. Frontend usa `services/admin/companies.service.ts` |
