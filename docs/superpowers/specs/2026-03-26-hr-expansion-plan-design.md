# OpenSea HR — Plano de Expansão para Liderança de Mercado

**Data:** 2026-03-26
**Objetivo:** Elevar score de 137/200 (69%) para 182/200 (91%) — ultrapassar TOTVS e Senior
**Benchmark:** Comparação com TOTVS Protheus, Senior HCM, Convenia, Gupy, Factorial, BambooHR, Deel

---

## Sequência de Implementação

| Fase | Foco        | Subsistemas                                              | Impacto Score |
| ---- | ----------- | -------------------------------------------------------- | ------------- |
| 1    | Operacional | Admissão Digital, Benefícios, Portal do Colaborador      | +16 pts       |
| 2    | Compliance  | FGTS Digital/DCTFWeb/REINF, Folha Avançada, CLT Avançado | +6 pts        |
| 3    | Benchmark   | R&S Integrado, Avaliação de Desempenho                   | +17 pts       |
| 4    | Talent      | Gestão de Treinamentos, People Analytics                 | +6 pts        |

---

## Reestruturação de Rotas

### Antes

```
src/app/
  (auth)/          → Login, registro, select-tenant
  (dashboard)/     → App principal (autenticado)
  (central)/       → Super admin
  punch/           → PWA de ponto (raiz)
```

### Depois

```
src/app/
  (auth)/          → Login, registro, select-tenant
  (dashboard)/     → App principal (autenticado, tenant-scoped)
    punch/         → Ponto do funcionário logado (modo autenticado)
  (central)/       → Super admin
  (public)/        → Páginas públicas (sem auth, layout limpo)
    punch/         → Ponto modo kiosk (tablet na empresa, sem login individual)
    careers/       → Vagas públicas
    admission/     → Formulário de admissão digital
    documents/     → Assinatura de documentos
```

### Layout `(public)`

- Sem navbar, sem sidebar
- Layout limpo com branding do tenant (logo, cores)
- Responsivo mobile-first
- Sem necessidade de autenticação
- Tenant identificado por slug na URL ou token no link

---

## FASE 1 — OPERACIONAL

### 1A. Admissão Digital (3→9)

#### Visão Geral

Três fluxos de admissão coexistentes. A empresa escolhe qual usar por contratação.

#### Fluxo 1: Self-Service (candidato faz tudo)

1. RH cria convite de admissão no sistema (cargo, departamento, data início)
2. Sistema gera link único com token temporário (validade configurável: 7-30 dias)
3. Candidato acessa `(public)/admission/[token]`
4. Wizard multi-step:
   - **Dados pessoais:** nome, CPF, RG, data nascimento, estado civil, endereço
   - **Documentos:** upload de fotos/PDFs (RG, CPF, CTPS, comprovante de residência, foto 3x4, certidão casamento/nascimento filhos)
   - **Dados bancários:** banco, agência, conta
   - **Dependentes:** nome, CPF, parentesco, data nascimento
   - **Revisão:** todos os dados preenchidos para conferência
   - **Assinatura digital:** aceite do contrato de trabalho
5. RH recebe notificação → revisa dados e documentos → aprova ou solicita correções
6. Ao aprovar: Employee criado automaticamente + eSocial S-2190 gerado + benefícios vinculados + escala atribuída

#### Fluxo 2: Híbrido (candidato + RH)

1. RH envia convite por email ou WhatsApp com link `(public)/admission/[token]`
2. Candidato preenche formulário simplificado (dados pessoais + docs)
3. RH complementa no sistema (cargo, salário, benefícios, dados contratuais)
4. Contrato gerado → candidato assina via link
5. Aprovação e criação automática

#### Fluxo 3: Manual (RH faz tudo)

1. RH preenche todos os dados no sistema (fluxo que já existe hoje)
2. Checklist de documentos com status (pendente/recebido/validado)
3. Upload de documentos pelo RH
4. Criação do funcionário manualmente

#### Assinatura Eletrônica Interna

- PIN do usuário (o mesmo usado para ações destrutivas)
- Checkbox de aceite com texto legal completo
- Registro automático: IP do assinante, timestamp UTC, user-agent do navegador
- Hash SHA-256 do documento assinado
- Armazenado no módulo Storage como documento imutável
- Validade jurídica: aceite digital com log completo (suficiente para a maioria dos contratos CLT)

#### Modelos de Dados (Backend)

```
AdmissionInvite:
  id, tenantId, token, email, phone, fullName, positionId, departmentId
  expectedStartDate, salary, contractType, workRegime
  status: PENDING | IN_PROGRESS | COMPLETED | EXPIRED | CANCELLED
  expiresAt, completedAt, employeeId (gerado ao concluir)
  createdBy, createdAt, updatedAt

AdmissionDocument:
  id, admissionInviteId, tenantId
  type: RG | CPF | CTPS | PROOF_ADDRESS | PHOTO | BIRTH_CERT | MARRIAGE_CERT | OTHER
  fileName, fileUrl, status: PENDING | UPLOADED | VALIDATED | REJECTED
  rejectionReason, validatedBy, validatedAt

DigitalSignature:
  id, tenantId, documentId, signerId
  signerName, signerCpf, signerEmail
  signedAt, ipAddress, userAgent
  documentHash, pinVerified: boolean
  signatureType: ADMISSION_CONTRACT | DOCUMENT_ACKNOWLEDGMENT | POLICY_ACCEPTANCE
```

#### Endpoints (API)

```
POST   /v1/hr/admissions                    → Criar convite de admissão
GET    /v1/hr/admissions                    → Listar convites (paginado, filtros)
GET    /v1/hr/admissions/:id               → Detalhes do convite
PUT    /v1/hr/admissions/:id               → Atualizar convite
DELETE /v1/hr/admissions/:id               → Cancelar convite
POST   /v1/hr/admissions/:id/approve       → Aprovar e criar funcionário
POST   /v1/hr/admissions/:id/reject        → Rejeitar com motivo
POST   /v1/hr/admissions/:id/resend        → Reenviar convite (email/WhatsApp)

# Rotas públicas (sem auth, validação por token)
GET    /v1/public/admission/:token         → Dados do convite para o candidato
POST   /v1/public/admission/:token/submit  → Enviar dados preenchidos
POST   /v1/public/admission/:token/upload  → Upload de documento
POST   /v1/public/admission/:token/sign    → Assinatura digital
```

#### Páginas (Frontend)

```
(dashboard)/hr/(entities)/admissions/page.tsx              → Listagem de convites
(dashboard)/hr/(entities)/admissions/[id]/page.tsx         → Detalhe (revisar dados do candidato)
(dashboard)/hr/(entities)/admissions/[id]/edit/page.tsx    → Editar convite
(public)/admission/[token]/page.tsx                        → Wizard do candidato (multi-step)
(public)/admission/[token]/success/page.tsx                → Confirmação de envio
```

---

### 1B. Gestão de Benefícios (3→9)

#### Visão Geral

Dois modelos simultâneos: benefícios fixos/tipados + benefícios flexíveis (flex).

#### Benefícios Fixos (Tipados)

Cada tipo tem regras de cálculo específicas:

| Tipo                      | Regras de Cálculo                                                           |
| ------------------------- | --------------------------------------------------------------------------- |
| **VT (Vale Transporte)**  | Desconto de 6% do salário base, empresa cobre o excedente                   |
| **VR (Vale Refeição)**    | Valor fixo por dia útil trabalhado                                          |
| **VA (Vale Alimentação)** | Valor fixo mensal                                                           |
| **Plano Saúde**           | Faixas etárias da ANS, coparticipação configurável, titulares + dependentes |
| **Plano Dental**          | Valor fixo, titulares + dependentes                                         |
| **Seguro Vida**           | Valor por faixa salarial ou fixo                                            |
| **Auxílio Creche**        | Valor fixo para filhos até 5 anos e 11 meses                                |
| **PLR**                   | Percentual do salário ou valor fixo, periodicidade configurável             |
| **Consignado**            | Parcelas fixas, limite de 35% da margem consignável                         |
| **Auxílio Educação**      | Valor fixo ou % do custo, com comprovação                                   |
| **Auxílio Home Office**   | Valor fixo mensal para teletrabalho                                         |

#### Benefícios Flexíveis (Flex)

1. Empresa define saldo mensal por política (por cargo, departamento, ou individual)
2. Categorias configuráveis: Alimentação, Saúde, Educação, Cultura, Mobilidade, Bem-estar
3. Funcionário distribui saldo entre categorias pelo Portal do Colaborador
4. Redistribuição permitida até dia X do mês (configurável)
5. Saldo não utilizado: configurável (acumula, perde, ou converte)

#### Integração com Folha

- Descontos automáticos calculados e lançados como itens da folha
- VT: 6% do salário base (limitado ao valor do benefício)
- Plano Saúde: coparticipação deduzida
- Consignado: parcelas deduzidas com controle de margem
- Benefícios flex: sem desconto (empresa paga integralmente) ou com coparticipação configurável

#### Modelos de Dados

```
BenefitPlan:
  id, tenantId, name, type (VT|VR|VA|HEALTH|DENTAL|LIFE_INSURANCE|DAYCARE|PLR|LOAN|EDUCATION|HOME_OFFICE|FLEX)
  provider, policyNumber, isActive
  rules: JSON (regras específicas por tipo)
  createdAt, updatedAt

BenefitEnrollment:
  id, tenantId, employeeId, benefitPlanId
  startDate, endDate, status: ACTIVE | SUSPENDED | CANCELLED
  employeeContribution, employerContribution
  dependantIds: string[] (para planos que cobrem dependentes)
  createdAt, updatedAt

FlexBenefitAllocation:
  id, tenantId, employeeId, month, year
  totalBudget, allocations: JSON { category: amount }
  status: DRAFT | CONFIRMED | LOCKED
  confirmedAt, createdAt

BenefitDeduction:
  id, tenantId, employeeId, benefitPlanId, payrollId
  amount, type: EMPLOYEE_SHARE | COPARTICIPATION | INSTALLMENT
  referenceMonth, referenceYear
```

#### Endpoints

```
# Planos
POST   /v1/hr/benefit-plans                        → Criar plano
GET    /v1/hr/benefit-plans                        → Listar planos
GET    /v1/hr/benefit-plans/:id                    → Detalhes do plano
PUT    /v1/hr/benefit-plans/:id                    → Atualizar plano
DELETE /v1/hr/benefit-plans/:id                    → Desativar plano

# Inscrições
POST   /v1/hr/benefit-enrollments                  → Inscrever funcionário
GET    /v1/hr/benefit-enrollments                  → Listar inscrições (filtros)
PUT    /v1/hr/benefit-enrollments/:id              → Atualizar inscrição
DELETE /v1/hr/benefit-enrollments/:id              → Cancelar inscrição
POST   /v1/hr/benefit-enrollments/bulk             → Inscrição em lote

# Flex
GET    /v1/hr/flex-benefits/my-allocation          → Minha alocação do mês
POST   /v1/hr/flex-benefits/allocate               → Distribuir saldo flex
GET    /v1/hr/flex-benefits/history                → Histórico de alocações

# Deduções (integração folha)
GET    /v1/hr/benefit-deductions                   → Deduções do mês para folha
POST   /v1/hr/benefit-deductions/calculate         → Calcular deduções do mês
```

#### Páginas

```
(dashboard)/hr/(entities)/benefits/page.tsx                → Listagem de planos
(dashboard)/hr/(entities)/benefits/[id]/page.tsx           → Detalhe do plano + inscritos
(dashboard)/hr/(entities)/benefits/[id]/edit/page.tsx      → Editar plano
(dashboard)/hr/(entities)/benefits/enrollments/page.tsx    → Gestão de inscrições
```

---

### 1C. Portal do Colaborador (5→9)

#### Visão Geral

Integrado ao perfil do usuário. Quando `user.employeeId` existe, o `/profile` expande com seções HR.

#### Detecção Automática

```typescript
// No profile page
const { user } = useAuth();
const isEmployee = !!user?.employeeId;
// Se isEmployee, renderizar tabs/seções HR adicionais
```

#### Seções do Portal

**Informativo (read-only):**

- Meus dados pessoais (com botão "Solicitar alteração")
- Holerites (download PDF por mês)
- Informe de rendimentos anual
- CTPS digital (dados do contrato)
- Benefícios ativos (planos, valores, dependentes cobertos)
- Férias: saldo disponível, períodos aquisitivos, histórico
- Banco de horas: saldo atual, extrato

**Transacional (ações com workflow):**

- Solicitar férias → gestor aprova/rejeita
- Registrar ausência (atestado médico com upload) → gestor aprova
- Solicitar adiantamento salarial → RH aprova
- Atualizar dados bancários → RH valida
- Atualizar endereço/contato → atualização direta ou com aprovação
- Assinar documentos pendentes
- Abrir chamado para RH (categoria + descrição + anexos)

**Social:**

- Mural de comunicados da empresa (RH publica, todos veem)
- Aniversariantes do mês (lista com foto e departamento)
- Kudos / reconhecimentos (qualquer funcionário pode enviar para outro)
- Pesquisa de clima (quando ativa, aparece como card destacado)
- Onboarding gamificado: checklist interativo para novos funcionários (conhecer a empresa, completar docs, fazer treinamentos obrigatórios)

#### Modelos de Dados

```
EmployeeRequest:
  id, tenantId, employeeId, type: VACATION | ABSENCE | ADVANCE | DATA_CHANGE | SUPPORT
  status: PENDING | APPROVED | REJECTED | CANCELLED
  data: JSON (dados específicos por tipo)
  approverEmployeeId, approvedAt, rejectionReason
  createdAt, updatedAt

CompanyAnnouncement:
  id, tenantId, title, content, priority: NORMAL | IMPORTANT | URGENT
  publishedAt, expiresAt, authorEmployeeId
  targetDepartmentIds: string[] (vazio = todos)
  isActive, createdAt

EmployeeKudos:
  id, tenantId, fromEmployeeId, toEmployeeId
  message, category: TEAMWORK | INNOVATION | LEADERSHIP | EXCELLENCE | HELPFULNESS
  isPublic: boolean
  createdAt

OnboardingChecklist:
  id, tenantId, employeeId
  items: JSON [{ id, title, description, completed, completedAt }]
  progress: number (0-100)
  createdAt, updatedAt
```

#### Endpoints

```
# Solicitações do funcionário
POST   /v1/hr/my/requests                    → Criar solicitação
GET    /v1/hr/my/requests                    → Minhas solicitações
GET    /v1/hr/my/requests/:id               → Detalhe da solicitação

# Comunicados
GET    /v1/hr/announcements                  → Listar comunicados ativos
POST   /v1/hr/announcements                  → Criar comunicado (RH)
PUT    /v1/hr/announcements/:id             → Editar comunicado
DELETE /v1/hr/announcements/:id             → Remover comunicado

# Kudos
POST   /v1/hr/kudos                          → Enviar kudos
GET    /v1/hr/kudos/received                 → Kudos recebidos
GET    /v1/hr/kudos/sent                     → Kudos enviados
GET    /v1/hr/kudos/feed                     → Feed público de kudos

# Onboarding
GET    /v1/hr/my/onboarding                  → Meu checklist
POST   /v1/hr/my/onboarding/:itemId/complete → Marcar item como concluído
```

---

## FASE 2 — COMPLIANCE

### 2A. FGTS Digital + DCTFWeb + REINF (8→10)

#### Workflow Unificado

Mesmo padrão do eSocial existente:

```
DRAFT → REVIEWED → APPROVED → [Transmitir automaticamente | Exportar para contador]
```

O contador pode ser designado como aprovador no workflow. Ao aprovar, ele escolhe: transmitir pelo sistema ou exportar arquivo para transmitir pelo eCAC.

#### FGTS Digital

- Geração mensal da guia FGTS individualizada por funcionário
- Cálculo: 8% do salário bruto (incluindo 13º, férias, aviso prévio indenizado)
- Multa rescisória: 40% do saldo FGTS na demissão sem justa causa
- Integração com a API do FGTS Digital do governo
- Dashboard: valores devidos, guias geradas, transmissões, pendências

#### DCTFWeb

- Geração automática a partir dos dados já calculados no eSocial (S-1200, S-1210, S-1299)
- Conferência de valores: INSS patronal, RAT, FAP, terceiros
- Transmissão via web service ou exportação XML

#### EFD-REINF

- Eventos R-1000 a R-4099 (retenções sobre serviços)
- Integração com módulo Finance (notas fiscais de serviços tomados)
- Cálculo automático de retenções: IRRF, CSLL, PIS/COFINS
- Transmissão no mesmo workflow do eSocial

#### Modelos de Dados

```
FiscalObligation:
  id, tenantId, type: FGTS_DIGITAL | DCTWEB | REINF
  referenceMonth, referenceYear
  status: DRAFT | REVIEWED | APPROVED | TRANSMITTED | EXPORTED | ERROR
  xmlContent, signedXml, responseXml
  transmittedAt, protocol
  approverType: SYSTEM | ACCOUNTANT | HR_MANAGER
  approverUserId, approvedAt
  exportedAt, exportFormat: XML | PDF
  createdAt, updatedAt
```

### 2B. Folha de Pagamento Avançada (8→10)

#### Motor de Regras de CCT

```
CollectiveAgreement:
  id, tenantId, name, sindicateCode, sindicateName
  validFrom, validUntil, status: ACTIVE | EXPIRED | DRAFT
  sourceType: MANUAL | AI_EXTRACTED | TEMPLATE
  sourceDocumentUrl (PDF original)
  createdAt, updatedAt

CollectiveAgreementRule:
  id, agreementId, tenantId
  ruleType: MINIMUM_WAGE | OVERTIME_RATE | NIGHT_SHIFT_RATE | MANDATORY_BENEFIT | WORK_HOURS | OTHER
  description, value: JSON (estrutura varia por tipo)
  appliesToPositions: string[] (vazio = todos)
  appliesToDepartments: string[] (vazio = todos)
  isActive, createdAt
```

#### Diferencial: Atlas busca e configura CCT

1. RH digita "Sindicato do Comércio de São Paulo 2025"
2. Atlas busca na web (Google, sites de sindicatos, MTE)
3. Encontra o documento da CCT
4. Extrai cláusulas relevantes via AI: piso salarial, adicionais, jornada, benefícios obrigatórios
5. Sugere regras no formato `CollectiveAgreementRule`
6. RH revisa, ajusta se necessário, e ativa
7. Regras aplicadas automaticamente nos cálculos de folha

#### Cálculos Avançados

- Múltiplas jornadas (funcionário com 2 contratos)
- Escala 12x36 (cálculo correto de horas, DSR, feriados)
- Intermitente (convocação, aceite, pagamento proporcional)
- Banco de horas com regras de CCT (compensação em 6 meses vs 12 meses)
- Férias em dobro (vencidas, cálculo automático)
- Insalubridade sobre salário mínimo vs base (conforme CCT/Súmula)

### 2C. Compliance CLT Avançado (8→10)

#### Jornadas Especiais

- 12x36 com cálculo correto (CLT Art. 59-A)
- Escala 6x1, 5x2, 4x3
- Teletrabalho/home office (controle por tarefa vs jornada)
- Jornada parcial (até 30h sem HE, até 26h com 6h HE)

#### Estabilidades Provisórias

- Gestante: da confirmação até 5 meses após parto (ADCT Art. 10)
- Acidente de trabalho: 12 meses após cessação do auxílio-doença (CLT Art. 118)
- CIPA: do registro até 1 ano após mandato (já implementado)
- Dirigente sindical: do registro até 1 ano após mandato
- Membro da comissão de conciliação: até 1 ano após mandato
- Bloqueio automático de rescisão quando estabilidade ativa

#### Contratos Especiais

- Aprendiz: limite de 2 anos, jornada máxima 6h (Art. 428-433)
- Estagiário: Lei 11.788 (bolsa, auxílio transporte, seguro, supervisor)
- Temporário: Lei 6.019 (180 dias + 90 dias prorrogáveis)
- Intermitente: convocação com 3 dias de antecedência, aceite em 1 dia

---

## FASE 3 — BENCHMARK

### 3A. Recrutamento & Seleção Integrado (0→9)

#### Pipeline de Vagas

```
Requisição → Aprovação → Publicação → Triagem → Entrevistas → Testes → Proposta → Contratação
```

#### Modelos de Dados

```
JobOpening:
  id, tenantId, title, description, requirements
  positionId, departmentId, companyId
  type: FULL_TIME | PART_TIME | INTERNSHIP | TEMPORARY | APPRENTICE
  workModel: ON_SITE | REMOTE | HYBRID
  salaryRange: { min, max, currency, showInPosting }
  benefits: string[]
  status: DRAFT | PENDING_APPROVAL | OPEN | CLOSED | CANCELLED
  publishedAt, closedAt, closingReason
  hiringManagerId, recruiterEmployeeId
  maxCandidates, currentCandidates
  slug (para URL pública)
  createdAt, updatedAt

Candidate:
  id, tenantId, fullName, email, phone, cpf
  resumeUrl, linkedinUrl, portfolioUrl
  source: CAREERS_PAGE | LINKEDIN | INDEED | REFERRAL | MANUAL | OTHER
  referredByEmployeeId
  tags: string[]
  createdAt, updatedAt

Application:
  id, tenantId, candidateId, jobOpeningId
  stage: APPLIED | SCREENING | INTERVIEW | TESTING | PROPOSAL | HIRED | REJECTED | WITHDRAWN
  stageHistory: JSON [{ stage, enteredAt, exitedAt, notes }]
  score: number (0-100, AI scoring)
  interviewSchedule: JSON [{ date, type, interviewerIds, notes, rating }]
  testResults: JSON [{ testName, score, maxScore }]
  proposalData: JSON { salary, benefits, startDate }
  rejectionReason, rejectedAt
  hiredAt, employeeId (gerado ao contratar)
  createdAt, updatedAt
```

#### Fluxo de Contratação Integrada

1. Candidato aprovado na etapa final
2. RH clica "Contratar" → formulário de proposta (salário, cargo, data início)
3. Candidato aceita proposta
4. Sistema inicia Admissão Digital automaticamente:
   - Dados do candidato pré-preenchidos (nome, email, CPF, telefone)
   - AdmissionInvite criado com link enviado ao candidato
   - Posição, departamento, salário já definidos
5. Ao concluir admissão: Employee + eSocial S-2190 + benefícios
6. **Fallback manual:** RH pode ignorar o pipeline e cadastrar funcionário diretamente (fluxo existente preservado)

#### Página Pública de Carreiras

```
(public)/careers/[tenantSlug]/page.tsx           → Lista de vagas abertas
(public)/careers/[tenantSlug]/[jobSlug]/page.tsx → Detalhes + formulário de candidatura
```

- Layout limpo com branding do tenant (logo, cores, descrição da empresa)
- Filtros: área, tipo de contrato, modelo de trabalho, localidade
- SEO: meta tags, Open Graph, schema.org/JobPosting
- Mobile-first

#### Endpoints

```
# Vagas (autenticado)
POST   /v1/hr/job-openings                       → Criar vaga
GET    /v1/hr/job-openings                       → Listar vagas
GET    /v1/hr/job-openings/:id                   → Detalhes
PUT    /v1/hr/job-openings/:id                   → Editar
DELETE /v1/hr/job-openings/:id                   → Cancelar
POST   /v1/hr/job-openings/:id/publish           → Publicar
POST   /v1/hr/job-openings/:id/close             → Fechar vaga

# Candidatos
POST   /v1/hr/candidates                          → Cadastrar candidato manual
GET    /v1/hr/candidates                          → Listar candidatos (pool)
GET    /v1/hr/candidates/:id                     → Detalhes do candidato

# Candidaturas
GET    /v1/hr/applications                        → Listar (filtro por vaga, etapa)
GET    /v1/hr/applications/:id                   → Detalhes
PUT    /v1/hr/applications/:id/stage             → Mover de etapa
POST   /v1/hr/applications/:id/score             → Avaliar candidato
POST   /v1/hr/applications/:id/hire              → Contratar → inicia Admissão Digital
POST   /v1/hr/applications/:id/reject            → Rejeitar

# Público (sem auth)
GET    /v1/public/careers/:tenantSlug            → Vagas abertas do tenant
GET    /v1/public/careers/:tenantSlug/:jobSlug   → Detalhes da vaga
POST   /v1/public/careers/:tenantSlug/:jobSlug/apply → Candidatura
```

#### Páginas (Dashboard)

```
(dashboard)/hr/(entities)/recruitment/page.tsx                    → Visão geral (KPIs + vagas)
(dashboard)/hr/(entities)/recruitment/openings/page.tsx           → Listagem de vagas
(dashboard)/hr/(entities)/recruitment/openings/[id]/page.tsx      → Pipeline Kanban da vaga
(dashboard)/hr/(entities)/recruitment/openings/[id]/edit/page.tsx → Editar vaga
(dashboard)/hr/(entities)/recruitment/candidates/page.tsx         → Banco de candidatos
(dashboard)/hr/(entities)/recruitment/candidates/[id]/page.tsx    → Perfil do candidato
```

#### Diferencial: AI Scoring (via Atlas)

- Atlas analisa currículo vs requisitos da vaga
- Gera score 0-100 com justificativa
- Sugere perguntas de entrevista baseadas nos gaps identificados
- Ranking automático dos candidatos

---

### 3B. Avaliação de Desempenho Configurável (0→8)

#### 4 Módulos Ativáveis

A empresa ativa os módulos que quer usar. Podem ser combinados livremente.

##### Módulo 1: Competências

```
CompetencyFramework:
  id, tenantId, name, description, isDefault
  competencies: JSON [{ id, name, description, category, levels: [{ level, description }] }]

CompetencyAssignment:
  id, tenantId, frameworkId
  targetType: POSITION | DEPARTMENT | EMPLOYEE
  targetId, requiredLevel
```

##### Módulo 2: Avaliação 360°

```
EvaluationCycle:
  id, tenantId, name, type: 90 | 180 | 270 | 360
  startDate, endDate, status: DRAFT | IN_PROGRESS | CALIBRATION | COMPLETED
  evaluatorWeights: JSON { self: 20, manager: 40, peer: 25, subordinate: 15 }

Evaluation:
  id, cycleId, tenantId, evaluateeEmployeeId, evaluatorEmployeeId
  evaluatorType: SELF | MANAGER | PEER | SUBORDINATE
  status: PENDING | IN_PROGRESS | SUBMITTED
  responses: JSON [{ competencyId, rating, comment }]
  overallScore, submittedAt

CalibrationSession:
  id, cycleId, tenantId, departmentId
  participants: string[] (evaluator IDs)
  adjustments: JSON [{ employeeId, originalScore, calibratedScore, justification }]
  status: SCHEDULED | IN_PROGRESS | COMPLETED
```

##### Módulo 3: OKRs

```
Objective:
  id, tenantId, employeeId, title, description
  period: Q1_2026 | Q2_2026 | H1_2026 | Y2026
  status: DRAFT | ACTIVE | COMPLETED | CANCELLED
  progress: number (0-100)
  parentObjectiveId (cascata)

KeyResult:
  id, objectiveId, title, targetValue, currentValue, unit
  status: ON_TRACK | AT_RISK | BEHIND | COMPLETED

CheckIn:
  id, keyResultId, employeeId, value, notes, date
```

##### Módulo 4: Feedback Contínuo

```
Feedback:
  id, tenantId, fromEmployeeId, toEmployeeId
  type: PRAISE | CONSTRUCTIVE | SUGGESTION | RECOGNITION
  content, isAnonymous: boolean, isPublic: boolean
  relatedCompetencyId (opcional)
  createdAt

OneOnOne:
  id, tenantId, managerEmployeeId, reportEmployeeId
  scheduledAt, duration, status: SCHEDULED | COMPLETED | CANCELLED
  agenda: string, notes: string, actionItems: JSON [{ item, dueDate, completed }]
```

#### Avaliação Formal (Consolidação)

- Semestral ou anual (configurável)
- Consolida automaticamente: scores de competências + resultados OKR + feedbacks recebidos
- Gera relatório individual por funcionário
- Input para decisões de promoção, mérito, PDI

#### Endpoints

```
# Ciclos
POST   /v1/hr/evaluation-cycles                → Criar ciclo
GET    /v1/hr/evaluation-cycles                → Listar ciclos
GET    /v1/hr/evaluation-cycles/:id           → Detalhes
PUT    /v1/hr/evaluation-cycles/:id           → Editar
POST   /v1/hr/evaluation-cycles/:id/start     → Iniciar ciclo
POST   /v1/hr/evaluation-cycles/:id/calibrate → Iniciar calibração

# Avaliações
GET    /v1/hr/evaluations/my-pending           → Minhas avaliações pendentes
POST   /v1/hr/evaluations/:id/submit           → Submeter avaliação
GET    /v1/hr/evaluations/employee/:id/report  → Relatório consolidado

# OKRs
POST   /v1/hr/objectives                       → Criar objetivo
GET    /v1/hr/objectives                       → Listar (filtros)
POST   /v1/hr/objectives/:id/check-in         → Registrar progresso

# Feedback
POST   /v1/hr/feedback                         → Enviar feedback
GET    /v1/hr/feedback/received                → Recebidos
GET    /v1/hr/feedback/given                   → Enviados

# 1:1
POST   /v1/hr/one-on-ones                      → Agendar 1:1
GET    /v1/hr/one-on-ones                      → Listar
PUT    /v1/hr/one-on-ones/:id                  → Atualizar notas/ações
```

#### Páginas

```
(dashboard)/hr/(entities)/performance/page.tsx                        → Overview (ciclos ativos, pendências)
(dashboard)/hr/(entities)/performance/cycles/page.tsx                 → Listagem de ciclos
(dashboard)/hr/(entities)/performance/cycles/[id]/page.tsx            → Pipeline do ciclo
(dashboard)/hr/(entities)/performance/objectives/page.tsx             → Meus OKRs + equipe
(dashboard)/hr/(entities)/performance/feedback/page.tsx               → Feed de feedback
(dashboard)/hr/(entities)/performance/one-on-ones/page.tsx            → Agenda de 1:1s
(dashboard)/hr/(entities)/performance/employees/[id]/report/page.tsx  → Relatório consolidado
```

---

## FASE 4 — TALENT

### 4A. Gestão de Treinamentos (0→7)

#### Modelos de Dados

```
Training:
  id, tenantId, name, description, type: INTERNAL | EXTERNAL | ONLINE | WORKSHOP
  category: NR | CIPA | FIRE_BRIGADE | ONBOARDING | TECHNICAL | LEADERSHIP | COMPLIANCE | OTHER
  provider, location, cost, maxParticipants
  isRecurring: boolean, recurrenceMonths: number (para NRs obrigatórias)
  certificateRequired: boolean, certificateValidityMonths: number
  workloadHours: number
  status: DRAFT | SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED
  scheduledDate, endDate
  instructorName, instructorRegistration
  createdAt, updatedAt

TrainingParticipant:
  id, trainingId, employeeId, tenantId
  status: ENROLLED | PRESENT | ABSENT | COMPLETED | FAILED
  score: number (nota da avaliação pós-treinamento)
  certificateUrl, certificateExpiresAt
  enrolledAt, completedAt

TrainingNeed:
  id, tenantId, employeeId, trainingCategory
  reason, priority: LOW | MEDIUM | HIGH | MANDATORY
  requestedByEmployeeId, approvedByEmployeeId
  status: REQUESTED | APPROVED | SCHEDULED | COMPLETED
  linkedTrainingId
  createdAt
```

#### Funcionalidades

- Cadastro de treinamentos (internos/externos)
- Inscrição de participantes (individual ou em lote por departamento)
- Controle de presença e avaliação pós-treinamento
- Certificados com upload + data de vencimento
- Alerta automático de reciclagem (NR-5 CIPA anual, NR-35 trabalho em altura, brigada de incêndio)
- Integração com calendário (agendamento aparece no Calendar do módulo tools)
- Dashboard: horas de treinamento por funcionário, investimento por departamento, NRs pendentes

#### Endpoints

```
POST   /v1/hr/trainings                          → Criar treinamento
GET    /v1/hr/trainings                          → Listar
GET    /v1/hr/trainings/:id                     → Detalhes + participantes
PUT    /v1/hr/trainings/:id                     → Editar
DELETE /v1/hr/trainings/:id                     → Cancelar
POST   /v1/hr/trainings/:id/enroll              → Inscrever participantes
POST   /v1/hr/trainings/:id/attendance          → Registrar presença
GET    /v1/hr/trainings/expiring                 → Certificados vencendo
GET    /v1/hr/trainings/employee/:id/history    → Histórico do funcionário
```

#### Páginas

```
(dashboard)/hr/(entities)/trainings/page.tsx              → Listagem
(dashboard)/hr/(entities)/trainings/[id]/page.tsx         → Detalhe + participantes
(dashboard)/hr/(entities)/trainings/[id]/edit/page.tsx    → Editar
(dashboard)/hr/(entities)/trainings/calendar/page.tsx     → Visão calendário
(dashboard)/hr/(entities)/trainings/expiring/page.tsx     → NRs/certificados vencendo
```

### 4B. People Analytics (4→8)

#### 3 Camadas

##### Camada 1: Analytics Distribuído

Cada módulo HR ganha KPIs no próprio overview:

- **Ponto:** presentes hoje, atrasados, ausentes, horas extras do mês
- **Férias:** saldo médio da empresa, períodos vencendo, férias programadas
- **Folha:** custo total, variação mês a mês, encargos vs líquido
- **Turnover:** admissões e demissões do mês, taxa de turnover
- **Ausências:** taxa de absenteísmo, dias perdidos, top motivos
- **Treinamentos:** horas médias por funcionário, NRs pendentes

##### Camada 2: Dashboard Consolidado (`/hr/analytics`)

Página única com todos os indicadores chave:

```
KPIs principais:
  - Headcount (atual + evolução 12 meses)
  - Turnover rate (mensal + acumulado ano)
  - Taxa de absenteísmo
  - Custo médio por funcionário
  - Horas extras / horas normais (ratio)
  - Tempo médio de contratação (do R&S)
  - Horas de treinamento per capita
  - eNPS (do clima organizacional)
  - Índice de desempenho médio (das avaliações)

Filtros globais:
  - Período (mês, trimestre, semestre, ano, custom)
  - Empresa (multi-tenant)
  - Departamento
  - Cargo
```

##### Camada 3: Relatórios Customizáveis

- RH monta relatório escolhendo métricas de qualquer módulo
- Filtros por período, departamento, empresa, cargo, tipo de contrato
- Visualizações: tabela, gráfico de barras, linhas, pizza
- Exportação: PDF, Excel, CSV
- Salvar templates de relatório para reutilização
- Agendamento: relatório automático mensal por email

#### Modelos de Dados

```
AnalyticsReport:
  id, tenantId, name, createdByEmployeeId
  metrics: JSON [{ id, source, aggregation, label }]
  filters: JSON { period, departments, companies, positions }
  visualization: TABLE | BAR | LINE | PIE
  isTemplate: boolean
  schedule: JSON { frequency: DAILY | WEEKLY | MONTHLY, recipients: string[] }
  createdAt, updatedAt

AnalyticsSnapshot:
  id, tenantId, date, metrics: JSON (snapshot diário dos KPIs)
  createdAt
```

#### Endpoints

```
GET    /v1/hr/analytics/dashboard              → KPIs consolidados
GET    /v1/hr/analytics/headcount              → Evolução do headcount
GET    /v1/hr/analytics/turnover               → Taxa de turnover
GET    /v1/hr/analytics/absenteeism            → Absenteísmo
GET    /v1/hr/analytics/costs                  → Custos de pessoal
GET    /v1/hr/analytics/training               → Indicadores de treinamento

POST   /v1/hr/analytics/reports                → Criar relatório customizado
GET    /v1/hr/analytics/reports                → Listar relatórios salvos
GET    /v1/hr/analytics/reports/:id/execute   → Executar relatório
POST   /v1/hr/analytics/reports/:id/export    → Exportar (PDF/Excel/CSV)
```

#### Páginas

```
(dashboard)/hr/analytics/page.tsx               → Dashboard consolidado
(dashboard)/hr/analytics/reports/page.tsx        → Relatórios salvos
(dashboard)/hr/analytics/reports/builder/page.tsx → Construtor de relatórios
```

---

## Estimativa de Escopo por Fase

| Fase      | Novos Models | Novos Endpoints | Novas Páginas | Builders/Parsers | Score Final       |
| --------- | ------------ | --------------- | ------------- | ---------------- | ----------------- |
| 1         | ~15          | ~45             | ~15           | —                | 153/200           |
| 2         | ~5           | ~15             | ~5            | ~10              | 159/200           |
| 3         | ~15          | ~40             | ~15           | —                | 176/200           |
| 4         | ~5           | ~20             | ~10           | —                | 182/200           |
| **Total** | **~40**      | **~120**        | **~45**       | **~10**          | **182/200 (91%)** |

---

## Diferenciais Competitivos vs Mercado

| Diferencial                             | Descrição                                                             | Quem mais tem?            |
| --------------------------------------- | --------------------------------------------------------------------- | ------------------------- |
| **Atlas busca CCT**                     | AI busca convenção coletiva na web e configura regras automaticamente | Ninguém                   |
| **R&S → Admissão → Employee → eSocial** | Pipeline 100% integrado, zero retrabalho                              | Parcial (TOTVS)           |
| **Admissão 3 fluxos**                   | Self-service + híbrido + manual coexistentes                          | Parcial (Convenia)        |
| **Avaliação 4-em-1**                    | Competências + 360° + OKRs + Feedback configuráveis                   | Nenhum ERP brasileiro     |
| **AI Scoring R&S**                      | Atlas analisa currículo vs vaga                                       | Gupy (mas isolado)        |
| **Benefícios Flex**                     | Saldo distribuível por categorias pelo funcionário                    | Operadores especializados |
| **ERP completo**                        | HR + Finance + Stock + Sales + Email + Calendar + Storage             | Apenas TOTVS/Senior       |
| **Multi-tenant SaaS**                   | Arquitetura cloud-native com RBAC granular                            | Factorial, Deel           |
| **Mobile-first punch**                  | PWA com selfie + GPS + geofence + offline                             | Senior (parcial)          |
