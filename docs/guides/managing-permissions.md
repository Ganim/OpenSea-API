# Guide: Managing Permissions

Guia prático para adicionar, editar ou remover permissões no sistema OpenSea sem precisar conhecer o histórico de como o sistema foi construído.

---

## Visão Geral do Sistema

O RBAC do OpenSea possui **quatro camadas sincronizadas**. Toda alteração de código deve percorrer todas as camadas aplicáveis:

```
1. Backend codes       OpenSea-API/src/constants/rbac/permission-codes.ts
                       ↓ fonte da verdade para o banco de dados
2. Banco de dados      Tabela `permissions` — populada pelo seed ou migrate-permissions.ts
                       ↓ consultada em runtime para verificar acessos
3. Frontend codes      OpenSea-APP/src/config/rbac/permission-codes.ts
                       ↓ usado nos hooks e componentes para gating de UI
4. Matrix config       OpenSea-APP/src/.../permission-matrix-config.ts
                       ↓ controla o que aparece no editor visual de grupos de permissão
```

**Regra de ouro:** o arquivo de códigos do backend é a fonte da verdade. Os outros três devem espelhá-lo fielmente.

---

## Formato dos Códigos

```
3 níveis (módulos de negócio):  {módulo}.{recurso}.{ação}
4 níveis (ferramentas — tools): {módulo}.{ferramenta}.{recurso}.{ação}
```

Exemplos reais:
```
stock.products.register          ← 3 níveis
finance.cost-centers.modify      ← 3 níveis, recurso kebab-case
tools.email.accounts.access      ← 4 níveis
tools.storage.files.onlyself     ← 4 níveis
```

### As 10 ações disponíveis

| Código interno | Rótulo na UI      | Grupo na tabela    |
|----------------|-------------------|--------------------|
| `access`       | Acessar           | Ações              |
| `register`     | Cadastrar         | Ações              |
| `modify`       | Alterar           | Ações              |
| `remove`       | Remover           | Ações              |
| `import`       | Importar          | Ações              |
| `print`        | Imprimir          | Ações              |
| `export`       | Externo           | Compartilhamento   |
| `share`        | Interno           | Compartilhamento   |
| `admin`        | Global            | Gerenciamento      |
| `onlyself`     | Pessoal           | Gerenciamento      |

Nem todo recurso precisa de todas as ações. Adicione apenas as que fazem sentido para o domínio.

---

## 1. Adicionando uma Nova Ação a um Recurso Existente

**Cenário:** adicionar a ação `print` ao recurso `finance.contracts`, que atualmente não a possui.

### Passo 1 — Backend: `permission-codes.ts`

Arquivo: `OpenSea-API/src/constants/rbac/permission-codes.ts`

```typescript
// Antes
CONTRACTS: {
  ACCESS: 'finance.contracts.access' as const,
  REGISTER: 'finance.contracts.register' as const,
  MODIFY: 'finance.contracts.modify' as const,
  REMOVE: 'finance.contracts.remove' as const,
  EXPORT: 'finance.contracts.export' as const,
},

// Depois — adicionar PRINT
CONTRACTS: {
  ACCESS: 'finance.contracts.access' as const,
  REGISTER: 'finance.contracts.register' as const,
  MODIFY: 'finance.contracts.modify' as const,
  REMOVE: 'finance.contracts.remove' as const,
  EXPORT: 'finance.contracts.export' as const,
  PRINT: 'finance.contracts.print' as const,   // ← adicionado
},
```

### Passo 2 — Frontend: `permission-codes.ts`

Arquivo: `OpenSea-APP/src/config/rbac/permission-codes.ts`

```typescript
// Antes
CONTRACTS: perm('finance', 'contracts', 'access', 'register', 'modify', 'remove', 'export'),

// Depois
CONTRACTS: perm('finance', 'contracts', 'access', 'register', 'modify', 'remove', 'export', 'print'),
```

### Passo 3 — Matrix config: adicionar `print` ao `availableActions`

Arquivo: `OpenSea-APP/src/.../permission-matrix-config.ts`

```typescript
// Antes
{ label: 'Contratos', group: 'Cadastros', backendResources: ['finance.contracts'],
  availableActions: ['access', 'register', 'modify', 'remove', 'export'] },

// Depois
{ label: 'Contratos', group: 'Cadastros', backendResources: ['finance.contracts'],
  availableActions: ['access', 'register', 'modify', 'remove', 'export', 'print'] },
```

> Se `print` não estiver em `availableActions`, a coluna ficará com "N/A" no editor visual, e usuários não poderão conceder essa permissão por meio da interface.

### Passo 4 — Controller: usar o novo código

```typescript
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';

// Endpoint que requer a nova permissão
preHandler: [
  verifyJwt,
  verifyTenant,
  createPermissionMiddleware({
    permissionCode: PermissionCodes.FINANCE.CONTRACTS.PRINT,
    resource: 'contracts',
  }),
],
```

### Passo 5 — Frontend: gating de UI

```typescript
import PermissionCodes from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';

const { hasPermission } = usePermissions();
const canPrint = hasPermission(PermissionCodes.FINANCE.CONTRACTS.PRINT);

// O botão só renderiza se o usuário tiver a permissão
{canPrint && <Button onClick={handlePrint}>Imprimir Contrato</Button>}
```

### Passo 6 — Executar a migração

```bash
npx tsx --env-file=.env prisma/migrate-permissions.ts
```

---

## 2. Adicionando um Novo Recurso (nova entidade)

**Cenário:** adicionar o recurso `finance.invoices` (Notas Fiscais) ao módulo Finance.

### Passo 1 — Backend: `permission-codes.ts`

Adicionar um novo bloco dentro da seção `FINANCE`:

```typescript
FINANCE: {
  // ... recursos existentes ...

  INVOICES: {
    ACCESS:   'finance.invoices.access'   as const,
    REGISTER: 'finance.invoices.register' as const,
    MODIFY:   'finance.invoices.modify'   as const,
    REMOVE:   'finance.invoices.remove'   as const,
    EXPORT:   'finance.invoices.export'   as const,
    PRINT:    'finance.invoices.print'    as const,
    ADMIN:    'finance.invoices.admin'    as const,
    ONLYSELF: 'finance.invoices.onlyself' as const,
  },
},
```

### Passo 2 — Frontend: `permission-codes.ts`

Adicionar ao objeto `FINANCE_PERMISSIONS`:

```typescript
export const FINANCE_PERMISSIONS = {
  // ... recursos existentes ...

  INVOICES: perm(
    'finance',
    'invoices',
    'access',
    'register',
    'modify',
    'remove',
    'export',
    'print',
    'admin',
    'onlyself'
  ),
} as const;
```

### Passo 3 — Matrix config: novo entry no tab `finance`

Localizar a tab com `id: 'finance'` e adicionar a nova entrada no array `resources`:

```typescript
{
  id: 'finance',
  label: 'Financeiro',
  icon: DollarSign,
  resources: [
    // ... recursos existentes ...

    // Documentos Fiscais (novo grupo visual, ou use 'Operações' se preferir)
    { label: 'Notas Fiscais', group: 'Documentos Fiscais',
      backendResources: ['finance.invoices'],
      availableActions: ['access', 'register', 'modify', 'remove', 'export', 'print', 'admin', 'onlyself'] },
  ],
},
```

> O campo `group` é apenas um cabeçalho visual na tabela. Pode reutilizar grupos existentes como `'Cadastros'` ou `'Operações'`, ou criar um novo.

### Passo 4 — Controllers: aplicar a permissão em cada endpoint

```typescript
// GET /v1/finance/invoices
createPermissionMiddleware({ permissionCode: PermissionCodes.FINANCE.INVOICES.ACCESS, resource: 'invoices' })

// POST /v1/finance/invoices
createPermissionMiddleware({ permissionCode: PermissionCodes.FINANCE.INVOICES.REGISTER, resource: 'invoices' })

// PATCH /v1/finance/invoices/:id
createPermissionMiddleware({ permissionCode: PermissionCodes.FINANCE.INVOICES.MODIFY, resource: 'invoices' })

// DELETE /v1/finance/invoices/:id
createPermissionMiddleware({ permissionCode: PermissionCodes.FINANCE.INVOICES.REMOVE, resource: 'invoices' })
```

### Passo 5 — Executar a migração

```bash
npx tsx --env-file=.env prisma/migrate-permissions.ts
```

O script cria automaticamente todas as novas permissões no banco e as atribui ao grupo Admin de todos os tenants.

---

## 3. Adicionando um Novo Módulo (nova aba na matrix)

**Cenário:** adicionar o módulo `production` com os recursos `work-orders` e `bom` (bill of materials).

### Passo 1 — Backend: nova seção em `permission-codes.ts`

```typescript
// Adicionar após a seção SYSTEM:
// ============================================================================
// PRODUCTION — Produção e manufatura
// ============================================================================
PRODUCTION: {
  WORK_ORDERS: {
    ACCESS:   'production.work-orders.access'   as const,
    REGISTER: 'production.work-orders.register' as const,
    MODIFY:   'production.work-orders.modify'   as const,
    REMOVE:   'production.work-orders.remove'   as const,
    ADMIN:    'production.work-orders.admin'    as const,
    ONLYSELF: 'production.work-orders.onlyself' as const,
  },
  BOM: {
    ACCESS:   'production.bom.access'   as const,
    REGISTER: 'production.bom.register' as const,
    MODIFY:   'production.bom.modify'   as const,
    REMOVE:   'production.bom.remove'   as const,
  },
},
```

### Passo 2 — Frontend: novo export em `permission-codes.ts`

**a)** Criar a constante por módulo (seguindo o padrão dos existentes):

```typescript
export const PRODUCTION_PERMISSIONS = {
  WORK_ORDERS: perm(
    'production', 'work-orders',
    'access', 'register', 'modify', 'remove', 'admin', 'onlyself'
  ),
  BOM: perm(
    'production', 'bom',
    'access', 'register', 'modify', 'remove'
  ),
} as const;
```

**b)** Adicionar ao objeto `PermissionCodes` agregado:

```typescript
export const PermissionCodes = {
  STOCK:      STOCK_PERMISSIONS,
  FINANCE:    FINANCE_PERMISSIONS,
  HR:         HR_PERMISSIONS,
  SALES:      SALES_PERMISSIONS,
  ADMIN:      ADMIN_PERMISSIONS,
  TOOLS:      TOOLS_PERMISSIONS,
  SYSTEM:     SYSTEM_PERMISSIONS,
  PRODUCTION: PRODUCTION_PERMISSIONS,   // ← adicionado
  WILDCARD:   WILDCARD_PERMISSIONS,
} as const;
```

**c)** Adicionar o tipo derivado:

```typescript
export type ProductionPermission = DeepValues<typeof PRODUCTION_PERMISSIONS>;

export type AnyPermission =
  | StockPermission
  | FinancePermission
  | HRPermission
  | SalesPermission
  | AdminPermission
  | ToolsPermission
  | SystemPermission
  | ProductionPermission   // ← adicionado
  | typeof WILDCARD_PERMISSIONS.FULL_ACCESS;
```

### Passo 3 — Matrix config: nova aba

**a)** Importar o ícone necessário do `lucide-react` (escolha o mais adequado):

```typescript
import { Factory } from 'lucide-react'; // exemplo
```

**b)** Adicionar a nova tab ao array `MATRIX_TABS`:

```typescript
{
  id: 'production',
  label: 'Produção',
  icon: Factory,
  resources: [
    // Ordens de Produção
    { label: 'Ordens de Produção', group: 'Operações',
      backendResources: ['production.work-orders'],
      availableActions: ['access', 'register', 'modify', 'remove', 'admin', 'onlyself'] },

    // Lista de Materiais
    { label: 'Lista de Materiais', group: 'Cadastros',
      backendResources: ['production.bom'],
      availableActions: ['access', 'register', 'modify', 'remove'] },
  ],
},
```

### Passo 4 — Executar a migração

```bash
npx tsx --env-file=.env prisma/migrate-permissions.ts
```

---

## 4. Removendo uma Permissão

**Cenário:** remover `stock.templates.import` porque a funcionalidade de importação de templates foi descontinuada.

### Passo 1 — Backend: `permission-codes.ts`

```typescript
// Antes
TEMPLATES: {
  ACCESS:   'stock.templates.access'   as const,
  REGISTER: 'stock.templates.register' as const,
  MODIFY:   'stock.templates.modify'   as const,
  REMOVE:   'stock.templates.remove'   as const,
  IMPORT:   'stock.templates.import'   as const,  // ← remover esta linha
},

// Depois
TEMPLATES: {
  ACCESS:   'stock.templates.access'   as const,
  REGISTER: 'stock.templates.register' as const,
  MODIFY:   'stock.templates.modify'   as const,
  REMOVE:   'stock.templates.remove'   as const,
},
```

### Passo 2 — Frontend: `permission-codes.ts`

```typescript
// Antes
TEMPLATES: perm('stock', 'templates', 'access', 'register', 'modify', 'remove', 'import'),

// Depois
TEMPLATES: perm('stock', 'templates', 'access', 'register', 'modify', 'remove'),
```

### Passo 3 — Matrix config: remover do `availableActions`

```typescript
// Antes
{ label: 'Templates', group: 'Cadastros', backendResources: ['stock.templates'],
  availableActions: ['access', 'register', 'modify', 'remove', 'import'] },

// Depois
{ label: 'Templates', group: 'Cadastros', backendResources: ['stock.templates'],
  availableActions: ['access', 'register', 'modify', 'remove'] },
```

### Passo 4 — Controllers: remover o endpoint ou middleware

Localizar e remover (ou atualizar) qualquer controller que usasse `PermissionCodes.STOCK.TEMPLATES.IMPORT`.

### Passo 5 — Executar a migração

```bash
npx tsx --env-file=.env prisma/migrate-permissions.ts
```

O script de migração identificará automaticamente que `stock.templates.import` não existe mais em `PermissionCodes`, removerá o registro do banco de dados, e limpará todas as associações de grupos e usuários que tinham essa permissão.

> **Nota:** A migração é segura. Ela remove apenas registros marcados com `isSystem: true` que não estão mais presentes no código. Permissões customizadas criadas manualmente (via API) não são afetadas.

---

## 5. Renomeando ou Movendo uma Permissão

**Cenário:** mover `stock.purchase-orders` para `purchases.orders` porque `purchases` virou um módulo separado.

Esta operação equivale a **remover o código antigo e adicionar o novo**. O banco de dados não tem renomeação automática — a migração destrói o antigo e cria o novo.

### Consequência importante

Grupos de permissão que tinham `stock.purchase-orders.*` **perderão** essas permissões. O grupo Admin será reconfigurado com todos os novos códigos, mas **grupos customizados de usuários precisarão ser reconfigurados manualmente** via interface de permissões.

### Procedimento

1. **Backend:** remover o bloco `PURCHASE_ORDERS` de `STOCK` e criá-lo em `PURCHASES`.
2. **Frontend codes:** idem.
3. **Matrix config:** mover a entrada da tab `stock` para uma nova tab `purchases` (ou tab existente).
4. **Controllers:** atualizar todos os `createPermissionMiddleware` para usar os novos códigos.
5. **Rodar a migração:** o script remove os stale e cria os novos.
6. **Verificar grupos customizados:** após a migração, grupos que tinham as permissões antigas precisam ser reconfigurados pela interface de administração.

> Se o rename for simples (só mudar o nome do código, mesma semântica), documente a mudança em um ADR antes de executar, pois há impacto operacional para tenants já em produção.

---

## 6. Adicionando Permissões de 4 Níveis (sub-recursos de ferramentas)

Permissões de 4 níveis são usadas exclusivamente para o módulo `tools`, onde cada ferramenta tem sub-recursos independentes.

**Formato:** `tools.{ferramenta}.{recurso}.{ação}`

**Cenário:** adicionar o módulo `tools.crm` com os sub-recursos `contacts` e `pipelines`.

### Passo 1 — Backend: `permission-codes.ts`

O quarto nível usa aninhamento de objetos:

```typescript
TOOLS: {
  // ... tools existentes (EMAIL, TASKS, CALENDAR, STORAGE) ...

  CRM: {
    CONTACTS: {
      ACCESS:   'tools.crm.contacts.access'   as const,
      REGISTER: 'tools.crm.contacts.register' as const,
      MODIFY:   'tools.crm.contacts.modify'   as const,
      REMOVE:   'tools.crm.contacts.remove'   as const,
      ADMIN:    'tools.crm.contacts.admin'    as const,
      ONLYSELF: 'tools.crm.contacts.onlyself' as const,
    },
    PIPELINES: {
      ACCESS:   'tools.crm.pipelines.access'   as const,
      REGISTER: 'tools.crm.pipelines.register' as const,
      MODIFY:   'tools.crm.pipelines.modify'   as const,
      REMOVE:   'tools.crm.pipelines.remove'   as const,
      SHARE:    'tools.crm.pipelines.share'    as const,
    },
  },
},
```

### Passo 2 — Frontend: `permission-codes.ts`

O frontend usa a função `perm()` com o recurso composto via `.`:

```typescript
export const TOOLS_PERMISSIONS = {
  // ... tools existentes ...

  CRM: {
    CONTACTS: perm(
      'tools',
      'crm.contacts',          // ← recurso com ponto = 4 níveis no código final
      'access', 'register', 'modify', 'remove', 'admin', 'onlyself'
    ),
    PIPELINES: perm(
      'tools',
      'crm.pipelines',
      'access', 'register', 'modify', 'remove', 'share'
    ),
  },
} as const;
```

> A função `perm('tools', 'crm.contacts', 'access')` gera a string `'tools.crm.contacts.access'`. O ponto no segundo argumento é intencional e produz o 4º nível.

### Passo 3 — Matrix config: adicionar à tab `tools`

```typescript
{
  id: 'tools',
  label: 'Ferramentas',
  icon: Wrench,
  resources: [
    // ... recursos existentes ...

    // CRM
    { label: 'CRM: Contatos', group: 'CRM',
      backendResources: ['tools.crm.contacts'],
      availableActions: ['access', 'register', 'modify', 'remove', 'admin', 'onlyself'] },
    { label: 'CRM: Pipelines', group: 'CRM',
      backendResources: ['tools.crm.pipelines'],
      availableActions: ['access', 'register', 'modify', 'remove', 'share'] },
  ],
},
```

> O campo `backendResources` deve conter a string sem a ação — apenas o prefixo até antes do último ponto. Para `tools.crm.contacts.access`, o valor em `backendResources` é `'tools.crm.contacts'`.

### Passo 4 — Executar a migração

```bash
npx tsx --env-file=.env prisma/migrate-permissions.ts
```

---

## 7. Executando a Migração

### Ambiente local

```bash
# A partir do diretório OpenSea-API/
npx tsx --env-file=.env prisma/migrate-permissions.ts
```

### Ambiente de produção

```bash
# Substituir .env.production pelo arquivo correto do ambiente
npx tsx --env-file=.env.production prisma/migrate-permissions.ts
```

### O que o script faz (em ordem)

1. **Lê** todos os códigos de `PermissionCodes` via `extractAllCodes()` — detecta automaticamente todos os níveis de aninhamento.
2. **Cria** permissões novas (presentes no código, ausentes no banco).
3. **Atualiza** permissões existentes (name, description, module, resource, action).
4. **Remove** permissões obsoletas (presentes no banco com `isSystem: true`, ausentes no código) — junto com todas as associações de grupos e permissões diretas de usuários.
5. **Reassocia** todos os grupos Admin de todos os tenants com a lista completa de permissões.
6. **Reassocia** todos os grupos User de todos os tenants com `DEFAULT_USER_PERMISSIONS`.

### Como verificar o resultado

```bash
# Contar permissões no banco após a migração
npx prisma studio
# Abrir tabela `Permission` e verificar o total

# Ou via psql/query direta
SELECT COUNT(*) FROM permissions WHERE is_system = true;
```

O script imprime um resumo ao final:
```
📊 Resumo:
   Total de permissões no sistema: 243
   Grupos Admin atualizados: 3
   Grupos User atualizados: 3
```

### Quando executar

- Após **qualquer** alteração em `permission-codes.ts` (adição, remoção, renomeação)
- Antes de subir para produção quando houver mudanças de permissão no PR
- O script é **idempotente** — pode ser executado múltiplas vezes sem efeitos colaterais

### Seed vs Migração — qual usar?

| Cenário | Comando | O que faz |
|---------|---------|-----------|
| **Desenvolvimento local** (banco limpo, dados de teste) | `npm run prisma:seed` | Cria tudo: permissões, grupos, usuários demo, planos, tenant demo, pastas storage |
| **Após alterar permissões** (local) | `npx tsx --env-file=.env prisma/migrate-permissions.ts` | Só sincroniza permissões e grupos Admin/User. Não toca em usuários, planos ou tenants |
| **Produção** (deploy com mudanças de permissão) | `npx tsx --env-file=.env.production prisma/migrate-permissions.ts` | Mesmo que acima, mas conectando ao banco de produção |
| **Reset total** (banco local zerado) | `npx prisma migrate reset && npm run prisma:seed` | Recria o schema + seed completo |

**Regra prática:**
- Use `seed` apenas em ambientes que podem ser resetados (local, CI)
- Use `migrate-permissions.ts` em staging/produção — ele é seguro e cirúrgico

### Fluxo completo: do desenvolvimento ao deploy

```
1. Altere permission-codes.ts no backend
2. Altere permission-codes.ts no frontend (espelhar)
3. Altere permission-matrix-config.ts (availableActions, backendResources)
4. Altere o controller que vai usar a nova permissão
5. Altere a página/componente que vai checar a permissão (hasPermission)

── Testar localmente ──
6. Execute: npx tsx --env-file=.env prisma/migrate-permissions.ts
7. Reinicie o backend (npm run dev)
8. Faça logout/login no frontend (cache de permissões tem 15min de staleTime)
9. Verifique: abra o modal de permissões e confirme que a nova permissão aparece
10. Verifique: teste o fluxo protegido com um usuário que NÃO tenha a permissão

── Subir para produção ──
11. Faça push do código (backend + frontend)
12. Deploy do backend
13. Execute no servidor: npx tsx --env-file=.env.production prisma/migrate-permissions.ts
14. Deploy do frontend
15. Verifique: acesse o sistema em produção e confirme
```

### Compatibilizando dados entre local e produção

**Problema:** O banco local e o banco de produção podem ficar dessincronizados se:
- Você rodou a seed localmente mas não rodou a migração em produção
- A produção tem grupos customizados com permissões que não existem mais

**Como resolver:**

1. **Antes do deploy**, liste as diferenças:
   ```sql
   -- No banco de produção, ver permissões que existem mas não estão no código
   SELECT code FROM permissions WHERE is_system = true
   AND code NOT IN ('stock.products.access', 'stock.products.register', ...);
   ```

2. **Rodar a migração** — ela faz tudo automaticamente:
   - Cria permissões que existem no código mas não no banco
   - Remove permissões que existem no banco mas não no código (junto com associações)
   - Reassocia Admin (todas) e User (DEFAULT_USER_PERMISSIONS)

3. **Grupos customizados** — a migração **não toca** em grupos que não sejam Admin/User. Se um grupo customizado tinha uma permissão que foi removida, a associação é deletada automaticamente (porque a permissão em si é deletada). Se uma permissão foi renomeada, o grupo perde a permissão antiga e o admin precisa adicionar a nova manualmente.

4. **Para verificar compatibilidade antes de rodar:**
   ```bash
   # Ver quantas permissões existem no banco
   SELECT COUNT(*) FROM permissions WHERE is_system = true;

   # Ver permissões de um grupo customizado
   SELECT p.code FROM permission_group_permissions pgp
   JOIN permissions p ON p.id = pgp.permission_id
   WHERE pgp.group_id = '<group-id>'
   ORDER BY p.code;
   ```

### Ambientes múltiplos (staging, produção)

Se há múltiplos ambientes, cada um precisa do script de migração executado separadamente:

```bash
# Staging
npx tsx --env-file=.env.staging prisma/migrate-permissions.ts

# Produção
npx tsx --env-file=.env.production prisma/migrate-permissions.ts
```

O script detecta automaticamente todos os tenants e seus grupos, então funciona independente de quantos tenants ou ambientes existem.

---

## 8. Erros Comuns

### 8.1 Ação adicionada ao backend mas ausente no `availableActions`

**Sintoma:** a permissão existe no banco de dados, mas a coluna aparece como "N/A" no editor visual de grupos de permissão. Não é possível conceder a permissão pela interface.

**Causa:** `availableActions` na matrix config não foi atualizado.

**Solução:** adicionar a ação ao array `availableActions` do recurso correspondente em `permission-matrix-config.ts`.

```typescript
// Errado — 'print' existe no backend mas não no availableActions
{ label: 'Contratos', group: 'Cadastros', backendResources: ['finance.contracts'],
  availableActions: ['access', 'register', 'modify', 'remove', 'export'] },

// Correto
{ label: 'Contratos', group: 'Cadastros', backendResources: ['finance.contracts'],
  availableActions: ['access', 'register', 'modify', 'remove', 'export', 'print'] },
```

---

### 8.2 Migração não executada após alterar os códigos

**Sintoma:** controller retorna `403 Forbidden` mesmo para o usuário Admin, ou a nova permissão não aparece na interface.

**Causa:** o banco de dados ainda não tem o novo código. O grupo Admin não foi atualizado.

**Solução:**
```bash
npx tsx --env-file=.env prisma/migrate-permissions.ts
```

---

### 8.3 Divergência entre backend e frontend

**Sintoma:** o código compila, mas o hook `hasPermission()` nunca retorna `true` para a nova permissão.

**Causa:** a string do código no frontend está diferente da string no backend.

**Como detectar:**
```typescript
// Backend (permission-codes.ts da API):
INVOICES: { ACCESS: 'finance.invoices.access' as const }

// Frontend (permission-codes.ts do APP) — ERRADO:
INVOICES: perm('finance', 'invoice', 'access')  // 'invoice' sem 's'
// Gera: 'finance.invoice.access'  ← diverge do backend
```

**Solução:** sempre copiar a string exata do backend ao escrever o frontend. A função `perm('module', 'resource', ...actions)` gera `module.resource.action` — verificar que o recurso bate exatamente.

---

### 8.4 Código hardcoded em vez de usar a constante

**Sintoma:** TypeScript não alerta sobre o código inválido. Refatorações no nome do código não propagam.

**Causa:** string literal usada diretamente em vez de referenciar a constante.

```typescript
// Errado — string hardcoded
createPermissionMiddleware({ permissionCode: 'stock.products.register' })

// Correto — usando a constante
import { PermissionCodes } from '@/constants/rbac';
createPermissionMiddleware({ permissionCode: PermissionCodes.STOCK.PRODUCTS.REGISTER })
```

No frontend:
```typescript
// Errado
hasPermission('stock.products.register')

// Correto
import PermissionCodes from '@/config/rbac/permission-codes';
hasPermission(PermissionCodes.STOCK.PRODUCTS.REGISTER)
```

---

### 8.5 `DEFAULT_USER_PERMISSIONS` não atualizado para nova permissão de sistema

**Sintoma:** a nova permissão não é concedida automaticamente a novos usuários comuns, mesmo sendo algo que todos deveriam ter.

**Causa:** permissões em `DEFAULT_USER_PERMISSIONS` são atribuídas automaticamente ao grupo User. Se uma permissão precisa estar disponível para qualquer usuário desde o início, ela deve ser incluída lá.

**Quando adicionar a `DEFAULT_USER_PERMISSIONS`:** apenas permissões que todos os usuários do sistema devem ter sem configuração manual — como acesso ao próprio perfil (`system.self.*`) ou ferramentas básicas de produtividade. Permissões de negócio (stock, finance, hr, sales) normalmente não pertencem aqui.

```typescript
// OpenSea-API/src/constants/rbac/permission-codes.ts
export const DEFAULT_USER_PERMISSIONS: string[] = [
  // ... existentes ...
  PermissionCodes.PRODUCTION.WORK_ORDERS.ACCESS,  // ← só se todos os usuários devem ter
];
```

---

## 9. Referência Rápida — Arquivos a Alterar

| Objetivo | Arquivos a alterar |
|---|---|
| Adicionar ação a recurso existente | Backend codes + Frontend codes + Matrix config `availableActions` + Controller + Migração |
| Adicionar novo recurso | Backend codes + Frontend codes + Matrix config (novo `resources` entry) + Controllers + Migração |
| Adicionar novo módulo | Backend codes + Frontend codes (nova const + export no agregado + tipo) + Matrix config (nova tab) + Migração |
| Remover permissão | Backend codes + Frontend codes + Matrix config `availableActions` + Remover uso em controllers + Migração |
| Renomear/mover permissão | Idem remoção + adição + verificar grupos customizados manualmente + Migração |
| Adicionar sub-recurso de tools (4 níveis) | Backend codes (objeto aninhado) + Frontend codes (`perm` com recurso composto) + Matrix config tab tools + Migração |
| Adicionar aos defaults do usuário | `DEFAULT_USER_PERMISSIONS` no backend codes + Migração |
| Verificar permissão no backend | `createPermissionMiddleware({ permissionCode: PermissionCodes.X.Y.Z })` em `preHandler` |
| Verificar permissão no frontend | `hasPermission(PermissionCodes.X.Y.Z)` via `usePermissions()` |

### Localização exata dos arquivos

| Arquivo | Caminho |
|---|---|
| Backend codes | `OpenSea-API/src/constants/rbac/permission-codes.ts` |
| Seed (ambiente novo) | `OpenSea-API/prisma/seed.ts` |
| Migração (produção) | `OpenSea-API/prisma/migrate-permissions.ts` |
| Frontend codes | `OpenSea-APP/src/config/rbac/permission-codes.ts` |
| Matrix config | `OpenSea-APP/src/app/(dashboard)/(modules)/admin/(entities)/permission-groups/src/config/permission-matrix-config.ts` |
| Hook de permissões | `OpenSea-APP/src/hooks/use-permissions.ts` |
| Middleware de permissão | `OpenSea-API/src/http/middlewares/rbac/verify-permission.ts` |
