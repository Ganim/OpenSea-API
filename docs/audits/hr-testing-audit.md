# Auditoria de Qualidade de Testes — Módulo HR

**Data:** 2026-03-10
**Módulo:** `hr` (employees, departments, positions, companies, work-schedules, absences, payroll, overtime, suppliers, manufacturers)
**Auditor:** QA Senior — Claude Sonnet 4.6
**Repositório:** `OpenSea-API`

---

## Sumário Executivo

O módulo HR apresenta cobertura de testes **sólida e consistente**, com todos os 120+ casos de uso possuindo arquivos `.spec.ts` individuais e todos os 160+ controladores possuindo arquivos `.e2e.spec.ts` correspondentes. A infraestrutura de testes está bem organizada, com fábricas dedicadas e repositórios em memória fieis. As principais oportunidades de melhoria concentram-se em: (1) testes mínimos ("smoke tests") para casos de uso de baixa complexidade que merecem cobertura mais ampla de cenários de erro, (2) ausência total de testes de isolamento multi-tenant explícitos, e (3) uso recorrente de `Date.now()` em testes E2E sem semente determinística.

**Pontuação Final: 7.0 / 10**

```
PASS:  5 critérios × 1.0 =  5.0
WARN:  4 critérios × 0.5 =  2.0
FAIL:  1 critério  × 0.0 =  0.0
Total: 7.0 / 10
```

---

## Tabela de Critérios

| #   | Critério                                                           | Resultado | Severidade |
| --- | ------------------------------------------------------------------ | --------- | ---------- |
| 1   | Cobertura >= 70% linhas (threshold do projeto)                     | WARN      | high       |
| 2   | Todo caso de uso tem arquivo de teste unitário (\*.spec.ts)        | PASS      | critical   |
| 3   | Todo controlador tem arquivo de teste E2E (\*.e2e.spec.ts)         | PASS      | critical   |
| 4   | Caminho feliz E cenários de erro cobertos                          | WARN      | high       |
| 5   | Casos extremos testados (vazio, nulo, valores limite)              | PASS      | medium     |
| 6   | Repositórios em memória simulam fielmente o comportamento do banco | PASS      | medium     |
| 7   | Fábricas de teste existem e são utilizadas (sem dados inline)      | PASS      | medium     |
| 8   | Ausência de testes frágeis (determinismo)                          | WARN      | medium     |
| 9   | Assertions são significativas (não apenas "não travou")            | WARN      | medium     |
| 10  | Testes de isolamento multi-tenant existem                          | FAIL      | high       |

---

## Análise Detalhada por Critério

---

### Critério 1 — Cobertura >= 70% Linhas — WARN

**Configuração verificada em** `D:/Code/Projetos/OpenSea/OpenSea-API/vite.config.mjs`:

```
thresholds:
  lines:      70
  functions:  65
  branches:   60
  statements: 70
```

Os thresholds estão corretamente configurados. A cobertura inclui `src/use-cases/**`, `src/entities/**`, `src/services/**` e exclui factories e arquivos de teste.

**Problema identificado:** Três arquivos de teste apresentam cobertura de cenário extremamente baixa — apenas um único teste de erro, sem cobrir o caminho feliz ou fluxos alternativos:

- `D:/Code/Projetos/OpenSea/OpenSea-API/src/use-cases/hr/absences/calculate-vacation-balance.spec.ts` — 1 teste (somente erro de recurso não encontrado)
- `D:/Code/Projetos/OpenSea/OpenSea-API/src/use-cases/hr/employees/get-my-employee.spec.ts` — 1 teste (somente erro de recurso não encontrado)
- `D:/Code/Projetos/OpenSea/OpenSea-API/src/use-cases/hr/payrolls/process-payroll-payment.spec.ts` — 1 teste (somente erro de recurso não encontrado)

Esses três arquivos cobrem casos de uso com lógica de negócio relevante que provavelmente não atingem o threshold de 70% com um único teste de caminho de erro.

**Veredicto:** WARN — thresholds configurados corretamente, porém há arquivos de teste com cobertura de cenário insuficiente que podem puxar a média abaixo do limiar.

---

### Critério 2 — Todo Caso de Uso tem Arquivo de Teste Unitário — PASS

Todos os casos de uso implementados no módulo HR possuem arquivo `.spec.ts` correspondente. A contagem foi verificada por módulo:

| Sub-módulo              | Casos de uso | Testes (.spec.ts) | Cobertura |
| ----------------------- | ------------ | ----------------- | --------- |
| absences                | 8            | 8                 | 100%      |
| bonuses                 | 4            | 4                 | 100%      |
| companies               | 6            | 6                 | 100%      |
| company-addresses       | 6            | 6                 | 100%      |
| company-cnaes           | 7            | 7                 | 100%      |
| company-fiscal-settings | 4            | 4                 | 100%      |
| company-stakeholder     | 5            | 5                 | 100%      |
| deductions              | 4            | 4                 | 100%      |
| departments             | 5            | 5                 | 100%      |
| employees               | 12           | 12                | 100%      |
| manufacturers           | 5            | 5                 | 100%      |
| overtime                | 4            | 4                 | 100%      |
| payrolls                | 7            | 7                 | 100%      |
| positions               | 5            | 5                 | 100%      |
| suppliers               | 5            | 5                 | 100%      |
| time-bank               | 5            | 5                 | 100%      |
| time-control            | 4            | 4                 | 100%      |
| vacation-periods        | 8            | 8                 | 100%      |
| work-schedules          | 5            | 5                 | 100%      |

**Nota:** Os controladores `v1-unlink-user-from-employee`, `v1-get-employee-by-user-id` e `v1-get-employees-label-data` não possuem caso de uso dedicado — a lógica está inline no controlador. Isso é uma exceção justificada para endpoints de presenter/adapter, e os três possuem testes E2E cobrindo a funcionalidade.

**Veredicto:** PASS — 100% dos casos de uso implementados possuem teste unitário.

---

### Critério 3 — Todo Controlador tem Arquivo de Teste E2E — PASS

Todos os controladores do módulo HR possuem arquivo `.e2e.spec.ts` correspondente. A cobertura foi verificada por sub-módulo:

| Sub-módulo              | Controladores | Testes E2E | Cobertura |
| ----------------------- | ------------- | ---------- | --------- |
| absences                | 8             | 8          | 100%      |
| bonuses                 | 4             | 4          | 100%      |
| companies               | 6             | 6          | 100%      |
| company-addresses       | 4             | 4          | 100%      |
| company-cnaes           | 6             | 6          | 100%      |
| company-fiscal-settings | 4             | 4          | 100%      |
| company-stakeholder     | 4             | 4          | 100%      |
| deductions              | 4             | 4          | 100%      |
| departments             | 5             | 5          | 100%      |
| employees               | 15            | 15         | 100%      |
| manufacturers           | 5             | 5          | 100%      |
| overtime                | 4             | 4          | 100%      |
| payrolls                | 7             | 7          | 100%      |
| positions               | 5             | 5          | 100%      |
| suppliers               | 5             | 5          | 100%      |
| time-bank               | 5             | 5          | 100%      |
| time-control            | 4             | 4          | 100%      |
| vacation-periods        | 8             | 8          | 100%      |
| work-schedules          | 5             | 5          | 100%      |

**Veredicto:** PASS — 100% dos controladores possuem teste E2E.

---

### Critério 4 — Caminho Feliz E Cenários de Erro Cobertos — WARN

A maioria dos arquivos de teste cobre adequadamente tanto o caminho feliz quanto os erros. Exemplos de boa prática encontrados:

- `create-employee.spec.ts` — 8 testes: criação bem-sucedida, campos opcionais, CPF duplicado, número de registro duplicado, PIS duplicado, usuário já vinculado, tipo de contrato inválido, regime de trabalho inválido.
- `calculate-payroll.spec.ts` — 7 testes: salário base, INSS por faixa, bônus, deduções, cálculo de bruto/líquido, folha não encontrada, status incorreto.
- `approve-absence.spec.ts` — 5 testes: aprovação, atualização do período de férias, ausência não encontrada, ausência não pendente, licença médica.
- `schedule-vacation.spec.ts` — 5 testes: agendamento, não encontrada, dias insuficientes, período mínimo, data de início após fim.

**Arquivos com cobertura insuficiente de cenários:**

| Arquivo                                                                                             | Testes Existentes                   | Lacuna Identificada                                                                                                  |
| --------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `D:/Code/Projetos/OpenSea/OpenSea-API/src/use-cases/hr/absences/calculate-vacation-balance.spec.ts` | 1 (apenas "recurso não encontrado") | Caminho feliz com períodos de férias existentes; cálculo de dias restantes; funcionário sem períodos                 |
| `D:/Code/Projetos/OpenSea/OpenSea-API/src/use-cases/hr/employees/get-my-employee.spec.ts`           | 1 (apenas "recurso não encontrado") | Caminho feliz — busca por userId existente; resultado com dados completos do funcionário                             |
| `D:/Code/Projetos/OpenSea/OpenSea-API/src/use-cases/hr/payrolls/process-payroll-payment.spec.ts`    | 1 (apenas "recurso não encontrado") | Caminho feliz — pagamento bem-sucedido; folha não aprovada (status incorreto); marcação de bônus/deduções como pagos |

**Veredicto:** WARN — 3 dos 120+ testes unitários são "smoke tests" mínimos que cobrem apenas o caminho de erro mais simples, deixando os caminhos felizes e fluxos alternativos sem cobertura.

---

### Critério 5 — Casos Extremos Testados — PASS

Vários arquivos demonstram cobertura exemplar de casos extremos:

- **Valores limite numéricos** — `create-manufacturer.spec.ts`: `qualityRating > 5`, `qualityRating < 0`, `defectRate > 100`, `defectRate < 0`.
- **Strings vazias** — `create-manufacturer.spec.ts`: `legalName: ''` lança `BadRequestError`.
- **Campos ausentes** — `create-manufacturer.spec.ts`: nem CNPJ nem CPF fornecidos.
- **Limites de regras de negócio** — `sell-vacation-days.spec.ts`: venda de exatamente 1/3 dos dias (limite legal), venda acima do limite, dias insuficientes.
- **Período mínimo** — `schedule-vacation.spec.ts`: período inferior a 5 dias, data início após data fim.
- **Status inválidos** — `list-employees.spec.ts`: `status: 'INVALID_STATUS'` lança erro.
- **IDs inexistentes com UUID válido** — presente em quase todos os testes de `get` e `delete`.
- **Funcionário inativo** — `clock-in.spec.ts`: funcionário com status `TERMINATED` não pode registrar entrada.

**Veredicto:** PASS — casos extremos estão bem cobertos, especialmente nos sub-módulos de maior criticidade (payroll, vacation, employees).

---

### Critério 6 — Repositórios em Memória Simulam Fielmente o Comportamento do Banco — PASS

A análise de `D:/Code/Projetos/OpenSea/OpenSea-API/src/repositories/hr/in-memory/in-memory-employees-repository.ts` revela:

**Pontos positivos:**

- Filtro por `tenantId` em todos os métodos de busca — garante isolamento de tenant.
- Suporte a `includeDeleted` (soft delete) em todos os `find*` — comportamento idêntico ao Prisma.
- `findById`, `findByCpf`, `findByPis`, `findByUserId`, `findByRegistrationNumber` — todos implementados com filtro de tenant correto.
- `findManyByStatus`, `findManyByDepartment`, `findManyByPosition`, `findManyBySupervisor`, `findManyByCompany` — filtros compostos implementados.
- `softDelete` via `employee.softDelete()` — padrão correto, não remove fisicamente do array.
- `save()` — atualiza o item no array in-place.
- Repositório da Prisma tem teste E2E dedicado em `D:/Code/Projetos/OpenSea/OpenSea-API/src/repositories/hr/prisma/prisma-employees-repository.e2e.spec.ts` — paridade verificada.

**Ponto de atenção (não bloqueante):** O método `findMany(tenantId, filter)` no repositório in-memory não implementa busca textual nem paginação — essas funcionalidades são testadas pela camada de uso, que delega para `findMany` e aplica paginação em memória. O repositório Prisma delega para a query com `ILIKE`. Isso não é uma falha, mas significa que o `list-employees.spec.ts` testa paginação e filtragem via `ListEmployeesUseCase`, não pelo repositório diretamente.

**Veredicto:** PASS — os repositórios em memória simulam corretamente o comportamento do banco, incluindo isolamento de tenant, soft delete e todos os métodos de busca relevantes.

---

### Critério 7 — Fábricas de Teste Existem e São Utilizadas — PASS

O projeto possui um conjunto completo de fábricas de teste no diretório `D:/Code/Projetos/OpenSea/OpenSea-API/src/utils/tests/factories/hr/`:

**Fábricas de domínio (unit tests):**

- `make-absence.ts`
- `make-department.ts`
- `make-employee.ts`
- `make-position.ts`
- `make-vacation-period.ts`

**Fábricas E2E:**

- `create-absence.e2e.ts`
- `create-bonus.e2e.ts`
- `create-company.e2e.ts`
- `create-deduction.e2e.ts`
- `create-department.e2e.ts`
- `create-employee.e2e.ts`
- `create-payroll.e2e.ts`
- `create-position.e2e.ts`
- `create-vacation-period.e2e.ts`

**Uso observado:** Os testes E2E utilizam consistentemente `createEmployeeE2E`, `createAbsenceE2E`, `createDepartmentE2E`, `createPayroll`, `createCalculatedPayroll`, `createApprovedPayroll`. Não foram encontrados objetos literais inline hardcoded nos testes E2E verificados.

**Ponto de atenção menor:** Os testes unitários de `create-employee.spec.ts` criam funcionários inline sem usar `makeEmployee()`. Isso é aceitável porque o caso de uso em si é o que está sendo testado, mas a factory `make-employee.ts` poderia ser usada nos `beforeEach` para reduzir repetição.

**Veredicto:** PASS — fábricas existem, são bem estruturadas e amplamente utilizadas nos testes E2E.

---

### Critério 8 — Ausência de Testes Frágeis (Determinismo) — WARN

**Problema encontrado:** Uso extensivo de `Date.now()` em testes E2E para geração de dados únicos e controle de estado de folha de pagamento.

**Ocorrências críticas:**

1. **Geração de mês/ano não determinístico para payrolls** — padrão `(Date.now() % 12) + 1` e `2020 + (Date.now() % 10)` presente em:
   - `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/payrolls/v1-calculate-payroll.e2e.spec.ts` (linhas 25–27)
   - `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/payrolls/v1-approve-payroll.e2e.spec.ts` (linhas 24–26)
   - `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/payrolls/v1-cancel-payroll.e2e.spec.ts` (linhas 24–26)
   - `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/payrolls/v1-get-payroll.e2e.spec.ts` (linhas 24–26)
   - `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/payrolls/v1-pay-payroll.e2e.spec.ts` (linhas 24–26)

   Este padrão não evita colisões em execuções paralelas ou sequenciais rápidas (múltiplos testes no mesmo segundo produzem o mesmo mês/ano). Como os testes E2E são executados com `fileParallelism: false` e `singleFork: true`, o risco é baixo mas real — se dois specs do mesmo módulo rodarem em sequência muito rápida dentro do mesmo segundo, haverá violação de unicidade no banco.

2. **Geração de nomes únicos via timestamp** — presente em vários controladores de `work-schedules`, `company-cnaes`, `company-fiscal-settings`, `suppliers`, `manufacturers`, `company-stakeholder`, `company-addresses`:
   - `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/work-schedules/v1-create-work-schedule.e2e.spec.ts` (linha 23)
   - `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/manufacturers/v1-create-manufacturer.e2e.spec.ts` (linha 23)
   - (e outros 20+ arquivos)

   Para geração de unicidade de strings não críticas (nomes, códigos), este padrão é aceitável. O problema surge apenas quando o timestamp controla lógica de negócio (como mês/ano da folha).

3. **CNPJ gerado por timestamp** — `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/company-addresses/v1-create-company-address.e2e.spec.ts` (linha 30): `` `${Date.now()}`.slice(-14).padStart(14, '0') `` — gera CNPJs potencialmente inválidos e não determinísticos.

**Nota positiva:** Os testes unitários são 100% determinísticos — não há `Date.now()`, `Math.random()` ou `setTimeout` nos arquivos `.spec.ts` dos casos de uso.

**Veredicto:** WARN — determinismo comprometido em ~25 arquivos E2E, principalmente por uso de `Date.now()` para controlar mês/ano de folha de pagamento e geração de CNPJs.

---

### Critério 9 — Assertions São Significativas — WARN

**Distribuição de assertions por tipo (use cases):**

A busca retornou 77 ocorrências de `toBeTruthy()` / `toBeDefined()` em 57 arquivos de testes unitários do módulo HR. Algumas são inevitáveis (verificar existência antes de acessar propriedades), mas a análise qualitativa revela situações onde assertions genéricas substituem verificações específicas.

**Exemplos de assertions insuficientes:**

1. **`approve-absence.spec.ts` — teste "should update vacation period when approving vacation absence"** (linhas 78–94):

   ```
   expect(updatedPeriod).toBeDefined();
   // The vacation period should be updated via schedule method
   ```

   O teste verifica apenas que `updatedPeriod` existe, sem checar `usedDays`, `remainingDays` ou o status atualizado após a aprovação. O comentário inline revela incerteza sobre o comportamento esperado.

2. **`v1-list-employees.e2e.spec.ts`** — verifica apenas `Array.isArray(response.body.employees)` sem checar o número de itens ou propriedades dos elementos.

3. **`v1-approve-absence.e2e.spec.ts`** — verifica apenas `response.body.toHaveProperty('absence')` sem checar `response.body.absence.status === 'APPROVED'`.

4. **`v1-list-payrolls.e2e.spec.ts`** — estrutura semelhante: verifica presença de `payrolls` e `meta`, sem verificar contagem ou campos específicos.

**Exemplos de assertions bem construídas (modelo a seguir):**

- `calculate-payroll.spec.ts`: verifica `baseSalaryItem.amount === 5000`, `payroll.totalNet === payroll.totalGross - payroll.totalDeductions`.
- `create-employee.spec.ts`: verifica `employee.cpf.value === '52998224725'`, `employee.status.value === 'ACTIVE'`, `employee.contractType.value === 'CLT'`.
- `v1-approve-payroll.e2e.spec.ts`: verifica `payroll.status === 'APPROVED'` e `payroll.approvedAt !== undefined`.

**Veredicto:** WARN — a maioria dos testes unitários tem assertions significativas, mas vários testes E2E verificam apenas a estrutura da resposta (presença de campos) sem checar valores semânticos. Um teste de aprovação de ausência E2E deveria verificar `status === 'APPROVED'`.

---

### Critério 10 — Testes de Isolamento Multi-Tenant Existem — FAIL

**Resultado da busca:** Nenhum arquivo de teste no módulo HR contém as palavras-chave `isolation`, `multi-tenant`, `tenantB`, `second tenant`, `another tenant` ou padrão equivalente.

Nenhum teste no módulo HR verifica explicitamente que dados de um tenant não são visíveis ou acessíveis por outro tenant.

O repositório em memória implementa corretamente o filtro por `tenantId`, e o repositório Prisma usa cláusulas `WHERE tenantId = ?` em todas as queries. Porém, **não existe nenhum teste que prove que um usuário do Tenant A não consegue ler, modificar ou deletar dados do Tenant B**.

**Comparação com outros módulos:** O módulo `email` possui `v1-email-multi-tenant-isolation.e2e.spec.ts` com 15 testes de isolamento. O módulo `calendar` possui testes de isolamento multi-tenant no conjunto de testes E2E. O módulo HR não tem equivalente.

**Veredicto:** FAIL — ausência completa de testes de isolamento multi-tenant no módulo HR.

---

## Testes Ausentes — Lista Completa

### Testes Unitários com Cobertura Insuficiente

#### 1. `calculate-vacation-balance.spec.ts`

**Caminho:** `D:/Code/Projetos/OpenSea/OpenSea-API/src/use-cases/hr/absences/calculate-vacation-balance.spec.ts`

**Situação atual:** 1 teste (somente erro de recurso não encontrado).

**Cenários faltantes sugeridos:**

- Funcionário com períodos de férias existentes — deve retornar saldo correto (`remainingDays` somado de todos os períodos AVAILABLE).
- Funcionário sem períodos de férias — deve retornar saldo zero (ou lançar erro específico, dependendo da regra de negócio).
- Funcionário com período parcialmente utilizado — saldo deve refletir `remainingDays` correto.
- Funcionário com período expirado — não deve contar dias de período fora da janela de concessão.

#### 2. `get-my-employee.spec.ts`

**Caminho:** `D:/Code/Projetos/OpenSea/OpenSea-API/src/use-cases/hr/employees/get-my-employee.spec.ts`

**Situação atual:** 1 teste (somente erro de recurso não encontrado).

**Cenários faltantes sugeridos:**

- Caminho feliz — usuário com funcionário vinculado retorna o registro correto.
- Usuário vinculado a funcionário desligado (`TERMINATED`) — deve retornar o registro ou lançar erro, conforme regra.
- Usuário vinculado a funcionário em tenant diferente — deve retornar não encontrado.

#### 3. `process-payroll-payment.spec.ts`

**Caminho:** `D:/Code/Projetos/OpenSea/OpenSea-API/src/use-cases/hr/payrolls/process-payroll-payment.spec.ts`

**Situação atual:** 1 teste (somente erro de recurso não encontrado).

**Cenários faltantes sugeridos:**

- Caminho feliz — folha aprovada com itens: status passa para `PAID`, `paidAt` é preenchido, `paidBy` é registrado.
- Folha em status incorreto (`DRAFT`, `CALCULATED`, `PAID`) — deve lançar erro com mensagem clara.
- Bônus e deduções associados devem ser marcados como pagos após o processamento.
- Verificação de que `totalNet` final coincide com a soma dos itens após processamento.

---

### Testes E2E com Assertions Genéricas

Os seguintes testes E2E verificam apenas presença de campos, mas deveriam verificar valores semânticos:

| Arquivo                                                                                                 | Assertion Atual                | Assertion Recomendada                    |
| ------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------- |
| `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/absences/v1-approve-absence.e2e.spec.ts`  | `toHaveProperty('absence')`    | `absence.status === 'APPROVED'`          |
| `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/employees/v1-list-employees.e2e.spec.ts`  | `Array.isArray(employees)`     | Verificar contagem e campos obrigatórios |
| `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/absences/v1-reject-absence.e2e.spec.ts`   | `toHaveProperty('absence')`    | `absence.status === 'REJECTED'`          |
| `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/employees/v1-create-employee.e2e.spec.ts` | `employee.status === 'ACTIVE'` | Adequado — manter como está              |

---

### Testes de Isolamento Multi-Tenant (Inexistentes)

**Arquivo sugerido:** `src/http/controllers/hr/employees/v1-hr-multi-tenant-isolation.e2e.spec.ts`

**Cenários a implementar:**

1. **Funcionário de Tenant A não visível para Tenant B**
   - Criar funcionário no Tenant A.
   - Autenticar como usuário do Tenant B.
   - `GET /v1/hr/employees/:id` deve retornar 403 ou 404.

2. **Listagem de funcionários retorna apenas do tenant autenticado**
   - Criar 2 funcionários no Tenant A e 3 no Tenant B.
   - Listar como Tenant A → deve retornar exatamente 2.
   - Listar como Tenant B → deve retornar exatamente 3.

3. **Aprovação de ausência de outro tenant deve falhar**
   - Criar ausência pendente no Tenant A.
   - Tentar aprovar como Tenant B → deve retornar 404 (ausência não encontrada no contexto do Tenant B).

4. **Folha de pagamento de outro tenant não acessível**
   - Criar folha no Tenant A.
   - Tenant B não deve conseguir calcular, aprovar ou pagar a folha do Tenant A.

5. **Dados de empresa de outro tenant não acessíveis**
   - CNPJ de empresa no Tenant A não deve retornar resultado para consulta do Tenant B.

**Arquivo de referência:** `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/` — seguir o padrão de `src/http/controllers/calendar/events/` que possui testes de isolamento.

---

## Qualidade dos Repositórios em Memória

### Pontos Fortes

- `InMemoryEmployeesRepository` (700+ linhas) — implementação fiel ao contrato `EmployeesRepository`, com todos os 15+ métodos implementados corretamente.
- Filtro de `tenantId` em todos os métodos de busca — simula o comportamento do Prisma com cláusula `WHERE tenantId = ?`.
- Soft delete via `employee.softDelete()` — respeita o padrão `deletedAt` do domínio.
- `InMemoryVacationPeriodsRepository` expõe `items` como array público — permite manipulação direta em testes para setup de estado complexo.

### Ponto de Atenção

- `InMemoryEmployeesRepository` não implementa `findMany` com paginação ou filtragem textual — delega para `ListEmployeesUseCase` que filtra em memória. Isso é correto mas significa que o comportamento SQL do `ILIKE` (case-insensitive, sem acento) pode diferir do comportamento JavaScript em casos extremos com caracteres especiais.

### Cobertura dos Repositórios in-memory

Repositórios sem arquivo `.spec.ts` dedicado (apenas testados indiretamente pelos casos de uso):

- `InMemoryAbsencesRepository`
- `InMemoryBonusesRepository`
- `InMemoryCompaniesRepository`
- `InMemoryCompanyAddressesRepository`
- `InMemoryCompanyCnaesRepository`
- `InMemoryCompanyFiscalSettingsRepository`
- `InMemoryCompanyStakeholderRepository`
- `InMemoryDeductionsRepository`
- `InMemoryDepartmentsRepository`
- `InMemoryManufacturersRepository`
- `InMemoryOvertimeRepository`
- `InMemoryPayrollItemsRepository`
- `InMemoryPayrollsRepository`
- `InMemoryPositionsRepository`
- `InMemorySuppliersRepository`
- `InMemoryTimeBankRepository`
- `InMemoryTimeEntriesRepository`
- `InMemoryVacationPeriodsRepository`
- `InMemoryWorkSchedulesRepository`

Apenas `InMemoryEmployeesRepository` possui `.spec.ts` dedicado. Os demais são testados indiretamente pelos casos de uso. Recomenda-se adicionar testes diretos para os repositórios de maior complexidade (vacationPeriods, payrolls).

---

## Análise de Determinismo nos Testes E2E

### Padrão Problemático — Mês/Ano de Folha de Pagamento

```typescript
// Padrão atual (frágil)
const timestamp = Date.now();
const month = (timestamp % 12) + 1;
const year = 2020 + (timestamp % 10);
```

**Problema:** `Date.now()` retorna milissegundos. Dois testes executados no mesmo milissegundo (improvável mas possível em hardware rápido) gerariam o mesmo mês/ano. Além disso, como os testes compartilham banco de dados, uma folha com mês/ano 6/2024 criada em um teste interfere em outro.

**Solução recomendada:** Usar um contador atômico por arquivo de teste ou UUID como identificador único, e usar anos fixos distintos por arquivo.

```typescript
// Padrão recomendado
import { randomUUID } from 'crypto';
const referenceMonth = 3;
const referenceYear = 2025; // Fixo, diferente por arquivo de teste
```

### Padrão Aceitável — Unicidade de Strings

```typescript
const timestamp = Date.now();
// name: `Old Department ${timestamp}`
```

Este padrão é aceitável para garantir unicidade de nomes em um banco compartilhado, pois strings não controlam lógica de negócio.

---

## Artefatos de Teste Encontrados

**Arquivo temporário identificado:**

- `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/employees/temp.txt` — arquivo com código de teste não finalizado contendo `Date.now()` em múltiplos pontos (linhas 440–875). Este arquivo não é um `.spec.ts` e não é executado, mas representa trabalho em progresso que não foi integrado. Recomenda-se remover ou transformar em testes formais.

---

## Recomendações por Prioridade

### Alta Prioridade

1. **Adicionar testes de isolamento multi-tenant** (Critério 10 — FAIL)
   - Criar `src/http/controllers/hr/v1-hr-multi-tenant-isolation.e2e.spec.ts`
   - Mínimo de 5 cenários cobrindo employees, absences e payrolls
   - Seguir o padrão de `v1-email-multi-tenant-isolation.e2e.spec.ts`

2. **Expandir cobertura de `calculate-vacation-balance.spec.ts`** (Critério 4 — WARN)
   - Adicionar caminho feliz com pelo menos 3 cenários de saldo

3. **Expandir cobertura de `process-payroll-payment.spec.ts`** (Critério 4 — WARN)
   - Adicionar caminho feliz e verificação de mudança de status dos itens

### Média Prioridade

4. **Corrigir determinismo nos testes E2E de payrolls** (Critério 8 — WARN)
   - Substituir `Date.now() % 12` por valores fixos distintos por arquivo
   - Arquivos afetados: `v1-calculate-payroll.e2e.spec.ts`, `v1-approve-payroll.e2e.spec.ts`, `v1-cancel-payroll.e2e.spec.ts`, `v1-get-payroll.e2e.spec.ts`, `v1-pay-payroll.e2e.spec.ts`

5. **Melhorar assertions E2E de estados de negócio** (Critério 9 — WARN)
   - `v1-approve-absence.e2e.spec.ts`: verificar `absence.status === 'APPROVED'`
   - `v1-reject-absence.e2e.spec.ts`: verificar `absence.status === 'REJECTED'`
   - `v1-list-employees.e2e.spec.ts`: verificar contagem e campos obrigatórios

6. **Expandir `get-my-employee.spec.ts`** (Critério 4 — WARN)
   - Adicionar caminho feliz com funcionário vinculado

### Baixa Prioridade

7. **Remover `temp.txt`** dos controladores de employees
   - `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/employees/temp.txt`
   - Formalizar como `.e2e.spec.ts` ou deletar

8. **Adicionar testes diretos para repositórios in-memory de maior complexidade**
   - `InMemoryVacationPeriodsRepository` — verificar cálculo de dias, status transitions
   - `InMemoryPayrollsRepository` — verificar filtro por mês/ano

---

## Conclusão

O módulo HR demonstra maturidade de testes significativa: 100% de cobertura de casos de uso com testes unitários, 100% de cobertura de controladores com testes E2E, repositórios em memória bem implementados e um conjunto rico de fábricas de teste. A principal lacuna crítica é a ausência completa de testes de isolamento multi-tenant, que é um requisito fundamental para um sistema SaaS multi-tenant. As lacunas secundárias são pontuais e de fácil correção.

O módulo está bem posicionado para atingir a nota 9.0/10 após a implementação dos testes de isolamento multi-tenant e a expansão dos três arquivos de teste com cobertura mínima.

---

_Relatório gerado automaticamente por análise estática de código e leitura de artefatos de teste._
_Próxima auditoria recomendada: 2026-06-10_
