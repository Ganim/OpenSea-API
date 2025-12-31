/**
 * Permission Codes Constants
 *
 * Códigos de permissão organizados por módulo, baseado em permissions.json
 * Fornece autocomplete e type-safety ao trabalhar com permissões
 *
 * Formato: module.resource.action
 * Exemplo: 'core.users.create', 'stock.products.read'
 */

export const PermissionCodes = {
  /**
   * CORE - Sistema principal (usuários, sessões, perfis)
   */
  CORE: {
    USERS: {
      CREATE: 'core.users.create' as const,
      READ: 'core.users.read' as const,
      UPDATE: 'core.users.update' as const,
      DELETE: 'core.users.delete' as const,
      LIST: 'core.users.list' as const,
      MANAGE: 'core.users.manage' as const,
    },
    SESSIONS: {
      READ: 'core.sessions.read' as const,
      DELETE: 'core.sessions.delete' as const,
      LIST: 'core.sessions.list' as const,
    },
    PROFILES: {
      READ: 'core.profiles.read' as const,
      UPDATE: 'core.profiles.update' as const,
    },
  },

  /**
   * STOCK - Gestão de estoque
   */
  STOCK: {
    PRODUCTS: {
      CREATE: 'stock.products.create' as const,
      READ: 'stock.products.read' as const,
      UPDATE: 'stock.products.update' as const,
      DELETE: 'stock.products.delete' as const,
      LIST: 'stock.products.list' as const,
      REQUEST: 'stock.products.request' as const,
      APPROVE: 'stock.products.approve' as const,
      MANAGE: 'stock.products.manage' as const,
    },
    VARIANTS: {
      CREATE: 'stock.variants.create' as const,
      READ: 'stock.variants.read' as const,
      UPDATE: 'stock.variants.update' as const,
      DELETE: 'stock.variants.delete' as const,
      LIST: 'stock.variants.list' as const,
      REQUEST: 'stock.variants.request' as const,
      APPROVE: 'stock.variants.approve' as const,
      MANAGE: 'stock.variants.manage' as const,
    },
    ITEMS: {
      CREATE: 'stock.items.create' as const,
      READ: 'stock.items.read' as const,
      UPDATE: 'stock.items.update' as const,
      DELETE: 'stock.items.delete' as const,
      LIST: 'stock.items.list' as const,
      REQUEST: 'stock.items.request' as const,
      APPROVE: 'stock.items.approve' as const,
      MANAGE: 'stock.items.manage' as const,
    },
    MOVEMENTS: {
      CREATE: 'stock.movements.create' as const,
      READ: 'stock.movements.read' as const,
      LIST: 'stock.movements.list' as const,
      APPROVE: 'stock.movements.approve' as const,
    },
    SUPPLIERS: {
      CREATE: 'stock.suppliers.create' as const,
      READ: 'stock.suppliers.read' as const,
      UPDATE: 'stock.suppliers.update' as const,
      DELETE: 'stock.suppliers.delete' as const,
      LIST: 'stock.suppliers.list' as const,
      MANAGE: 'stock.suppliers.manage' as const,
    },
    MANUFACTURERS: {
      CREATE: 'stock.manufacturers.create' as const,
      READ: 'stock.manufacturers.read' as const,
      UPDATE: 'stock.manufacturers.update' as const,
      DELETE: 'stock.manufacturers.delete' as const,
      LIST: 'stock.manufacturers.list' as const,
      MANAGE: 'stock.manufacturers.manage' as const,
    },
    LOCATIONS: {
      CREATE: 'stock.locations.create' as const,
      READ: 'stock.locations.read' as const,
      UPDATE: 'stock.locations.update' as const,
      DELETE: 'stock.locations.delete' as const,
      LIST: 'stock.locations.list' as const,
      MANAGE: 'stock.locations.manage' as const,
    },
    CATEGORIES: {
      CREATE: 'stock.categories.create' as const,
      READ: 'stock.categories.read' as const,
      UPDATE: 'stock.categories.update' as const,
      DELETE: 'stock.categories.delete' as const,
      LIST: 'stock.categories.list' as const,
      MANAGE: 'stock.categories.manage' as const,
    },
    TAGS: {
      CREATE: 'stock.tags.create' as const,
      READ: 'stock.tags.read' as const,
      UPDATE: 'stock.tags.update' as const,
      DELETE: 'stock.tags.delete' as const,
      LIST: 'stock.tags.list' as const,
      MANAGE: 'stock.tags.manage' as const,
    },
    TEMPLATES: {
      CREATE: 'stock.templates.create' as const,
      READ: 'stock.templates.read' as const,
      UPDATE: 'stock.templates.update' as const,
      DELETE: 'stock.templates.delete' as const,
      LIST: 'stock.templates.list' as const,
      MANAGE: 'stock.templates.manage' as const,
    },
    PURCHASE_ORDERS: {
      CREATE: 'stock.purchase-orders.create' as const,
      READ: 'stock.purchase-orders.read' as const,
      UPDATE: 'stock.purchase-orders.update' as const,
      DELETE: 'stock.purchase-orders.delete' as const,
      LIST: 'stock.purchase-orders.list' as const,
      APPROVE: 'stock.purchase-orders.approve' as const,
      MANAGE: 'stock.purchase-orders.manage' as const,
    },
  },

  /**
   * SALES - Gestão de vendas
   */
  SALES: {
    CUSTOMERS: {
      CREATE: 'sales.customers.create' as const,
      READ: 'sales.customers.read' as const,
      UPDATE: 'sales.customers.update' as const,
      DELETE: 'sales.customers.delete' as const,
      LIST: 'sales.customers.list' as const,
      MANAGE: 'sales.customers.manage' as const,
    },
    ORDERS: {
      CREATE: 'sales.orders.create' as const,
      READ: 'sales.orders.read' as const,
      UPDATE: 'sales.orders.update' as const,
      DELETE: 'sales.orders.delete' as const,
      LIST: 'sales.orders.list' as const,
      APPROVE: 'sales.orders.approve' as const,
      MANAGE: 'sales.orders.manage' as const,
    },
    PROMOTIONS: {
      CREATE: 'sales.promotions.create' as const,
      READ: 'sales.promotions.read' as const,
      UPDATE: 'sales.promotions.update' as const,
      DELETE: 'sales.promotions.delete' as const,
      LIST: 'sales.promotions.list' as const,
      MANAGE: 'sales.promotions.manage' as const,
    },
    RESERVATIONS: {
      CREATE: 'sales.reservations.create' as const,
      READ: 'sales.reservations.read' as const,
      UPDATE: 'sales.reservations.update' as const,
      DELETE: 'sales.reservations.delete' as const,
      LIST: 'sales.reservations.list' as const,
      MANAGE: 'sales.reservations.manage' as const,
    },
    COMMENTS: {
      CREATE: 'sales.comments.create' as const,
      READ: 'sales.comments.read' as const,
      UPDATE: 'sales.comments.update' as const,
      DELETE: 'sales.comments.delete' as const,
      LIST: 'sales.comments.list' as const,
    },
    NOTIFICATIONS: {
      READ: 'sales.notifications.read' as const,
      UPDATE: 'sales.notifications.update' as const,
      DELETE: 'sales.notifications.delete' as const,
      LIST: 'sales.notifications.list' as const,
    },
  },

  /**
   * RBAC - Controle de acesso baseado em roles/permissões
   */
  RBAC: {
    PERMISSIONS: {
      CREATE: 'rbac.permissions.create' as const,
      READ: 'rbac.permissions.read' as const,
      UPDATE: 'rbac.permissions.update' as const,
      DELETE: 'rbac.permissions.delete' as const,
      LIST: 'rbac.permissions.list' as const,
      MANAGE: 'rbac.permissions.manage' as const,
    },
    GROUPS: {
      CREATE: 'rbac.groups.create' as const,
      READ: 'rbac.groups.read' as const,
      UPDATE: 'rbac.groups.update' as const,
      DELETE: 'rbac.groups.delete' as const,
      LIST: 'rbac.groups.list' as const,
      MANAGE: 'rbac.groups.manage' as const,
    },
    ASSIGNMENTS: {
      CREATE: 'rbac.assignments.create' as const,
      READ: 'rbac.assignments.read' as const,
      UPDATE: 'rbac.assignments.update' as const,
      DELETE: 'rbac.assignments.delete' as const,
      LIST: 'rbac.assignments.list' as const,
      MANAGE: 'rbac.assignments.manage' as const,
    },
    ASSOCIATIONS: {
      CREATE: 'rbac.associations.create' as const,
      READ: 'rbac.associations.read' as const,
      UPDATE: 'rbac.associations.update' as const,
      DELETE: 'rbac.associations.delete' as const,
      LIST: 'rbac.associations.list' as const,
      MANAGE: 'rbac.associations.manage' as const,
    },
    USER_GROUPS: {
      CREATE: 'rbac.user-groups.create' as const,
      READ: 'rbac.user-groups.read' as const,
      UPDATE: 'rbac.user-groups.update' as const,
      DELETE: 'rbac.user-groups.delete' as const,
      LIST: 'rbac.user-groups.list' as const,
      MANAGE: 'rbac.user-groups.manage' as const,
    },
    USER_PERMISSIONS: {
      CREATE: 'rbac.user-permissions.create' as const,
      READ: 'rbac.user-permissions.read' as const,
      UPDATE: 'rbac.user-permissions.update' as const,
      DELETE: 'rbac.user-permissions.delete' as const,
      LIST: 'rbac.user-permissions.list' as const,
      MANAGE: 'rbac.user-permissions.manage' as const,
    },
  },

  /**
   * AUDIT - Auditoria e logs
   */
  AUDIT: {
    LOGS: {
      VIEW: 'audit.logs.view' as const,
      LIST: 'audit.logs.list' as const,
    },
    HISTORY: {
      VIEW: 'audit.history.view' as const,
    },
    ROLLBACK: {
      PREVIEW: 'audit.rollback.preview' as const,
      EXECUTE: 'audit.rollback.execute' as const,
    },
    COMPARE: {
      VIEW: 'audit.compare.view' as const,
    },
  },

  /**
   * REQUESTS - Sistema de requisições/workflow
   */
  REQUESTS: {
    REQUESTS: {
      CREATE: 'requests.requests.create' as const,
      READ: 'requests.requests.read' as const,
      UPDATE: 'requests.requests.update' as const,
      DELETE: 'requests.requests.delete' as const,
      LIST: 'requests.requests.list' as const,
      APPROVE: 'requests.requests.approve' as const,
      REJECT: 'requests.requests.reject' as const,
      MANAGE: 'requests.requests.manage' as const,
    },
    COMMENTS: {
      CREATE: 'requests.comments.create' as const,
      READ: 'requests.comments.read' as const,
      UPDATE: 'requests.comments.update' as const,
      DELETE: 'requests.comments.delete' as const,
      LIST: 'requests.comments.list' as const,
    },
    ATTACHMENTS: {
      CREATE: 'requests.attachments.create' as const,
      READ: 'requests.attachments.read' as const,
      DELETE: 'requests.attachments.delete' as const,
      LIST: 'requests.attachments.list' as const,
    },
  },

  /**
   * HR - Recursos Humanos
   */
  HR: {
    COMPANIES: {
      CREATE: 'hr.companies.create' as const,
      READ: 'hr.companies.read' as const,
      UPDATE: 'hr.companies.update' as const,
      DELETE: 'hr.companies.delete' as const,
      LIST: 'hr.companies.list' as const,
      MANAGE: 'hr.companies.manage' as const,
    },
    EMPLOYEES: {
      CREATE: 'hr.employees.create' as const,
      READ: 'hr.employees.read' as const,
      UPDATE: 'hr.employees.update' as const,
      DELETE: 'hr.employees.delete' as const,
      LIST: 'hr.employees.list' as const,
      MANAGE: 'hr.employees.manage' as const,
    },
    DEPARTMENTS: {
      CREATE: 'hr.departments.create' as const,
      READ: 'hr.departments.read' as const,
      UPDATE: 'hr.departments.update' as const,
      DELETE: 'hr.departments.delete' as const,
      LIST: 'hr.departments.list' as const,
      MANAGE: 'hr.departments.manage' as const,
    },
    POSITIONS: {
      CREATE: 'hr.positions.create' as const,
      READ: 'hr.positions.read' as const,
      UPDATE: 'hr.positions.update' as const,
      DELETE: 'hr.positions.delete' as const,
      LIST: 'hr.positions.list' as const,
      MANAGE: 'hr.positions.manage' as const,
    },
    ABSENCES: {
      CREATE: 'hr.absences.create' as const,
      READ: 'hr.absences.read' as const,
      UPDATE: 'hr.absences.update' as const,
      DELETE: 'hr.absences.delete' as const,
      LIST: 'hr.absences.list' as const,
      APPROVE: 'hr.absences.approve' as const,
      MANAGE: 'hr.absences.manage' as const,
    },
    VACATIONS: {
      CREATE: 'hr.vacations.create' as const,
      READ: 'hr.vacations.read' as const,
      UPDATE: 'hr.vacations.update' as const,
      DELETE: 'hr.vacations.delete' as const,
      LIST: 'hr.vacations.list' as const,
      APPROVE: 'hr.vacations.approve' as const,
      MANAGE: 'hr.vacations.manage' as const,
    },
    TIME_ENTRIES: {
      CREATE: 'hr.time-entries.create' as const,
      READ: 'hr.time-entries.read' as const,
      UPDATE: 'hr.time-entries.update' as const,
      DELETE: 'hr.time-entries.delete' as const,
      LIST: 'hr.time-entries.list' as const,
      MANAGE: 'hr.time-entries.manage' as const,
    },
    OVERTIME: {
      CREATE: 'hr.overtime.create' as const,
      READ: 'hr.overtime.read' as const,
      UPDATE: 'hr.overtime.update' as const,
      DELETE: 'hr.overtime.delete' as const,
      LIST: 'hr.overtime.list' as const,
      APPROVE: 'hr.overtime.approve' as const,
      MANAGE: 'hr.overtime.manage' as const,
    },
    PAYROLL: {
      CREATE: 'hr.payroll.create' as const,
      READ: 'hr.payroll.read' as const,
      UPDATE: 'hr.payroll.update' as const,
      DELETE: 'hr.payroll.delete' as const,
      LIST: 'hr.payroll.list' as const,
      PROCESS: 'hr.payroll.process' as const,
      MANAGE: 'hr.payroll.manage' as const,
    },
    BONUSES: {
      CREATE: 'hr.bonuses.create' as const,
      READ: 'hr.bonuses.read' as const,
      UPDATE: 'hr.bonuses.update' as const,
      DELETE: 'hr.bonuses.delete' as const,
      LIST: 'hr.bonuses.list' as const,
      MANAGE: 'hr.bonuses.manage' as const,
    },
    DEDUCTIONS: {
      CREATE: 'hr.deductions.create' as const,
      READ: 'hr.deductions.read' as const,
      UPDATE: 'hr.deductions.update' as const,
      DELETE: 'hr.deductions.delete' as const,
      LIST: 'hr.deductions.list' as const,
      MANAGE: 'hr.deductions.manage' as const,
    },
    FISCAL_SETTINGS: {
      CREATE: 'hr.fiscal-settings.create' as const,
      READ: 'hr.fiscal-settings.read' as const,
      UPDATE: 'hr.fiscal-settings.update' as const,
      DELETE: 'hr.fiscal-settings.delete' as const,
      MANAGE: 'hr.fiscal-settings.manage' as const,
    },
    STAKEHOLDERS: {
      CREATE: 'hr.stakeholders.create' as const,
      READ: 'hr.stakeholders.read' as const,
      UPDATE: 'hr.stakeholders.update' as const,
      DELETE: 'hr.stakeholders.delete' as const,
      LIST: 'hr.stakeholders.list' as const,
      MANAGE: 'hr.stakeholders.manage' as const,
    },
    COMPANY_ADDRESSES: {
      CREATE: 'hr.company-addresses.create' as const,
      READ: 'hr.company-addresses.read' as const,
      UPDATE: 'hr.company-addresses.update' as const,
      DELETE: 'hr.company-addresses.delete' as const,
      LIST: 'hr.company-addresses.list' as const,
      MANAGE: 'hr.company-addresses.manage' as const,
    },
    COMPANY_CNAES: {
      CREATE: 'hr.company-cnaes.create' as const,
      READ: 'hr.company-cnaes.read' as const,
      UPDATE: 'hr.company-cnaes.update' as const,
      DELETE: 'hr.company-cnaes.delete' as const,
      LIST: 'hr.company-cnaes.list' as const,
      MANAGE: 'hr.company-cnaes.manage' as const,
    },
    COMPANY_FISCAL_SETTINGS: {
      CREATE: 'hr.company-fiscal-settings.create' as const,
      READ: 'hr.company-fiscal-settings.read' as const,
      UPDATE: 'hr.company-fiscal-settings.update' as const,
      DELETE: 'hr.company-fiscal-settings.delete' as const,
      LIST: 'hr.company-fiscal-settings.list' as const,
      MANAGE: 'hr.company-fiscal-settings.manage' as const,
    },
    COMPANY_STAKEHOLDER: {
      CREATE: 'hr.company-stakeholder.create' as const,
      READ: 'hr.company-stakeholder.read' as const,
      UPDATE: 'hr.company-stakeholder.update' as const,
      DELETE: 'hr.company-stakeholder.delete' as const,
      LIST: 'hr.company-stakeholder.list' as const,
      MANAGE: 'hr.company-stakeholder.manage' as const,
    },
    MANUFACTURERS: {
      CREATE: 'hr.manufacturers.create' as const,
      READ: 'hr.manufacturers.read' as const,
      UPDATE: 'hr.manufacturers.update' as const,
      DELETE: 'hr.manufacturers.delete' as const,
      LIST: 'hr.manufacturers.list' as const,
      MANAGE: 'hr.manufacturers.manage' as const,
    },
    PAYROLLS: {
      CREATE: 'hr.payrolls.create' as const,
      READ: 'hr.payrolls.read' as const,
      UPDATE: 'hr.payrolls.update' as const,
      DELETE: 'hr.payrolls.delete' as const,
      LIST: 'hr.payrolls.list' as const,
      MANAGE: 'hr.payrolls.manage' as const,
    },
    SUPPLIERS: {
      CREATE: 'hr.suppliers.create' as const,
      READ: 'hr.suppliers.read' as const,
      UPDATE: 'hr.suppliers.update' as const,
      DELETE: 'hr.suppliers.delete' as const,
      LIST: 'hr.suppliers.list' as const,
      MANAGE: 'hr.suppliers.manage' as const,
    },
    TIME_BANK: {
      CREATE: 'hr.time-bank.create' as const,
      READ: 'hr.time-bank.read' as const,
      UPDATE: 'hr.time-bank.update' as const,
      DELETE: 'hr.time-bank.delete' as const,
      LIST: 'hr.time-bank.list' as const,
      MANAGE: 'hr.time-bank.manage' as const,
    },
    TIME_CONTROL: {
      CREATE: 'hr.time-control.create' as const,
      READ: 'hr.time-control.read' as const,
      UPDATE: 'hr.time-control.update' as const,
      DELETE: 'hr.time-control.delete' as const,
      LIST: 'hr.time-control.list' as const,
      MANAGE: 'hr.time-control.manage' as const,
    },
    VACATION_PERIODS: {
      CREATE: 'hr.vacation-periods.create' as const,
      READ: 'hr.vacation-periods.read' as const,
      UPDATE: 'hr.vacation-periods.update' as const,
      DELETE: 'hr.vacation-periods.delete' as const,
      LIST: 'hr.vacation-periods.list' as const,
      MANAGE: 'hr.vacation-periods.manage' as const,
    },
    WORK_SCHEDULES: {
      CREATE: 'hr.work-schedules.create' as const,
      READ: 'hr.work-schedules.read' as const,
      UPDATE: 'hr.work-schedules.update' as const,
      DELETE: 'hr.work-schedules.delete' as const,
      LIST: 'hr.work-schedules.list' as const,
      MANAGE: 'hr.work-schedules.manage' as const,
    },
  },
} as const;

/**
 * Type helper para extrair todos os códigos de permissão
 * Fornece autocomplete ao usar permissões
 */
export type PermissionCode = string;

/**
 * Helper para validar se um string é um código de permissão válido
 */
export function isValidPermissionCode(code: string): boolean {
  // TODO: Implementar validação contra permissions.json ou banco
  return code.split('.').length === 3;
}
