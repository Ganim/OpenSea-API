# Guia de Permissões para Frontend

> **Versão:** 2.3.0
> **Última Atualização:** 2026-01-05

Este documento descreve todas as permissões disponíveis no sistema e como utilizá-las no frontend.

---

## Índice

1. [Conceitos Básicos](#conceitos-básicos)
2. [Formatos de Permissões](#formatos-de-permissões)
3. [Como Verificar Permissões](#como-verificar-permissões)
4. [Estrutura das Permissões](#estrutura-das-permissões)
5. [Permissões por Módulo](#permissões-por-módulo)
6. [Exemplos de Uso](#exemplos-de-uso)
7. [Permissões de Escopo (all/team)](#permissões-de-escopo-allteam)
8. [Permissões Self-Service](#permissões-self-service)
9. [API de Gerenciamento de Permissões](#api-de-gerenciamento-de-permissões)

---

## Conceitos Básicos

### Formatos de Permissões

O sistema suporta **quatro formatos** de códigos de permissão:

| Formato | Partes | Exemplo | Descrição |
|---------|--------|---------|-----------|
| `module` | 1 | `stock` | Acesso ao módulo/menu principal |
| `module.resource` | 2 | `stock.locations` | Acesso a submenu/recurso específico |
| `module.resource.action` | 3 | `stock.products.create` | Formato padrão para ações CRUD |
| `module.resource.action.scope` | 4 | `hr.employees.list.all` | Permissões com escopo de acesso |

### Exemplos por Formato

**1 parte (module) - Acesso ao Menu:**
```
stock                    - Acesso ao menu Stock
sales                    - Acesso ao menu Sales
hr                       - Acesso ao menu HR
```

**2 partes (module.resource) - Acesso ao Submenu:**
```
stock.locations          - Acesso ao submenu Locations
stock.volumes            - Acesso ao submenu Volumes
stock.zones              - Acesso ao submenu Zones
stock.purchase-orders    - Acesso ao submenu Purchase Orders
```

**3 partes (module.resource.action) - Ações CRUD:**
```
stock.products.create    - Criar produtos
core.users.delete        - Excluir usuários
sales.orders.cancel      - Cancelar pedidos
```

**4 partes (module.resource.action.scope) - Ações com Escopo:**
```
hr.employees.list.all    - Listar TODOS os funcionários
hr.employees.list.team   - Listar funcionários da SUA EQUIPE
hr.absences.approve.all  - Aprovar ausências de qualquer funcionário
hr.absences.approve.team - Aprovar ausências apenas da sua equipe
```

### Tipos de Ações Comuns

| Ação | Descrição |
|------|-----------|
| `create` | Criar novo registro |
| `read` | Visualizar um registro específico |
| `update` | Atualizar registro existente |
| `delete` | Excluir registro |
| `list` | Listar registros |
| `manage` | Acesso completo (inclui todas as ações acima) |
| `approve` | Aprovar solicitações/registros |
| `cancel` | Cancelar registros |

### Escopos (para módulos HR)

| Escopo | Descrição |
|--------|-----------|
| `.all` | Acesso a todos os registros |
| `.team` | Acesso apenas aos registros do seu departamento |

---

## Como Verificar Permissões

### Endpoint para Obter Permissões do Usuário

```http
GET /v1/me/permissions
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "permissions": [
    {
      "code": "stock.products.create",
      "effect": "allow"
    },
    {
      "code": "hr.employees.list.all",
      "effect": "allow"
    }
  ]
}
```

### Exemplo de Implementação (React/TypeScript)

```typescript
// types/permissions.ts
export type PermissionCode = string;

export interface UserPermission {
  code: PermissionCode;
  effect: 'allow' | 'deny';
}

/**
 * Estrutura de uma permissão parseada
 * Suporta formatos:
 * - 1 parte: module (ex: stock) - acesso ao menu
 * - 2 partes: module.resource (ex: stock.locations) - acesso ao submenu
 * - 3 partes: module.resource.action (ex: stock.products.create)
 * - 4 partes: module.resource.action.scope (ex: hr.employees.list.all)
 */
export interface ParsedPermission {
  module: string;
  resource: string | null;  // null para formato de 1 parte
  action: string | null;    // null para formatos de 1 e 2 partes
  scope: string | null;     // null se não houver escopo
  raw: string;              // código original
}

/**
 * Faz o parse de um código de permissão
 */
export function parsePermissionCode(code: string): ParsedPermission {
  const parts = code.split('.');

  if (parts.length === 1) {
    // Formato: module (ex: stock) - acesso ao menu
    return {
      module: parts[0],
      resource: null,
      action: null,
      scope: null,
      raw: code,
    };
  }

  if (parts.length === 2) {
    // Formato: module.resource (ex: stock.locations) - acesso ao submenu
    return {
      module: parts[0],
      resource: parts[1],
      action: null,
      scope: null,
      raw: code,
    };
  }

  if (parts.length === 3) {
    // Formato: module.resource.action (ex: stock.products.create)
    return {
      module: parts[0],
      resource: parts[1],
      action: parts[2],
      scope: null,
      raw: code,
    };
  }

  if (parts.length === 4) {
    // Formato: module.resource.action.scope (ex: hr.employees.list.all)
    return {
      module: parts[0],
      resource: parts[1],
      action: parts[2],
      scope: parts[3],
      raw: code,
    };
  }

  throw new Error(`Invalid permission code format: ${code}`);
}

// hooks/usePermissions.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function usePermissions() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-permissions'],
    queryFn: async () => {
      const response = await api.get('/v1/me/permissions');
      return response.data.permissions as UserPermission[];
    },
  });

  const hasPermission = (code: PermissionCode): boolean => {
    if (!data) return false;
    const permission = data.find(p => p.code === code);
    return permission?.effect === 'allow';
  };

  const hasAnyPermission = (codes: PermissionCode[]): boolean => {
    return codes.some(code => hasPermission(code));
  };

  const hasAllPermissions = (codes: PermissionCode[]): boolean => {
    return codes.every(code => hasPermission(code));
  };

  // Para permissões com escopo (all/team) - formato de 4 partes
  const hasScopedPermission = (baseCode: string): 'all' | 'team' | null => {
    if (hasPermission(`${baseCode}.all`)) return 'all';
    if (hasPermission(`${baseCode}.team`)) return 'team';
    if (hasPermission(baseCode)) return 'all'; // fallback para permissão sem escopo
    return null;
  };

  // Verificar se tem permissão de gerenciamento (manage) para um recurso
  const hasManagePermission = (module: string, resource: string): boolean => {
    return hasPermission(`${module}.${resource}.manage`);
  };

  return {
    permissions: data ?? [],
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasScopedPermission,
    hasManagePermission,
  };
}

// Componente de proteção
interface PermissionGateProps {
  permission: PermissionCode | PermissionCode[];
  mode?: 'any' | 'all';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  mode = 'any',
  fallback = null,
  children
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  if (isLoading) return null;

  const codes = Array.isArray(permission) ? permission : [permission];
  const hasAccess = mode === 'all'
    ? hasAllPermissions(codes)
    : hasAnyPermission(codes);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

### Uso nos Componentes

```tsx
// Esconder botão se não tiver permissão
<PermissionGate permission="stock.products.create">
  <Button onClick={handleCreateProduct}>Novo Produto</Button>
</PermissionGate>

// Múltiplas permissões (qualquer uma)
<PermissionGate permission={['stock.products.update', 'stock.products.manage']}>
  <Button onClick={handleEdit}>Editar</Button>
</PermissionGate>

// Múltiplas permissões (todas necessárias)
<PermissionGate
  permission={['hr.employees.read', 'hr.employees.update']}
  mode="all"
>
  <EmployeeEditForm />
</PermissionGate>
```

---

## Estrutura das Permissões

### Constantes para TypeScript

```typescript
// constants/permissions.ts
export const PermissionCodes = {
  // ========== CORE ==========
  CORE: {
    USERS: {
      CREATE: 'core.users.create',
      READ: 'core.users.read',
      UPDATE: 'core.users.update',
      DELETE: 'core.users.delete',
      LIST: 'core.users.list',
      MANAGE: 'core.users.manage',
    },
    SESSIONS: {
      READ: 'core.sessions.read',
      LIST: 'core.sessions.list',
      REVOKE: 'core.sessions.revoke',
      REVOKE_ALL: 'core.sessions.revoke-all',
    },
  },

  // ========== STOCK ==========
  STOCK: {
    PRODUCTS: {
      CREATE: 'stock.products.create',
      READ: 'stock.products.read',
      UPDATE: 'stock.products.update',
      DELETE: 'stock.products.delete',
      LIST: 'stock.products.list',
      MANAGE: 'stock.products.manage',
    },
    VARIANTS: {
      CREATE: 'stock.variants.create',
      READ: 'stock.variants.read',
      UPDATE: 'stock.variants.update',
      DELETE: 'stock.variants.delete',
      LIST: 'stock.variants.list',
      MANAGE: 'stock.variants.manage',
    },
    ITEMS: {
      CREATE: 'stock.items.create',
      READ: 'stock.items.read',
      UPDATE: 'stock.items.update',
      DELETE: 'stock.items.delete',
      LIST: 'stock.items.list',
      ENTRY: 'stock.items.entry',
      EXIT: 'stock.items.exit',
      TRANSFER: 'stock.items.transfer',
      MANAGE: 'stock.items.manage',
    },
    CATEGORIES: {
      CREATE: 'stock.categories.create',
      READ: 'stock.categories.read',
      UPDATE: 'stock.categories.update',
      DELETE: 'stock.categories.delete',
      LIST: 'stock.categories.list',
      MANAGE: 'stock.categories.manage',
    },
    SUPPLIERS: {
      CREATE: 'stock.suppliers.create',
      READ: 'stock.suppliers.read',
      UPDATE: 'stock.suppliers.update',
      DELETE: 'stock.suppliers.delete',
      LIST: 'stock.suppliers.list',
      MANAGE: 'stock.suppliers.manage',
    },
    MANUFACTURERS: {
      CREATE: 'stock.manufacturers.create',
      READ: 'stock.manufacturers.read',
      UPDATE: 'stock.manufacturers.update',
      DELETE: 'stock.manufacturers.delete',
      LIST: 'stock.manufacturers.list',
      MANAGE: 'stock.manufacturers.manage',
    },
    WAREHOUSES: {
      CREATE: 'stock.warehouses.create',
      READ: 'stock.warehouses.read',
      UPDATE: 'stock.warehouses.update',
      DELETE: 'stock.warehouses.delete',
      LIST: 'stock.warehouses.list',
      MANAGE: 'stock.warehouses.manage',
    },
    ZONES: {
      CREATE: 'stock.zones.create',
      READ: 'stock.zones.read',
      UPDATE: 'stock.zones.update',
      DELETE: 'stock.zones.delete',
      LIST: 'stock.zones.list',
      CONFIGURE: 'stock.zones.configure',
      MANAGE: 'stock.zones.manage',
    },
    BINS: {
      READ: 'stock.bins.read',
      UPDATE: 'stock.bins.update',
      LIST: 'stock.bins.list',
      SEARCH: 'stock.bins.search',
      MANAGE: 'stock.bins.manage',
    },
    TAGS: {
      CREATE: 'stock.tags.create',
      READ: 'stock.tags.read',
      UPDATE: 'stock.tags.update',
      DELETE: 'stock.tags.delete',
      LIST: 'stock.tags.list',
      MANAGE: 'stock.tags.manage',
    },
    TEMPLATES: {
      CREATE: 'stock.templates.create',
      READ: 'stock.templates.read',
      UPDATE: 'stock.templates.update',
      DELETE: 'stock.templates.delete',
      LIST: 'stock.templates.list',
      MANAGE: 'stock.templates.manage',
    },
    PURCHASE_ORDERS: {
      CREATE: 'stock.purchase-orders.create',
      READ: 'stock.purchase-orders.read',
      UPDATE: 'stock.purchase-orders.update',
      DELETE: 'stock.purchase-orders.delete',
      LIST: 'stock.purchase-orders.list',
      APPROVE: 'stock.purchase-orders.approve',
      CANCEL: 'stock.purchase-orders.cancel',
      MANAGE: 'stock.purchase-orders.manage',
    },
    MOVEMENTS: {
      CREATE: 'stock.movements.create',
      READ: 'stock.movements.read',
      LIST: 'stock.movements.list',
      APPROVE: 'stock.movements.approve',
    },
    CARE: {
      READ: 'stock.care.read',
      LIST: 'stock.care.list',
      SET: 'stock.care.set',
    },
  },

  // ========== SALES ==========
  SALES: {
    CUSTOMERS: {
      CREATE: 'sales.customers.create',
      READ: 'sales.customers.read',
      UPDATE: 'sales.customers.update',
      DELETE: 'sales.customers.delete',
      LIST: 'sales.customers.list',
      MANAGE: 'sales.customers.manage',
    },
    ORDERS: {
      CREATE: 'sales.orders.create',
      READ: 'sales.orders.read',
      UPDATE: 'sales.orders.update',
      DELETE: 'sales.orders.delete',
      LIST: 'sales.orders.list',
      CANCEL: 'sales.orders.cancel',
      APPROVE: 'sales.orders.approve',
      MANAGE: 'sales.orders.manage',
    },
    PROMOTIONS: {
      CREATE: 'sales.promotions.create',
      READ: 'sales.promotions.read',
      UPDATE: 'sales.promotions.update',
      DELETE: 'sales.promotions.delete',
      LIST: 'sales.promotions.list',
      MANAGE: 'sales.promotions.manage',
    },
    RESERVATIONS: {
      CREATE: 'sales.reservations.create',
      READ: 'sales.reservations.read',
      UPDATE: 'sales.reservations.update',
      DELETE: 'sales.reservations.delete',
      LIST: 'sales.reservations.list',
      RELEASE: 'sales.reservations.release',
      MANAGE: 'sales.reservations.manage',
    },
    COMMENTS: {
      CREATE: 'sales.comments.create',
      READ: 'sales.comments.read',
      UPDATE: 'sales.comments.update',
      DELETE: 'sales.comments.delete',
      LIST: 'sales.comments.list',
    },
  },

  // ========== HR (com escopo all/team) ==========
  HR: {
    COMPANIES: {
      CREATE: 'hr.companies.create',
      READ: 'hr.companies.read',
      UPDATE: 'hr.companies.update',
      DELETE: 'hr.companies.delete',
      LIST: 'hr.companies.list',
      MANAGE: 'hr.companies.manage',
    },
    EMPLOYEES: {
      CREATE: 'hr.employees.create',
      READ: 'hr.employees.read',
      READ_ALL: 'hr.employees.read.all',
      READ_TEAM: 'hr.employees.read.team',
      UPDATE: 'hr.employees.update',
      UPDATE_ALL: 'hr.employees.update.all',
      UPDATE_TEAM: 'hr.employees.update.team',
      DELETE: 'hr.employees.delete',
      LIST: 'hr.employees.list',
      LIST_ALL: 'hr.employees.list.all',
      LIST_TEAM: 'hr.employees.list.team',
      TERMINATE: 'hr.employees.terminate',
      MANAGE: 'hr.employees.manage',
    },
    DEPARTMENTS: {
      CREATE: 'hr.departments.create',
      READ: 'hr.departments.read',
      UPDATE: 'hr.departments.update',
      DELETE: 'hr.departments.delete',
      LIST: 'hr.departments.list',
      MANAGE: 'hr.departments.manage',
    },
    POSITIONS: {
      CREATE: 'hr.positions.create',
      READ: 'hr.positions.read',
      UPDATE: 'hr.positions.update',
      DELETE: 'hr.positions.delete',
      LIST: 'hr.positions.list',
      MANAGE: 'hr.positions.manage',
    },
    ABSENCES: {
      CREATE: 'hr.absences.create',
      READ: 'hr.absences.read',
      READ_ALL: 'hr.absences.read.all',
      READ_TEAM: 'hr.absences.read.team',
      UPDATE: 'hr.absences.update',
      DELETE: 'hr.absences.delete',
      LIST: 'hr.absences.list',
      LIST_ALL: 'hr.absences.list.all',
      LIST_TEAM: 'hr.absences.list.team',
      APPROVE: 'hr.absences.approve',
      APPROVE_ALL: 'hr.absences.approve.all',
      APPROVE_TEAM: 'hr.absences.approve.team',
      MANAGE: 'hr.absences.manage',
    },
    VACATIONS: {
      CREATE: 'hr.vacations.create',
      READ: 'hr.vacations.read',
      READ_ALL: 'hr.vacations.read.all',
      READ_TEAM: 'hr.vacations.read.team',
      UPDATE: 'hr.vacations.update',
      DELETE: 'hr.vacations.delete',
      LIST: 'hr.vacations.list',
      LIST_ALL: 'hr.vacations.list.all',
      LIST_TEAM: 'hr.vacations.list.team',
      APPROVE: 'hr.vacations.approve',
      APPROVE_ALL: 'hr.vacations.approve.all',
      APPROVE_TEAM: 'hr.vacations.approve.team',
      MANAGE: 'hr.vacations.manage',
    },
    OVERTIME: {
      CREATE: 'hr.overtime.create',
      READ: 'hr.overtime.read',
      READ_ALL: 'hr.overtime.read.all',
      READ_TEAM: 'hr.overtime.read.team',
      UPDATE: 'hr.overtime.update',
      DELETE: 'hr.overtime.delete',
      LIST: 'hr.overtime.list',
      LIST_ALL: 'hr.overtime.list.all',
      LIST_TEAM: 'hr.overtime.list.team',
      APPROVE: 'hr.overtime.approve',
      APPROVE_ALL: 'hr.overtime.approve.all',
      APPROVE_TEAM: 'hr.overtime.approve.team',
      MANAGE: 'hr.overtime.manage',
    },
    TIME_BANK: {
      CREATE: 'hr.time-bank.create',
      READ: 'hr.time-bank.read',
      READ_ALL: 'hr.time-bank.read.all',
      READ_TEAM: 'hr.time-bank.read.team',
      UPDATE: 'hr.time-bank.update',
      DELETE: 'hr.time-bank.delete',
      LIST: 'hr.time-bank.list',
      LIST_ALL: 'hr.time-bank.list.all',
      LIST_TEAM: 'hr.time-bank.list.team',
      MANAGE: 'hr.time-bank.manage',
    },
    TIME_ENTRIES: {
      CREATE: 'hr.time-entries.create',
      READ: 'hr.time-entries.read',
      READ_ALL: 'hr.time-entries.read.all',
      READ_TEAM: 'hr.time-entries.read.team',
      UPDATE: 'hr.time-entries.update',
      UPDATE_ALL: 'hr.time-entries.update.all',
      UPDATE_TEAM: 'hr.time-entries.update.team',
      DELETE: 'hr.time-entries.delete',
      LIST: 'hr.time-entries.list',
      LIST_ALL: 'hr.time-entries.list.all',
      LIST_TEAM: 'hr.time-entries.list.team',
      APPROVE_ALL: 'hr.time-entries.approve.all',
      APPROVE_TEAM: 'hr.time-entries.approve.team',
      MANAGE: 'hr.time-entries.manage',
    },
    PAYROLL: {
      CREATE: 'hr.payroll.create',
      READ: 'hr.payroll.read',
      UPDATE: 'hr.payroll.update',
      DELETE: 'hr.payroll.delete',
      LIST: 'hr.payroll.list',
      PROCESS: 'hr.payroll.process',
      MANAGE: 'hr.payroll.manage',
    },
    BONUSES: {
      CREATE: 'hr.bonuses.create',
      READ: 'hr.bonuses.read',
      UPDATE: 'hr.bonuses.update',
      DELETE: 'hr.bonuses.delete',
      LIST: 'hr.bonuses.list',
      MANAGE: 'hr.bonuses.manage',
    },
    DEDUCTIONS: {
      CREATE: 'hr.deductions.create',
      READ: 'hr.deductions.read',
      UPDATE: 'hr.deductions.update',
      DELETE: 'hr.deductions.delete',
      LIST: 'hr.deductions.list',
      MANAGE: 'hr.deductions.manage',
    },
    WORK_SCHEDULES: {
      CREATE: 'hr.work-schedules.create',
      READ: 'hr.work-schedules.read',
      UPDATE: 'hr.work-schedules.update',
      DELETE: 'hr.work-schedules.delete',
      LIST: 'hr.work-schedules.list',
      MANAGE: 'hr.work-schedules.manage',
    },
    COMPANY_ADDRESSES: {
      CREATE: 'hr.company-addresses.create',
      READ: 'hr.company-addresses.read',
      UPDATE: 'hr.company-addresses.update',
      DELETE: 'hr.company-addresses.delete',
      LIST: 'hr.company-addresses.list',
      MANAGE: 'hr.company-addresses.manage',
    },
    COMPANY_FISCAL_SETTINGS: {
      CREATE: 'hr.company-fiscal-settings.create',
      READ: 'hr.company-fiscal-settings.read',
      UPDATE: 'hr.company-fiscal-settings.update',
      DELETE: 'hr.company-fiscal-settings.delete',
      LIST: 'hr.company-fiscal-settings.list',
      MANAGE: 'hr.company-fiscal-settings.manage',
    },
    COMPANY_STAKEHOLDER: {
      CREATE: 'hr.company-stakeholder.create',
      READ: 'hr.company-stakeholder.read',
      UPDATE: 'hr.company-stakeholder.update',
      DELETE: 'hr.company-stakeholder.delete',
      LIST: 'hr.company-stakeholder.list',
      MANAGE: 'hr.company-stakeholder.manage',
    },
  },

  // ========== RBAC ==========
  RBAC: {
    PERMISSIONS: {
      CREATE: 'rbac.permissions.create',
      READ: 'rbac.permissions.read',
      UPDATE: 'rbac.permissions.update',
      DELETE: 'rbac.permissions.delete',
      LIST: 'rbac.permissions.list',
    },
    GROUPS: {
      CREATE: 'rbac.groups.create',
      READ: 'rbac.groups.read',
      UPDATE: 'rbac.groups.update',
      DELETE: 'rbac.groups.delete',
      LIST: 'rbac.groups.list',
      MANAGE: 'rbac.groups.manage',
    },
    ASSOCIATIONS: {
      CREATE: 'rbac.associations.create',
      READ: 'rbac.associations.read',
      UPDATE: 'rbac.associations.update',
      DELETE: 'rbac.associations.delete',
      LIST: 'rbac.associations.list',
      MANAGE: 'rbac.associations.manage',
    },
    USER_GROUPS: {
      CREATE: 'rbac.user-groups.create',
      READ: 'rbac.user-groups.read',
      UPDATE: 'rbac.user-groups.update',
      DELETE: 'rbac.user-groups.delete',
      LIST: 'rbac.user-groups.list',
      MANAGE: 'rbac.user-groups.manage',
    },
    USER_PERMISSIONS: {
      CREATE: 'rbac.user-permissions.create',
      READ: 'rbac.user-permissions.read',
      UPDATE: 'rbac.user-permissions.update',
      DELETE: 'rbac.user-permissions.delete',
      LIST: 'rbac.user-permissions.list',
      MANAGE: 'rbac.user-permissions.manage',
    },
  },

  // ========== REQUESTS ==========
  REQUESTS: {
    REQUESTS: {
      ASSIGN: 'requests.requests.assign',
      COMPLETE: 'requests.requests.complete',
      REJECT: 'requests.requests.reject',
    },
  },

  // ========== AUDIT ==========
  AUDIT: {
    LOGS: {
      VIEW: 'audit.logs.view',
      SEARCH: 'audit.logs.search',
    },
    HISTORY: {
      VIEW: 'audit.history.view',
    },
    ROLLBACK: {
      PREVIEW: 'audit.rollback.preview',
      EXECUTE: 'audit.rollback.execute',
    },
    COMPARE: {
      VIEW: 'audit.compare.view',
    },
  },

  // ========== UI (Controle de Menus) ==========
  UI: {
    MENU: {
      DASHBOARD: 'ui.menu.dashboard',
      STOCK: 'ui.menu.stock',
      SALES: 'ui.menu.sales',
      HR: 'ui.menu.hr',
      FINANCE: 'ui.menu.finance',
      RBAC: 'ui.menu.rbac',
      AUDIT: 'ui.menu.audit',
      REPORTS: 'ui.menu.reports',
      SETTINGS: 'ui.menu.settings',
      REQUESTS: 'ui.menu.requests',
      NOTIFICATIONS: 'ui.menu.notifications',
    },
    DASHBOARD: {
      SALES_SUMMARY: 'ui.dashboard.sales-summary',
      STOCK_ALERTS: 'ui.dashboard.stock-alerts',
      HR_SUMMARY: 'ui.dashboard.hr-summary',
      FINANCIAL_SUMMARY: 'ui.dashboard.financial-summary',
      RECENT_ACTIVITY: 'ui.dashboard.recent-activity',
      PENDING_REQUESTS: 'ui.dashboard.pending-requests',
    },
  },

  // ========== REPORTS ==========
  REPORTS: {
    STOCK: {
      VIEW: 'reports.stock.view',
      GENERATE: 'reports.stock.generate',
      INVENTORY: 'reports.stock.inventory',
      MOVEMENTS: 'reports.stock.movements',
      LOW_STOCK: 'reports.stock.low-stock',
      VALUATION: 'reports.stock.valuation',
    },
    SALES: {
      VIEW: 'reports.sales.view',
      GENERATE: 'reports.sales.generate',
      DAILY: 'reports.sales.daily',
      MONTHLY: 'reports.sales.monthly',
      BY_CUSTOMER: 'reports.sales.by-customer',
      BY_PRODUCT: 'reports.sales.by-product',
      BY_SELLER: 'reports.sales.by-seller',
      COMMISSIONS: 'reports.sales.commissions',
    },
    HR: {
      VIEW: 'reports.hr.view',
      GENERATE: 'reports.hr.generate',
      HEADCOUNT: 'reports.hr.headcount',
      TURNOVER: 'reports.hr.turnover',
      ABSENCES: 'reports.hr.absences',
      VACATIONS: 'reports.hr.vacations',
      TIME_ENTRIES: 'reports.hr.time-entries',
      OVERTIME: 'reports.hr.overtime',
    },
    FINANCIAL: {
      PAYROLL: 'reports.financial.payroll',
      EXPENSES: 'reports.financial.expenses',
      REVENUE: 'reports.financial.revenue',
      CASHFLOW: 'reports.financial.cashflow',
    },
    AUDIT: {
      USER_ACTIVITY: 'reports.audit.user-activity',
      SECURITY: 'reports.audit.security',
    },
  },

  // ========== NOTIFICATIONS (Admin) ==========
  NOTIFICATIONS: {
    SEND: 'notifications.send',
    BROADCAST: 'notifications.broadcast',
    SCHEDULE: 'notifications.schedule',
    MANAGE: 'notifications.manage',
  },

  // ========== DATA (Import/Export) ==========
  DATA: {
    IMPORT: {
      PRODUCTS: 'data.import.products',
      VARIANTS: 'data.import.variants',
      CUSTOMERS: 'data.import.customers',
      SUPPLIERS: 'data.import.suppliers',
      EMPLOYEES: 'data.import.employees',
      CATEGORIES: 'data.import.categories',
      BULK: 'data.import.bulk',
    },
    EXPORT: {
      PRODUCTS: 'data.export.products',
      VARIANTS: 'data.export.variants',
      CUSTOMERS: 'data.export.customers',
      SUPPLIERS: 'data.export.suppliers',
      EMPLOYEES: 'data.export.employees',
      ORDERS: 'data.export.orders',
      MOVEMENTS: 'data.export.movements',
      REPORTS: 'data.export.reports',
      AUDIT: 'data.export.audit',
    },
    PRINT: {
      LABELS: 'data.print.labels',
      BARCODES: 'data.print.barcodes',
      RECEIPTS: 'data.print.receipts',
      INVOICES: 'data.print.invoices',
      REPORTS: 'data.print.reports',
      CONTRACTS: 'data.print.contracts',
      PAYSLIPS: 'data.print.payslips',
      BADGES: 'data.print.badges',
    },
  },

  // ========== SETTINGS ==========
  SETTINGS: {
    SYSTEM: {
      VIEW: 'settings.system.view',
    },
    COMPANY: {
      VIEW: 'settings.company.view',
    },
    INTEGRATIONS: {
      VIEW: 'settings.integrations.view',
    },
    NOTIFICATIONS: {
      VIEW: 'settings.notifications.view',
    },
    BACKUP: {
      VIEW: 'settings.backup.view',
      RESTORE: 'settings.backup.restore',
    },
  },
} as const;
```

---

## Permissões por Módulo

### CORE - Sistema Principal

| Permissão | Descrição |
|-----------|-----------|
| `core.users.create` | Criar novos usuários |
| `core.users.read` | Visualizar usuários |
| `core.users.update` | Atualizar usuários |
| `core.users.delete` | Excluir usuários |
| `core.users.list` | Listar usuários |
| `core.users.manage` | Gerenciamento completo de usuários |
| `core.sessions.read` | Ver sessões |
| `core.sessions.list` | Listar sessões |
| `core.sessions.revoke` | Revogar sessões |
| `core.sessions.revoke-all` | Revogar todas as sessões |

### STOCK - Estoque

| Permissão | Descrição |
|-----------|-----------|
| `stock.products.*` | Gerenciamento de produtos |
| `stock.variants.*` | Gerenciamento de variantes |
| `stock.items.*` | Gerenciamento de itens |
| `stock.items.entry` | Registrar entrada de itens |
| `stock.items.exit` | Registrar saída de itens |
| `stock.items.transfer` | Transferir itens entre locais |
| `stock.categories.*` | Gerenciamento de categorias |
| `stock.suppliers.*` | Gerenciamento de fornecedores |
| `stock.manufacturers.*` | Gerenciamento de fabricantes |
| `stock.warehouses.*` | Gerenciamento de armazéns |
| `stock.zones.*` | Gerenciamento de zonas |
| `stock.bins.*` | Gerenciamento de bins (posições) |
| `stock.tags.*` | Gerenciamento de tags |
| `stock.templates.*` | Gerenciamento de templates |
| `stock.purchase-orders.*` | Pedidos de compra |
| `stock.movements.*` | Movimentações de estoque |
| `stock.care.*` | Instruções de conservação |

### SALES - Vendas

| Permissão | Descrição |
|-----------|-----------|
| `sales.customers.*` | Gerenciamento de clientes |
| `sales.orders.*` | Gerenciamento de pedidos |
| `sales.orders.cancel` | Cancelar pedidos |
| `sales.orders.approve` | Aprovar pedidos |
| `sales.promotions.*` | Gerenciamento de promoções |
| `sales.reservations.*` | Gerenciamento de reservas |
| `sales.reservations.release` | Liberar reservas |
| `sales.comments.*` | Comentários em entidades |

### HR - Recursos Humanos

| Permissão | Descrição |
|-----------|-----------|
| `hr.companies.*` | Gerenciamento de empresas |
| `hr.employees.*` | Gerenciamento de funcionários |
| `hr.employees.*.all` | Acesso a todos os funcionários |
| `hr.employees.*.team` | Acesso apenas à equipe |
| `hr.employees.terminate` | Desligar funcionários |
| `hr.departments.*` | Gerenciamento de departamentos |
| `hr.positions.*` | Gerenciamento de cargos |
| `hr.absences.*` | Gerenciamento de ausências |
| `hr.vacations.*` | Gerenciamento de férias |
| `hr.overtime.*` | Gerenciamento de horas extras |
| `hr.time-bank.*` | Gerenciamento de banco de horas |
| `hr.time-entries.*` | Gerenciamento de registros de ponto |
| `hr.payroll.*` | Gerenciamento de folha de pagamento |
| `hr.bonuses.*` | Gerenciamento de bônus |
| `hr.deductions.*` | Gerenciamento de descontos |
| `hr.work-schedules.*` | Gerenciamento de escalas |

### RBAC - Controle de Acesso

| Permissão | Descrição |
|-----------|-----------|
| `rbac.permissions.*` | Gerenciamento de permissões |
| `rbac.groups.*` | Gerenciamento de grupos |
| `rbac.associations.*` | Associar permissões a grupos |
| `rbac.user-groups.*` | Associar usuários a grupos |
| `rbac.user-permissions.*` | Permissões diretas de usuários |

### UI - Interface

| Permissão | Descrição |
|-----------|-----------|
| `ui.menu.dashboard` | Ver menu Dashboard |
| `ui.menu.stock` | Ver menu Estoque |
| `ui.menu.sales` | Ver menu Vendas |
| `ui.menu.hr` | Ver menu RH |
| `ui.menu.rbac` | Ver menu RBAC |
| `ui.menu.audit` | Ver menu Auditoria |
| `ui.menu.reports` | Ver menu Relatórios |
| `ui.menu.settings` | Ver menu Configurações |
| `ui.dashboard.*` | Widgets do dashboard |

### NOTIFICATIONS - Notificações (formato especial: 2 partes)

> ⚠️ **Atenção:** Este módulo usa o formato de 2 partes (`module.action`) ao invés do padrão de 3 partes.

| Permissão | Descrição |
|-----------|-----------|
| `notifications.send` | Enviar notificações |
| `notifications.broadcast` | Enviar notificações em massa |
| `notifications.schedule` | Agendar notificações |
| `notifications.manage` | Gerenciamento completo de notificações |

```typescript
// Exemplo de uso
<PermissionGate permission="notifications.send">
  <Button onClick={handleSendNotification}>Enviar Notificação</Button>
</PermissionGate>

<PermissionGate permission="notifications.broadcast">
  <Button onClick={handleBroadcast}>Enviar para Todos</Button>
</PermissionGate>
```

---

## Permissões de Escopo (all/team)

Para módulos HR, existem permissões com escopo que determinam o alcance do acesso:

```typescript
// Verificar escopo do usuário
const { hasScopedPermission } = usePermissions();

const employeeScope = hasScopedPermission('hr.employees.list');
// Retorna: 'all' | 'team' | null

if (employeeScope === 'all') {
  // Usuário pode ver todos os funcionários
  fetchAllEmployees();
} else if (employeeScope === 'team') {
  // Usuário só pode ver funcionários do seu departamento
  fetchTeamEmployees();
} else {
  // Usuário não tem acesso
  showAccessDenied();
}
```

### Recursos com Escopo

| Recurso | Permissões de Escopo |
|---------|---------------------|
| `hr.employees` | `.list.all`, `.list.team`, `.read.all`, `.read.team`, `.update.all`, `.update.team` |
| `hr.absences` | `.list.all`, `.list.team`, `.read.all`, `.read.team`, `.approve.all`, `.approve.team` |
| `hr.vacations` | `.list.all`, `.list.team`, `.read.all`, `.read.team`, `.approve.all`, `.approve.team` |
| `hr.overtime` | `.list.all`, `.list.team`, `.read.all`, `.read.team`, `.approve.all`, `.approve.team` |
| `hr.time-bank` | `.list.all`, `.list.team`, `.read.all`, `.read.team` |
| `hr.time-entries` | `.list.all`, `.list.team`, `.read.all`, `.read.team`, `.update.all`, `.update.team`, `.approve.all`, `.approve.team` |

---

## Permissões Self-Service

Endpoints `/v1/me/*` são self-service e **NÃO precisam de permissão** - apenas autenticação (JWT válido).

### Endpoints Self-Service Disponíveis

| Endpoint | Descrição |
|----------|-----------|
| `GET /v1/me/profile` | Obter próprio perfil |
| `PATCH /v1/me/profile` | Atualizar próprio perfil |
| `GET /v1/me/permissions` | Listar próprias permissões |
| `GET /v1/me/groups` | Listar próprios grupos |
| `GET /v1/me/sessions` | Listar próprias sessões |
| `DELETE /v1/me/sessions/:id` | Revogar própria sessão |
| `GET /v1/me/audit-logs` | Ver próprio histórico de ações |
| `GET /v1/me/employee` | Ver dados de funcionário vinculado |
| `GET /v1/me/time-bank` | Ver próprio banco de horas |
| `GET /v1/me/absences` | Ver próprias ausências |
| `GET /v1/me/requests` | Ver próprias requisições |
| `GET /v1/me/notification-preferences` | Ver preferências de notificação |

---

## Exemplos de Uso

### Menu Lateral com Permissões

```tsx
function Sidebar() {
  const { hasPermission } = usePermissions();

  return (
    <nav>
      <PermissionGate permission="ui.menu.dashboard">
        <NavLink to="/dashboard">Dashboard</NavLink>
      </PermissionGate>

      <PermissionGate permission="ui.menu.stock">
        <NavGroup title="Estoque">
          <PermissionGate permission="stock.products.list">
            <NavLink to="/stock/products">Produtos</NavLink>
          </PermissionGate>
          <PermissionGate permission="stock.items.list">
            <NavLink to="/stock/items">Itens</NavLink>
          </PermissionGate>
          <PermissionGate permission="stock.warehouses.list">
            <NavLink to="/stock/warehouses">Armazéns</NavLink>
          </PermissionGate>
        </NavGroup>
      </PermissionGate>

      <PermissionGate permission="ui.menu.hr">
        <NavGroup title="RH">
          <PermissionGate permission={['hr.employees.list', 'hr.employees.list.all', 'hr.employees.list.team']}>
            <NavLink to="/hr/employees">Funcionários</NavLink>
          </PermissionGate>
          <PermissionGate permission="hr.departments.list">
            <NavLink to="/hr/departments">Departamentos</NavLink>
          </PermissionGate>
        </NavGroup>
      </PermissionGate>

      <PermissionGate permission="ui.menu.rbac">
        <NavGroup title="Acessos">
          <PermissionGate permission="rbac.groups.list">
            <NavLink to="/rbac/groups">Grupos</NavLink>
          </PermissionGate>
          <PermissionGate permission="core.users.list">
            <NavLink to="/rbac/users">Usuários</NavLink>
          </PermissionGate>
        </NavGroup>
      </PermissionGate>
    </nav>
  );
}
```

### Tabela com Ações Condicionais

```tsx
function ProductsTable({ products }) {
  const { hasPermission } = usePermissions();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map(product => (
          <TableRow key={product.id}>
            <TableCell>{product.name}</TableCell>
            <TableCell>{product.sku}</TableCell>
            <TableCell>
              <PermissionGate permission="stock.products.read">
                <Button variant="ghost" onClick={() => viewProduct(product.id)}>
                  Ver
                </Button>
              </PermissionGate>

              <PermissionGate permission="stock.products.update">
                <Button variant="ghost" onClick={() => editProduct(product.id)}>
                  Editar
                </Button>
              </PermissionGate>

              <PermissionGate permission="stock.products.delete">
                <Button variant="destructive" onClick={() => deleteProduct(product.id)}>
                  Excluir
                </Button>
              </PermissionGate>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Proteção de Rotas

```tsx
// ProtectedRoute.tsx
function ProtectedRoute({
  permission,
  children
}: {
  permission: string | string[];
  children: React.ReactNode
}) {
  const { hasPermission, hasAnyPermission, isLoading } = usePermissions();
  const navigate = useNavigate();

  const codes = Array.isArray(permission) ? permission : [permission];
  const hasAccess = hasAnyPermission(codes);

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      navigate('/403');
    }
  }, [isLoading, hasAccess, navigate]);

  if (isLoading) return <LoadingSpinner />;
  if (!hasAccess) return null;

  return <>{children}</>;
}

// Uso no Router
<Routes>
  <Route path="/stock/products" element={
    <ProtectedRoute permission="stock.products.list">
      <ProductsPage />
    </ProtectedRoute>
  } />

  <Route path="/hr/employees" element={
    <ProtectedRoute permission={['hr.employees.list', 'hr.employees.list.all', 'hr.employees.list.team']}>
      <EmployeesPage />
    </ProtectedRoute>
  } />
</Routes>
```

---

## Dúvidas Frequentes

### 1. Qual a diferença entre `manage` e as outras ações?

A permissão `manage` concede acesso completo ao recurso, equivalente a ter todas as outras permissões (create, read, update, delete, list, etc).

### 2. Preciso verificar permissão para endpoints `/me/*`?

Não. Endpoints self-service (`/v1/me/*`) requerem apenas autenticação válida.

### 3. Como lidar com permissões de escopo (all/team)?

Use a função `hasScopedPermission` para determinar o escopo e ajuste a UI ou chamadas de API conforme necessário.

### 4. E se o usuário não tiver nenhuma permissão?

Usuários sem permissões específicas ainda podem acessar seus próprios dados via endpoints `/me/*`.

### 5. Por que existem diferentes formatos de permissões (1, 2, 3 e 4 partes)?

Os formatos atendem a diferentes necessidades:

| Formato | Quando Usar | Exemplo |
|---------|-------------|---------|
| **1 parte** | Acesso ao menu/módulo principal | `stock` |
| **2 partes** | Acesso a submenu/recurso específico | `stock.locations` |
| **3 partes** | Ações CRUD em recursos específicos | `stock.products.create` |
| **4 partes** | Ações com restrição de escopo (departamento/equipe) | `hr.employees.list.all` |

### 6. Como identificar o formato de uma permissão?

```typescript
function getPermissionFormat(code: string): '1-part' | '2-parts' | '3-parts' | '4-parts' {
  const parts = code.split('.');
  if (parts.length === 1) return '1-part';
  if (parts.length === 2) return '2-parts';
  if (parts.length === 3) return '3-parts';
  if (parts.length === 4) return '4-parts';
  throw new Error(`Invalid permission format: ${code}`);
}

// Uso
getPermissionFormat('stock');                     // '1-part'
getPermissionFormat('stock.locations');           // '2-parts'
getPermissionFormat('stock.products.create');     // '3-parts'
getPermissionFormat('hr.employees.list.all');     // '4-parts'
```

### 7. Qual é a lista de permissões de 1 e 2 partes (menus)?

**Permissões de 1 parte (módulos):**
- `stock` - Menu Stock
- `sales` - Menu Sales
- `hr` - Menu HR
- `core` - Menu Core
- `rbac` - Menu RBAC

**Permissões de 2 partes (submenus):**
- `stock.locations` - Submenu Locations
- `stock.volumes` - Submenu Volumes
- `stock.zones` - Submenu Zones
- `stock.purchase-orders` - Submenu Purchase Orders
- *(outros conforme necessário)*

### 8. Como verificar permissões de diferentes formatos de forma unificada?

A função `hasPermission` do hook `usePermissions` funciona com qualquer formato:

```typescript
const { hasPermission } = usePermissions();

// Funciona com todos os formatos:
hasPermission('stock');                        // 1 parte ✓
hasPermission('stock.locations');              // 2 partes ✓
hasPermission('stock.products.create');        // 3 partes ✓
hasPermission('hr.employees.list.all');        // 4 partes ✓
```

### 9. Como usar permissões para controlar menus no frontend?

```tsx
// Menu principal
<PermissionGate permission="stock">
  <NavLink to="/stock">Stock</NavLink>
</PermissionGate>

// Submenus
<PermissionGate permission="stock">
  <NavGroup title="Stock">
    <PermissionGate permission="stock.locations">
      <NavLink to="/stock/locations">Locations</NavLink>
    </PermissionGate>
    <PermissionGate permission="stock.volumes">
      <NavLink to="/stock/volumes">Volumes</NavLink>
    </PermissionGate>
    <PermissionGate permission="stock.zones">
      <NavLink to="/stock/zones">Zones</NavLink>
    </PermissionGate>
  </NavGroup>
</PermissionGate>
```

---

## API de Gerenciamento de Permissões

### Adicionar Permissões a um Grupo (Bulk)

> **IMPORTANTE:** Use este endpoint ao invés de adicionar permissões uma a uma. É muito mais eficiente e evita rate limiting.

```http
POST /v1/rbac/permission-groups/:groupId/permissions/bulk
Authorization: Bearer {token}
Content-Type: application/json
```

**Requisição:**
```json
{
  "permissions": [
    { "permissionCode": "stock", "effect": "allow" },
    { "permissionCode": "stock.products", "effect": "allow" },
    { "permissionCode": "stock.products.create", "effect": "allow" },
    { "permissionCode": "stock.products.read", "effect": "allow" },
    { "permissionCode": "stock.products.update", "effect": "allow" },
    { "permissionCode": "stock.products.delete", "effect": "allow" },
    { "permissionCode": "hr.employees.list.all", "effect": "allow" }
  ]
}
```

**Resposta (201):**
```json
{
  "success": true,
  "added": 7,
  "skipped": 0,
  "errors": []
}
```

**Campos da resposta:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `success` | boolean | Sempre `true` se a requisição foi processada |
| `added` | number | Quantidade de permissões adicionadas com sucesso |
| `skipped` | number | Quantidade de permissões ignoradas (já existiam no grupo) |
| `errors` | array | Lista de erros para permissões que falharam |

**Exemplo de resposta com erros parciais:**
```json
{
  "success": true,
  "added": 5,
  "skipped": 1,
  "errors": [
    { "code": "invalid.permission.code", "reason": "Permission not found" }
  ]
}
```

### Limites

- **Máximo por requisição:** 500 permissões
- **Mínimo:** 1 permissão

### Exemplo de Uso no Frontend

```typescript
// services/rbac.ts
export async function addPermissionsToGroup(
  groupId: string,
  permissionCodes: string[]
): Promise<{ added: number; skipped: number; errors: Array<{ code: string; reason: string }> }> {
  const response = await api.post(
    `/v1/rbac/permission-groups/${groupId}/permissions/bulk`,
    {
      permissions: permissionCodes.map(code => ({
        permissionCode: code,
        effect: 'allow'
      }))
    }
  );
  return response.data;
}

// Uso
const result = await addPermissionsToGroup('group-uuid', [
  'stock',
  'stock.products',
  'stock.products.create',
  'stock.products.read',
  'stock.products.update',
  'stock.products.delete',
]);

console.log(`Adicionadas: ${result.added}, Ignoradas: ${result.skipped}`);
if (result.errors.length > 0) {
  console.warn('Erros:', result.errors);
}
```

### Endpoint Legado (Uma Permissão por Vez)

> ⚠️ **Não recomendado** para adicionar múltiplas permissões. Use o endpoint bulk acima.

```http
POST /v1/rbac/permission-groups/:groupId/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "permissionCode": "stock.products.create",
  "effect": "allow"
}
```

---

## Contato

Para dúvidas sobre permissões, entre em contato com a equipe de backend.
