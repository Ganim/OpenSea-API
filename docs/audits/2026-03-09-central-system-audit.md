# Relatório de Auditoria — Sistema Central (Gestão de Tenants)

**Data**: 2026-03-09
**Escopo**: Análise de Sistema + UI/UX do painel administrativo Central
**Versão**: 1.0

---

## Sumário Executivo

O sistema Central é o painel de super administração do OpenSea, responsável por gerenciar tenants (empresas), planos de assinatura, usuários e feature flags. A análise abrange **20 endpoints de API**, **17 use cases**, **6 modelos Prisma**, **8 componentes glassmorphism**, **5 páginas** e **19 hooks React Query**.

O sistema demonstra maturidade arquitetural sólida (Clean Architecture, DDD, Repository Pattern), mas possui lacunas significativas em funcionalidades de gestão, observabilidade, e aspectos de UX que limitam a eficácia operacional de um super admin.

---

## Índice

1. [Análise de Sistema (Backend)](#1-análise-de-sistema-backend)
   - 1.1 [Arquitetura e Endpoints](#11-arquitetura-e-endpoints)
   - 1.2 [Modelos de Dados](#12-modelos-de-dados)
   - 1.3 [Segurança e Autorização](#13-segurança-e-autorização)
   - 1.4 [Validação e Tratamento de Erros](#14-validação-e-tratamento-de-erros)
   - 1.5 [Lacunas Funcionais do Backend](#15-lacunas-funcionais-do-backend)
2. [Análise de UI/UX (Frontend)](#2-análise-de-uiux-frontend)
   - 2.1 [Arquitetura de Interface](#21-arquitetura-de-interface)
   - 2.2 [Design System — Glassmorphism](#22-design-system--glassmorphism)
   - 2.3 [Navegação e Fluxos](#23-navegação-e-fluxos)
   - 2.4 [Páginas — Análise Individual](#24-páginas--análise-individual)
   - 2.5 [Acessibilidade](#25-acessibilidade)
   - 2.6 [Responsividade](#26-responsividade)
   - 2.7 [Performance](#27-performance)
3. [Classificação por Criticidade](#3-classificação-por-criticidade)
4. [Recomendações Priorizadas](#4-recomendações-priorizadas)

---

## 1. Análise de Sistema (Backend)

### 1.1 Arquitetura e Endpoints

**Nota: 8/10** — Arquitetura sólida com padrões consistentes.

O Central expõe **20 controllers** sob o prefixo `/v1/admin/`, divididos em:

| Domínio | Endpoints | Métodos |
|---------|-----------|---------|
| Tenants | 9 | POST, GET(2), PUT(4), DELETE |
| Tenant Users | 4 | GET, POST, DELETE, PATCH |
| Plans | 6 | POST, GET(2), PUT(2), DELETE |
| Dashboard | 1 | GET |
| **Total** | **20** | — |

**Pontos positivos:**
- Clean Architecture bem aplicada (Controller → Use Case → Repository)
- Factory Pattern para instanciação de use cases
- Rate limiting diferenciado: 300 req/min (mutations) vs 120 req/min (queries)
- Soft delete consistente (`deletedAt`) em Tenants e TenantUsers

**Problemas identificados:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| S1 | Plans sem paginação | Média | `listPlansUseCase` retorna TODOS os planos sem paginação. Em cenários com centenas de planos, causa problemas de performance. |
| S2 | Dashboard extremamente limitado | Alta | `GetSystemStatsUseCase` retorna apenas `{ totalTenants, totalPlans, activePlans }` — 3 métricas. Insuficiente para gestão operacional. |
| S3 | Sem auditoria de ações admin | Alta | Nenhuma ação do super admin (criar tenant, alterar plano, suspender empresa) é registrada no módulo de audit. Impossível rastrear quem fez o quê. |
| S4 | Sem validação de limites do plano | Alta | Campos `maxUsers`, `maxWarehouses`, `maxProducts` existem no modelo `Plan` mas **nunca são validados** nas operações tenant-scoped. Um tenant no plano FREE pode ter 1000 usuários. |
| S5 | DELETE de plano não verifica tenants | Média | É possível desativar um plano que ainda está associado a tenants ativos, deixando-os sem plano definido. |
| S6 | Feature flags sem endpoint GET | Média | Existe `PUT /feature-flags` (upsert) mas não existe `GET /feature-flags` para listar as flags de um tenant. O frontend exibe "placeholder" nesta tab. |
| S7 | Sem estatísticas por tenant | Média | Não existe endpoint para obter métricas de um tenant individual (nº de produtos, pedidos, movimentações, armazenamento usado). |
| S8 | Sem analytics de planos | Baixa | Impossível ver quantos tenants estão em cada tier, receita por plano, ou tendências de migração entre planos. |
| S9 | Calendar side-effect silenciado | Baixa | Na criação de usuário, a criação do calendário pessoal usa `.catch(() => {})` — falhas são engolidas sem log. |
| S10 | Sem bulk operations | Baixa | Cada operação é individual. Para onboarding de 50 empresas, seriam 50 chamadas separadas. |

---

### 1.2 Modelos de Dados

**Nota: 7.5/10** — Modelos bem estruturados, mas com campos subutilizados.

| Modelo | Campos | Observação |
|--------|--------|------------|
| `Tenant` | 10 campos | `settings` (JSON) e `metadata` (JSON) nunca são utilizados pelo frontend |
| `Plan` | 11 campos | Adequado, mas sem campo `currency` para internacionalização |
| `TenantPlan` | 7 campos | `expiresAt` existe mas nunca é validado (planos não expiram automaticamente) |
| `PlanModule` | 3 campos | Adequado |
| `TenantUser` | 9 campos | `securityKeyHash` bem implementado |
| `TenantFeatureFlag` | 7 campos | `metadata` (JSON) nunca utilizado |

**Problemas identificados:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| D1 | `settings` e `metadata` do Tenant são dead fields | Baixa | Existem no schema mas nenhuma feature os utiliza. Sem documentação do que deveriam conter. |
| D2 | `TenantPlan.expiresAt` não é enforced | Média | O campo existe mas não há cron job ou middleware que verifique expiração. Planos nunca expiram. |
| D3 | Sem modelo de billing/invoice | Info | Não existe rastreamento de pagamentos, faturas ou histórico de cobrança. Aceitável se billing é externo. |
| D4 | Sem histórico de mudanças de plano | Média | Ao trocar o plano de um tenant, o registro anterior é sobrescrito. Não há como saber que um tenant já foi Enterprise e regrediu para Starter. |

---

### 1.3 Segurança e Autorização

**Nota: 9/10** — Modelo de segurança bem implementado.

**Pontos positivos:**
- Todos os 20 endpoints usam `[verifyJwt, verifySuperAdmin]`
- JWT com flag `isSuperAdmin` separada do sistema RBAC
- Rate limiting em todos os endpoints
- Soft delete previne perda de dados
- `securityKeyHash` para 2FA por usuário
- Validação de owner na remoção de usuário (não pode remover o proprietário)

**Problemas identificados:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| A1 | Sem MFA para super admins | Média | O acesso ao Central requer apenas email + senha. Para um painel que controla todas as empresas do sistema, deveria exigir MFA. |
| A2 | Sem IP allowlisting | Baixa | Qualquer IP pode acessar o Central. Em produção, deveria ser restrito a IPs confiáveis. |
| A3 | Sem session timeout diferenciado | Baixa | Sessions de super admin usam o mesmo TTL que sessões regulares. Deveriam ter timeout mais curto. |

---

### 1.4 Validação e Tratamento de Erros

**Nota: 8/10** — Validação Zod consistente, erros bem tipados.

**Pontos positivos:**
- Zod schemas em todos os endpoints
- Erros tipados (BadRequestError, ResourceNotFoundError, ForbiddenError)
- Validação de unicidade (slug, nome do plano)
- Auto-geração de slug a partir do nome

**Problemas identificados:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| V1 | Sem validação de slug format | Baixa | O slug aceita qualquer string de 1-128 chars. Deveria validar formato URL-safe (lowercase, hifens, sem espaços). |
| V2 | `logoUrl` sem validação de URL válida | Baixa | Aceita qualquer string. Deveria validar formato URL e, idealmente, verificar se a imagem é acessível. |
| V3 | `price` aceita 0 mas não negativo | Info | Comportamento correto, mas sem mensagem explicativa se alguém tentar preço negativo. |

---

### 1.5 Lacunas Funcionais do Backend

Funcionalidades que um sistema de gestão de tenants maduro deveria ter:

| # | Funcionalidade Ausente | Prioridade | Descrição |
|---|----------------------|------------|-----------|
| L1 | Histórico de ações (Audit Trail) | **Crítica** | Log de todas as ações admin: quem criou, editou, suspendeu, trocou plano. Essencial para compliance e debugging. |
| L2 | Dashboard rico | **Alta** | Métricas: tenants ativos/inativos, MRR, crescimento, top tenants por uso, alertas de limites. |
| L3 | Enforcing de limites de plano | **Alta** | Middleware que valide `maxUsers`/`maxWarehouses`/`maxProducts` nas operações tenant-scoped. |
| L4 | Expiração de plano | **Média** | Cron job que verifique `TenantPlan.expiresAt` e notifique/suspenda tenants com plano expirado. |
| L5 | Feature flags completo | **Média** | GET endpoint + frontend para listar, criar, editar e remover flags. Flags disponíveis documentadas. |
| L6 | Busca/filtro de tenants | **Média** | Backend não filtra por nome/slug — toda a busca é feita client-side no frontend. Não escala. |
| L7 | Estatísticas por tenant | **Média** | Endpoint que retorne uso real: nº de usuários, produtos, armazéns, storage, últimos acessos. |
| L8 | Export de dados | **Baixa** | Export CSV/Excel de tenants, planos, métricas para relatórios gerenciais. |
| L9 | Notificações de sistema | **Baixa** | Alertar super admin quando tenant excede limites, plano expira, ou anomalias são detectadas. |
| L10 | Impersonation | **Baixa** | Capacidade de "entrar como" um tenant para debugging e suporte, com log de auditoria. |

---

## 2. Análise de UI/UX (Frontend)

### 2.1 Arquitetura de Interface

**Nota: 8.5/10** — Estrutura bem organizada com separação clara.

**Estrutura do layout:**
```
SuperAdminGuard
  └─ CentralThemeProvider
      └─ AnimatedBackground (fixed, z=-10)
      └─ CentralNavbar (h-20, sticky)
      └─ Flex container
          ├─ CentralSidebar (w-72, fixed)
          └─ Main content (flex-1, max-w-1600px, p-8)
```

**Pontos positivos:**
- Route group `(central)` isola CSS e layout
- `central.css` carregado apenas no Central (não polui outras rotas)
- CSS custom properties para theming (zero layout thrash)
- Skip-to-content link para acessibilidade
- Breadcrumb semântico

**Problemas identificados:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| UI1 | Sidebar não colapsável | Média | `w-72` (288px) fixo. Em telas menores (1024-1280px), consome ~22% do espaço. Deveria colapsar para ícones. |
| UI2 | Sem sidebar mobile | Alta | Em telas < 1024px, a sidebar some implicitamente mas sem menu hamburger. O usuário perde acesso à navegação principal. |
| UI3 | Main content sem scroll indicator | Baixa | Conteúdo longo não tem indicador visual de que há mais conteúdo abaixo (ex: shadow no topo ao scrollar). |
| UI4 | Navbar dropdown com useRef manual | Baixa | Implementação custom de click-outside. Deveria usar `@radix-ui/react-popover` ou similar para ARIA compliance automática. |

---

### 2.2 Design System — Glassmorphism

**Nota: 9/10** — Sistema visual coeso e premium.

O Central utiliza um design system próprio baseado em glassmorphism:

| Componente | Variantes | Uso |
|-----------|-----------|-----|
| `GlassCard` | default, subtle, strong, gradient | Cards de conteúdo |
| `GlassButton` | primary, secondary, ghost, danger | Ações e navegação |
| `GlassInput` | — (com icon opcional) | Campos de formulário |
| `GlassBadge` | success, warning, error, info, default | Status e tags |
| `GlassTable` | — | Tabelas de dados |
| `GlassContainer` | subtle, medium, strong | Wrappers |
| `StatCard` | 6 cores de acento | Métricas do dashboard |
| `AnimatedBackground` | light, dark-blue | Background decorativo |

**Pontos positivos:**
- Paleta de cores consistente via CSS variables
- 6 cores de acento (blue, purple, pink, amber, green, cyan) bem aplicadas
- Hover effects suaves (scale 1.02, shadow elevation)
- Transições 300ms ease em todos os componentes
- Background estático (performance over aesthetics)

**Problemas identificados:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| DS1 | Inconsistência entre Glass e shadcn | Média | Páginas de criação (`/tenants/new`, `/plans/new`) usam `Card`, `Input`, `Select` do shadcn/ui em vez dos componentes Glass. Quebrando consistência visual. |
| DS2 | `GlassInput` sem estados de erro | Média | Não tem prop `error` ou `errorMessage`. Validação de formulário não tem feedback visual inline. |
| DS3 | `GlassButton` sem variante "success" | Baixa | Existe `primary`, `secondary`, `ghost`, `danger` mas não `success` para ações positivas confirmadas. |
| DS4 | Sem `GlassSelect` | Média | Todos os selects usam shadcn `Select` que não tem styling glass. Mistura de estilos. |
| DS5 | Sem `GlassTextarea` | Baixa | Textarea usa componente shadcn padrão. |
| DS6 | `GlassTable` sem sorting | Média | Tabelas não suportam ordenação por coluna. Para listas grandes, isso é essencial. |
| DS7 | `GlassTable` sem column resize | Baixa | Colunas com largura fixa. Em telas menores, conteúdo pode truncar. |

---

### 2.3 Navegação e Fluxos

**Nota: 7/10** — Funcional mas com lacunas de UX.

**Estrutura de navegação:**
```
Sidebar:
├─ Dashboard (/central)
├─ Empresas (/central/tenants)
│   ├─ Lista
│   ├─ Nova empresa (/central/tenants/new)
│   └─ Detalhe (/central/tenants/[id])
└─ Planos (/central/plans)
    ├─ Lista
    ├─ Novo plano (/central/plans/new)
    └─ Editar plano (/central/plans/[id])
```

**Problemas identificados:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| N1 | Apenas 3 itens no sidebar | Alta | Para um sistema de gestão, faltam seções: Usuários (global), Módulos, Feature Flags, Logs de Auditoria, Configurações. |
| N2 | Sem breadcrumbs nas subpáginas | Média | Breadcrumb só aparece no dashboard. Páginas de detalhe/criação não têm navegação hierárquica. `Central > Empresas > Empresa Demo` não existe. |
| N3 | Sem search global | Média | Não existe busca que funcione em todas as entidades (tenants + planos + usuários). |
| N4 | Sem atalhos de teclado | Baixa | Sem shortcuts para navegar entre seções (ex: `Ctrl+K` para busca global, `G+T` para tenants). |
| N5 | "Voltar ao App" leva para /select-tenant | Info | Comportamento correto, mas poderia ser mais claro o que acontece ao clicar. |

---

### 2.4 Páginas — Análise Individual

#### 2.4.1 Dashboard (`/central`)

**Nota: 5/10** — Funcionalidade mínima, mais decorativo que funcional.

**Estado atual:**
- Mensagem de boas-vindas com email do admin
- 2 quick links (Empresas, Planos)
- 3 cards de features (Controle Total, Configurações, Monitoramento) — são **estáticos**, sem dados reais
- Card de ajuda

**Problemas:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| DA1 | Sem métricas reais | **Crítica** | O dashboard não exibe NENHUM dado do `GET /v1/admin/dashboard`. Os StatCards existem no design system mas não são usados aqui. Não há gráficos, contadores, ou tendências. |
| DA2 | Cards de features são estáticos | Alta | "Controle Total", "Configurações", "Monitoramento" são textos decorativos. Não refletem dados do sistema. |
| DA3 | Sem atividade recente | Alta | Não mostra últimos tenants criados, últimas mudanças de status, ou ações recentes. |
| DA4 | Sem alertas | Média | Não exibe alertas de sistema (tenants com plano expirado, limites excedidos, erros recorrentes). |
| DA5 | Sem gráficos | Média | Um dashboard admin sem gráficos de tendência (crescimento de tenants, distribuição por plano) é subaproveitado. |

**Recomendações:**
1. Adicionar StatCards reais: Total Tenants, Tenants Ativos, Total Planos, MRR (Monthly Recurring Revenue)
2. Gráfico de crescimento de tenants (últimos 12 meses)
3. Distribuição de tenants por tier (pie chart)
4. Lista de atividade recente (últimas 10 ações)
5. Alertas de sistema (planos expirados, limites próximos, erros)

---

#### 2.4.2 Lista de Tenants (`/central/tenants`)

**Nota: 7/10** — Funcional mas com limitações de escala.

**Estado atual:**
- Busca por nome/slug (client-side filtering)
- GlassTable com 5 colunas (Empresa, Slug, Status, Criado em, Ações)
- Paginação (Previous/Next)
- Botão "Nova Empresa"
- Loading skeleton e empty state

**Problemas:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| TL1 | Busca client-side | Alta | Filtragem é feita no frontend após carregar a página. Com 500+ tenants, isso é inviável. Deveria ser server-side via query param. |
| TL2 | Sem filtro por status | Média | Não é possível ver apenas tenants ACTIVE, INACTIVE ou SUSPENDED separadamente. |
| TL3 | Sem ordenação | Média | Não é possível ordenar por nome, data de criação, ou status. |
| TL4 | Sem coluna "Plano" | Média | A tabela não mostra qual plano cada tenant tem. Informação essencial para gestão. |
| TL5 | Sem coluna "Usuários" | Baixa | Não mostra quantos usuários cada tenant possui. |
| TL6 | Paginação sem page counter | Baixa | Mostra "50 empresas no total" mas não indica "Página 1 de 3". |
| TL7 | Ação única (Eye/ver) | Média | Só tem botão de visualizar. Faltam ações rápidas (suspender, ativar, trocar plano) sem precisar entrar na página de detalhe. |
| TL8 | Sem seleção múltipla | Baixa | Não suporta selecionar múltiplos tenants para ações em batch. |
| TL9 | Sem export | Baixa | Não exporta lista para CSV/Excel. |

---

#### 2.4.3 Detalhe do Tenant (`/central/tenants/[id]`)

**Nota: 8/10** — Página mais elaborada, bom design visual.

**Estado atual:**
- Header premium com nome grande (text-5xl), slug, status badge
- 3 stat cards (Usuários, Plano Atual, Data de Criação)
- 4 tabs: Informações, Usuários, Plano, Flags
- Dialogs para criar usuário e definir security key
- Botões Salvar/Desativar

**Problemas:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| TD1 | Tab "Flags" é placeholder | Média | A tab existe mas mostra conteúdo vazio. Feature flags está sem implementação no frontend (backend tem endpoint PUT mas sem GET). |
| TD2 | Confirmação com `confirm()` nativo | Média | Usar `window.confirm()` para desativar empresa é antipático e não segue o design system. Deveria usar um dialog customizado com glassmorphism. |
| TD3 | Sem histórico de mudanças | Média | Não mostra quando o status foi alterado, quando o plano foi trocado, ou quem fez as alterações. |
| TD4 | Sem preview de usage | Média | Não mostra quanto o tenant está usando dos limites do plano (ex: "15/50 usuários", "230/1000 produtos"). |
| TD5 | Tab "Usuários" sem busca | Baixa | Para tenants com muitos usuários, não há campo de busca ou filtro. |
| TD6 | Sem indicação de último acesso | Baixa | Não mostra quando cada usuário acessou o sistema pela última vez. |
| TD7 | Security key UX confusa | Baixa | O botão de security key não indica se o usuário já tem uma chave definida (sem ícone diferenciado). |
| TD8 | Sem tab de "Atividade" ou "Logs" | Média | Não é possível ver ações realizadas dentro do tenant (produtos criados, pedidos feitos, etc.). |

---

#### 2.4.4 Criar Tenant (`/central/tenants/new`)

**Nota: 6/10** — Funcional mas inconsistente visualmente.

**Estado atual:**
- Formulário simples: Nome, Slug, Logo URL, Status
- Botão "Criar Empresa"
- Botão "Voltar"

**Problemas:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| TC1 | Usa componentes shadcn, não Glass | **Alta** | A página usa `Card`, `CardHeader`, `Input`, `Select` do shadcn/ui em vez dos componentes Glass. Visual completamente diferente do resto do Central. |
| TC2 | Sem preview do slug | Baixa | Ao digitar o nome, não mostra como o slug será gerado automaticamente. |
| TC3 | Sem seleção de plano na criação | Média | Ao criar um tenant, não é possível já associar um plano. Requer uma segunda etapa manual. |
| TC4 | Sem criação de owner user | Média | Ao criar um tenant, não cria automaticamente o primeiro usuário (owner). Requer navegação separada. |
| TC5 | Sem validação visual | Média | Erros de validação não são exibidos inline no formulário. Apenas toast de erro genérico. |

---

#### 2.4.5 Lista de Planos (`/central/plans`)

**Nota: 8.5/10** — Melhor página visualmente. Cards bem desenhados.

**Estado atual:**
- Grid responsivo de cards (md:2, lg:3, xl:4 colunas)
- Cards com gradiente por tier (FREE: gray, STARTER: blue, PROFESSIONAL: purple, ENTERPRISE: amber)
- Exibe: nome, preço, tier badge, descrição, limites (users, warehouses, products)
- Status badge e botão editar no footer
- Hover com gradient overlay e scale

**Problemas:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| PL1 | Sem indicador de tenants usando o plano | Média | Não mostra quantas empresas estão usando cada plano. Informação crucial para decidir desativar. |
| PL2 | Sem busca/filtro | Baixa | Com poucos planos, ok. Mas sem filtro por tier ou status (ativo/inativo). |
| PL3 | Cards não mostram módulos | Baixa | Não indica quais módulos estão incluídos em cada plano. |
| PL4 | Sem comparação entre planos | Baixa | Não existe view de comparação lado-a-lado dos planos (como em pricing pages). |

---

#### 2.4.6 Editar/Criar Plano (`/central/plans/[id]` e `/central/plans/new`)

**Nota: 8/10** — Layout bem estruturado em 3 colunas.

**Estado atual (edição):**
- Header com título, tier badge, back button
- Layout 3 colunas: Informações (2/3) + Resumo (1/3)
- Seção de limites com quick stats visuais
- Grid de módulos com checkboxes (2x5)
- Botões: Desativar / Salvar Alterações

**Problemas:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| PE1 | Criar plano também usa shadcn, não Glass | Alta | Mesma inconsistência visual que a criação de tenant. |
| PE2 | "999999" para ilimitado é UX ruim | Média | Exibir "999999" como valor de "ilimitado" é técnico demais. Deveria ter um toggle "Ilimitado" que defina o valor automaticamente. |
| PE3 | Módulo NOTIFICATIONS desabilitado sem explicação clara | Baixa | Tooltip diz "em breve" mas poderia ter mais contexto. |
| PE4 | Sem drag-and-drop para reordenar módulos | Info | Os módulos são listados em ordem fixa. Não é um problema real, apenas nice-to-have. |
| PE5 | Resumo do plano (sidebar) é estático | Baixa | Não atualiza em tempo real conforme o form é editado. Deveria refletir os valores do formulário. |

---

### 2.5 Acessibilidade

**Nota: 6.5/10** — Base implementada mas com lacunas significativas.

**Implementado:**
- Skip-to-content link (`sr-only`, `focus:not-sr-only`)
- Elemento `<main>` semântico com `id` e `tabIndex`
- `focus-visible:ring-2` em botões
- Breadcrumb com estrutura semântica
- `aria-label` em botões de voltar
- `@media (prefers-reduced-motion: reduce)` no globals.css
- Componentes shadcn/ui com ARIA built-in (Dialog, Tabs)

**Problemas identificados:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| AC1 | Dropdown do navbar sem `aria-expanded` | Média | O menu dropdown do usuário não usa `aria-expanded`, `aria-haspopup`, nem `role="menu"`. Implementação manual com `useRef`. |
| AC2 | Botões icon-only sem `aria-label` | Média | Botão Eye (ver tenant) na tabela não tem `aria-label`. Screen readers lerão "button" sem contexto. |
| AC3 | Search input sem label acessível | Média | O campo de busca na lista de tenants não tem `<label>` associado nem `aria-label`. |
| AC4 | `GlassTable` sem `scope="col"` | Baixa | Headers da tabela (`<th>`) não usam `scope="col"`, dificultando navegação por screen readers. |
| AC5 | Contraste insuficiente no dark-blue theme | Média | Textos `central-text-muted` (#94a3b8) sobre background dark (#0d1426) tem ratio de contraste ~5.5:1 para text-sm. Passa WCAG AA mas falha AAA. Textos `central-text-subtle` podem falhar AA. |
| AC6 | Tabs sem keyboard navigation custom | Baixa | As tabs usam shadcn/ui Tabs que já suportam Arrow keys, mas a implementação custom de tabs no tenant detail pode não. |
| AC7 | Status badges sem texto para screen readers | Baixa | Badges coloridos (success, warning, error) dependem de cor para transmitir significado. Deveriam ter `aria-label` ou texto acessível. |

---

### 2.6 Responsividade

**Nota: 6/10** — Desktop-first com problemas em telas menores.

**Breakpoints utilizados:**
- `md:` (768px) — 2 colunas em grids
- `lg:` (1024px) — 3 colunas, layouts maiores
- `xl:` (1280px) — 4 colunas em plans

**Problemas identificados:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| R1 | Sidebar fixa w-72 sem responsividade | **Alta** | Em telas 1024-1280px, a sidebar consome 22-28% do espaço. Abaixo de 1024px, simplesmente desaparece sem alternativa de navegação. |
| R2 | Sem menu hamburger mobile | **Alta** | Em mobile/tablet, não existe forma de navegar entre seções. O usuário fica preso na página atual. |
| R3 | Tenant detail text-5xl em mobile | Média | O nome do tenant em `text-5xl` (48px) é excessivo em telas pequenas. Deveria reduzir responsivamente. |
| R4 | Navbar h-20 fixo | Baixa | A navbar com 80px de altura é grande para mobile. Poderia reduzir para h-14 ou h-16 em telas pequenas. |
| R5 | Tabelas sem scroll horizontal adequado | Média | `overflow-x-auto` existe mas sem indicador visual de que a tabela pode ser scrollada horizontalmente. |
| R6 | Plan edit 3-column layout em tablet | Baixa | O layout de 3 colunas na edição de plano pode ficar apertado entre 768-1024px. |
| R7 | Padding p-8 fixo | Baixa | `p-8` (32px) é excessivo em telas < 640px. Deveria ser `p-4 md:p-8`. |

---

### 2.7 Performance

**Nota: 8.5/10** — Boas práticas implementadas.

**Pontos positivos:**
- CSS isolado no route group (central.css)
- Background estático (sem animações pesadas)
- React Query com caching e invalidação inteligente
- Queries condicionais (`enabled: !!id`)
- `useState` funcional (`setForm(f => ({...f, field: val}))`)
- Dialogs renderizam conteúdo apenas quando abertos

**Problemas identificados:**

| # | Problema | Severidade | Detalhe |
|---|---------|------------|---------|
| P1 | Busca client-side recarrega todos os dados | Média | A busca na lista de tenants filtra no frontend, mas carrega todos os dados da página atual a cada mudança. Deveria usar debounce + server-side. |
| P2 | Sem virtualização | Baixa | Listas de usuários dentro de um tenant não são virtualizadas. Com 100+ usuários, pode haver lag. |
| P3 | AnimatedBackground renderiza sempre | Info | O componente com 5 gradients radiais é renderizado mesmo quando coberto por conteúdo. Impacto mínimo por ser CSS puro. |

---

## 3. Classificação por Criticidade

### Problemas Críticos (resolver imediatamente)

| ID | Área | Problema |
|----|------|---------|
| DA1 | Dashboard UI | Dashboard sem métricas reais — é decorativo |
| S3 | Backend | Sem auditoria de ações admin |
| S4 | Backend | Limites de plano nunca validados |

### Problemas de Alta Prioridade

| ID | Área | Problema |
|----|------|---------|
| S2 | Backend | Dashboard API retorna apenas 3 métricas |
| R1/R2 | Responsividade | Sidebar não colapsa e sem menu mobile |
| TL1 | Tenants List | Busca client-side não escala |
| TC1/PE1 | Criação | Páginas de criação usam shadcn em vez de Glass |
| DS1 | Design System | Inconsistência Glass vs shadcn |
| N1 | Navegação | Sidebar com apenas 3 seções |
| UI2 | Layout | Sem navegação mobile |

### Problemas de Média Prioridade

| ID | Área | Problema |
|----|------|---------|
| S5 | Backend | Delete de plano sem verificar tenants |
| S6 | Backend | Feature flags sem GET endpoint |
| S7 | Backend | Sem estatísticas por tenant |
| D2 | Dados | TenantPlan.expiresAt não enforced |
| D4 | Dados | Sem histórico de mudanças de plano |
| DS2 | Design System | GlassInput sem estado de erro |
| DS4 | Design System | Sem GlassSelect |
| DS6 | Design System | GlassTable sem sorting |
| TD1 | Tenant Detail | Tab Flags placeholder |
| TD2 | Tenant Detail | `confirm()` nativo |
| TC3 | Criar Tenant | Sem seleção de plano |
| TC4 | Criar Tenant | Sem criação de owner |
| AC1 | Acessibilidade | Dropdown sem ARIA |
| AC5 | Acessibilidade | Contraste pode falhar AAA |
| R3 | Responsividade | text-5xl em mobile |
| PL1 | Plans List | Sem contagem de tenants por plano |

### Problemas de Baixa Prioridade

| ID | Área | Problema |
|----|------|---------|
| S1 | Backend | Plans sem paginação |
| S8-S10 | Backend | Analytics, bulk ops, impersonation |
| V1/V2 | Validação | Slug format, logoUrl validation |
| DS3/DS5 | Design System | Variantes e componentes faltantes |
| N2-N4 | Navegação | Breadcrumbs, search global, atalhos |
| TL5-TL9 | Tenants List | Colunas e funcionalidades extras |
| TD5-TD7 | Tenant Detail | Busca, último acesso, security key UX |
| PL2-PL4 | Plans List | Busca, módulos, comparação |
| PE2-PE5 | Plan Edit | UX improvements |
| AC4/AC6/AC7 | Acessibilidade | Table scope, keyboard nav, badges |

---

## 4. Recomendações Priorizadas

### Fase 1 — Correções Urgentes (1-2 sprints)

1. **Dashboard real**: Integrar `useDashboardStats()` + expandir API com métricas ricas (tenants por status, MRR, crescimento mensal). Adicionar StatCards, gráfico de linha e lista de atividade recente.

2. **Audit trail para admin**: Integrar com módulo de audit existente. Logar todas as mutações do Central (create/update/delete tenant/plan/user) com userId, action, before/after.

3. **Enforcing de limites de plano**: Criar middleware `verifyPlanLimits` que valide `maxUsers`/`maxWarehouses`/`maxProducts` antes de permitir criação de novos recursos.

4. **Consistência visual**: Migrar `/tenants/new` e `/plans/new` para componentes Glass. Criar `GlassSelect` e `GlassTextarea`.

### Fase 2 — UX e Funcionalidade (2-3 sprints)

5. **Sidebar responsiva**: Implementar sidebar colapsável (ícones only em lg, drawer em mobile). Adicionar menu hamburger no navbar para mobile.

6. **Busca server-side**: Adicionar query params `search`, `status` no endpoint `GET /v1/admin/tenants`. Implementar debounce no frontend.

7. **Feature flags completo**: Adicionar `GET /v1/admin/tenants/:id/feature-flags`. Implementar UI de listagem e toggle no frontend.

8. **Fluxo de criação de tenant melhorado**: Wizard multi-step: Dados básicos → Selecionar plano → Criar owner user.

9. **Substituir `confirm()` nativo**: Criar `GlassConfirmDialog` com design consistente para ações destrutivas.

### Fase 3 — Maturidade (3-4 sprints)

10. **Estatísticas por tenant**: Endpoint `GET /v1/admin/tenants/:id/statistics` retornando uso real vs limites. Exibir como progress bars na aba de plano.

11. **Analytics de planos**: Endpoint com contagem de tenants por plano, distribuição por tier. Exibir no card de cada plano e no dashboard.

12. **Histórico de mudanças de plano**: Tabela `TenantPlanHistory` para rastrear migrações. Exibir timeline na aba de plano do tenant.

13. **Acessibilidade**: Refatorar dropdown do navbar para Radix Popover, adicionar `aria-label` em botões icon-only, `scope="col"` em tabelas.

14. **Gráficos no dashboard**: Integrar biblioteca de charts (recharts ou visx) para gráficos de crescimento e distribuição.

### Fase 4 — Funcionalidades Avançadas (4+ sprints)

15. **Expiração automática de planos**: Cron job para verificar `TenantPlan.expiresAt`, notificar admin e/ou suspender tenant.

16. **Export de dados**: CSV/Excel para listas de tenants e planos.

17. **Notificações de sistema**: Alertas no dashboard para anomalias (limites excedidos, planos expirados, erros recorrentes).

18. **Impersonation**: "Login como tenant" para debugging, com audit trail completo.

---

## Resumo de Notas

| Aspecto | Nota | Comentário |
|---------|------|------------|
| Arquitetura Backend | 8/10 | Sólida, bem estruturada, faltam funcionalidades de gestão |
| Modelos de Dados | 7.5/10 | Completos mas com campos mortos e sem enforcement |
| Segurança | 9/10 | Bem implementada, falta MFA para super admin |
| Validação | 8/10 | Zod consistente, faltam validações de formato |
| Design System | 9/10 | Glassmorphism coeso e premium |
| Dashboard | 5/10 | Decorativo, sem dados reais |
| Lista de Tenants | 7/10 | Funcional, busca não escala |
| Detalhe do Tenant | 8/10 | Melhor página, faltam dados de uso |
| Lista de Planos | 8.5/10 | Melhor design visual |
| Páginas de Criação | 6/10 | Inconsistência visual com resto do Central |
| Acessibilidade | 6.5/10 | Base ok, lacunas em ARIA e contraste |
| Responsividade | 6/10 | Desktop-first, mobile quebrado |
| Performance | 8.5/10 | Boas práticas, busca client-side é gargalo |
| **Média Geral** | **7.4/10** | — |

---

*Relatório gerado por análise de código e arquitetura. Nenhuma verificação em runtime/produção foi realizada.*
