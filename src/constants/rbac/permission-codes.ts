/**
 * Permission Codes Constants
 *
 * 238 códigos de permissão organizados por módulo → recurso → ação
 * Fornece autocomplete e type-safety ao trabalhar com permissões
 *
 * Formato: module.resource-kebab.action
 * Exemplo: 'stock.products.access', 'hr.employees.admin'
 */

export const PermissionCodes = {
  // ============================================================================
  // STOCK — Estoque e produtos
  // ============================================================================
  STOCK: {
    PRODUCTS: {
      ACCESS: 'stock.products.access' as const,
      REGISTER: 'stock.products.register' as const,
      MODIFY: 'stock.products.modify' as const,
      REMOVE: 'stock.products.remove' as const,
      IMPORT: 'stock.products.import' as const,
      EXPORT: 'stock.products.export' as const,
      PRINT: 'stock.products.print' as const,
      ADMIN: 'stock.products.admin' as const,
      ONLYSELF: 'stock.products.onlyself' as const,
    },
    VARIANTS: {
      ACCESS: 'stock.variants.access' as const,
      REGISTER: 'stock.variants.register' as const,
      MODIFY: 'stock.variants.modify' as const,
      REMOVE: 'stock.variants.remove' as const,
      IMPORT: 'stock.variants.import' as const,
      EXPORT: 'stock.variants.export' as const,
      PRINT: 'stock.variants.print' as const,
      ADMIN: 'stock.variants.admin' as const,
      ONLYSELF: 'stock.variants.onlyself' as const,
    },
    TEMPLATES: {
      ACCESS: 'stock.templates.access' as const,
      REGISTER: 'stock.templates.register' as const,
      MODIFY: 'stock.templates.modify' as const,
      REMOVE: 'stock.templates.remove' as const,
      IMPORT: 'stock.templates.import' as const,
    },
    CATEGORIES: {
      ACCESS: 'stock.categories.access' as const,
      REGISTER: 'stock.categories.register' as const,
      MODIFY: 'stock.categories.modify' as const,
      REMOVE: 'stock.categories.remove' as const,
      IMPORT: 'stock.categories.import' as const,
      EXPORT: 'stock.categories.export' as const,
    },
    MANUFACTURERS: {
      ACCESS: 'stock.manufacturers.access' as const,
      REGISTER: 'stock.manufacturers.register' as const,
      MODIFY: 'stock.manufacturers.modify' as const,
      REMOVE: 'stock.manufacturers.remove' as const,
      IMPORT: 'stock.manufacturers.import' as const,
      EXPORT: 'stock.manufacturers.export' as const,
    },
    ITEMS: {
      ACCESS: 'stock.items.access' as const,
      EXPORT: 'stock.items.export' as const,
      PRINT: 'stock.items.print' as const,
      ADMIN: 'stock.items.admin' as const,
      IMPORT: 'stock.items.import' as const,
    },
    PURCHASE_ORDERS: {
      ACCESS: 'stock.purchase-orders.access' as const,
      REGISTER: 'stock.purchase-orders.register' as const,
      MODIFY: 'stock.purchase-orders.modify' as const,
      REMOVE: 'stock.purchase-orders.remove' as const,
      EXPORT: 'stock.purchase-orders.export' as const,
      PRINT: 'stock.purchase-orders.print' as const,
      ADMIN: 'stock.purchase-orders.admin' as const,
      ONLYSELF: 'stock.purchase-orders.onlyself' as const,
    },
    VOLUMES: {
      ACCESS: 'stock.volumes.access' as const,
      REGISTER: 'stock.volumes.register' as const,
      MODIFY: 'stock.volumes.modify' as const,
      REMOVE: 'stock.volumes.remove' as const,
      EXPORT: 'stock.volumes.export' as const,
      PRINT: 'stock.volumes.print' as const,
      ADMIN: 'stock.volumes.admin' as const,
      ONLYSELF: 'stock.volumes.onlyself' as const,
    },
    WAREHOUSES: {
      ACCESS: 'stock.warehouses.access' as const,
      REGISTER: 'stock.warehouses.register' as const,
      MODIFY: 'stock.warehouses.modify' as const,
      REMOVE: 'stock.warehouses.remove' as const,
      ADMIN: 'stock.warehouses.admin' as const,
    },
    INVENTORY: {
      ACCESS: 'stock.inventory.access' as const,
      REGISTER: 'stock.inventory.register' as const,
      MODIFY: 'stock.inventory.modify' as const,
      REMOVE: 'stock.inventory.remove' as const,
      ADMIN: 'stock.inventory.admin' as const,
    },
  },

  // ============================================================================
  // FINANCE — Financeiro
  // ============================================================================
  FINANCE: {
    CATEGORIES: {
      ACCESS: 'finance.categories.access' as const,
      REGISTER: 'finance.categories.register' as const,
      MODIFY: 'finance.categories.modify' as const,
      REMOVE: 'finance.categories.remove' as const,
    },
    COST_CENTERS: {
      ACCESS: 'finance.cost-centers.access' as const,
      REGISTER: 'finance.cost-centers.register' as const,
      MODIFY: 'finance.cost-centers.modify' as const,
      REMOVE: 'finance.cost-centers.remove' as const,
    },
    BANK_ACCOUNTS: {
      ACCESS: 'finance.bank-accounts.access' as const,
      REGISTER: 'finance.bank-accounts.register' as const,
      MODIFY: 'finance.bank-accounts.modify' as const,
      REMOVE: 'finance.bank-accounts.remove' as const,
    },
    SUPPLIERS: {
      ACCESS: 'finance.suppliers.access' as const,
      REGISTER: 'finance.suppliers.register' as const,
      MODIFY: 'finance.suppliers.modify' as const,
      REMOVE: 'finance.suppliers.remove' as const,
      IMPORT: 'finance.suppliers.import' as const,
      EXPORT: 'finance.suppliers.export' as const,
    },
    CONTRACTS: {
      ACCESS: 'finance.contracts.access' as const,
      REGISTER: 'finance.contracts.register' as const,
      MODIFY: 'finance.contracts.modify' as const,
      REMOVE: 'finance.contracts.remove' as const,
      EXPORT: 'finance.contracts.export' as const,
      PRINT: 'finance.contracts.print' as const,
    },
    ENTRIES: {
      ACCESS: 'finance.entries.access' as const,
      REGISTER: 'finance.entries.register' as const,
      MODIFY: 'finance.entries.modify' as const,
      REMOVE: 'finance.entries.remove' as const,
      IMPORT: 'finance.entries.import' as const,
      EXPORT: 'finance.entries.export' as const,
      PRINT: 'finance.entries.print' as const,
      ADMIN: 'finance.entries.admin' as const,
      ONLYSELF: 'finance.entries.onlyself' as const,
    },
    CONSORTIA: {
      ACCESS: 'finance.consortia.access' as const,
      REGISTER: 'finance.consortia.register' as const,
      MODIFY: 'finance.consortia.modify' as const,
      REMOVE: 'finance.consortia.remove' as const,
      EXPORT: 'finance.consortia.export' as const,
      ADMIN: 'finance.consortia.admin' as const,
      ONLYSELF: 'finance.consortia.onlyself' as const,
    },
    LOANS: {
      ACCESS: 'finance.loans.access' as const,
      REGISTER: 'finance.loans.register' as const,
      MODIFY: 'finance.loans.modify' as const,
      REMOVE: 'finance.loans.remove' as const,
      EXPORT: 'finance.loans.export' as const,
      ADMIN: 'finance.loans.admin' as const,
      ONLYSELF: 'finance.loans.onlyself' as const,
    },
    RECURRING: {
      ACCESS: 'finance.recurring.access' as const,
      REGISTER: 'finance.recurring.register' as const,
      MODIFY: 'finance.recurring.modify' as const,
      ADMIN: 'finance.recurring.admin' as const,
      ONLYSELF: 'finance.recurring.onlyself' as const,
    },
  },

  // ============================================================================
  // HR — Recursos Humanos
  // ============================================================================
  HR: {
    POSITIONS: {
      ACCESS: 'hr.positions.access' as const,
      REGISTER: 'hr.positions.register' as const,
      MODIFY: 'hr.positions.modify' as const,
      REMOVE: 'hr.positions.remove' as const,
      IMPORT: 'hr.positions.import' as const,
    },
    DEPARTMENTS: {
      ACCESS: 'hr.departments.access' as const,
      REGISTER: 'hr.departments.register' as const,
      MODIFY: 'hr.departments.modify' as const,
      REMOVE: 'hr.departments.remove' as const,
      IMPORT: 'hr.departments.import' as const,
    },
    WORK_SCHEDULES: {
      ACCESS: 'hr.work-schedules.access' as const,
      REGISTER: 'hr.work-schedules.register' as const,
      MODIFY: 'hr.work-schedules.modify' as const,
      REMOVE: 'hr.work-schedules.remove' as const,
    },
    EMPLOYEES: {
      ACCESS: 'hr.employees.access' as const,
      REGISTER: 'hr.employees.register' as const,
      MODIFY: 'hr.employees.modify' as const,
      REMOVE: 'hr.employees.remove' as const,
      IMPORT: 'hr.employees.import' as const,
      EXPORT: 'hr.employees.export' as const,
      PRINT: 'hr.employees.print' as const,
      ADMIN: 'hr.employees.admin' as const,
      ONLYSELF: 'hr.employees.onlyself' as const,
    },
    VACATIONS: {
      ACCESS: 'hr.vacations.access' as const,
      REGISTER: 'hr.vacations.register' as const,
      MODIFY: 'hr.vacations.modify' as const,
      ADMIN: 'hr.vacations.admin' as const,
      ONLYSELF: 'hr.vacations.onlyself' as const,
    },
    ABSENCES: {
      ACCESS: 'hr.absences.access' as const,
      REGISTER: 'hr.absences.register' as const,
      MODIFY: 'hr.absences.modify' as const,
      REMOVE: 'hr.absences.remove' as const,
      ADMIN: 'hr.absences.admin' as const,
      ONLYSELF: 'hr.absences.onlyself' as const,
    },
    PAYROLL: {
      ACCESS: 'hr.payroll.access' as const,
      REGISTER: 'hr.payroll.register' as const,
      EXPORT: 'hr.payroll.export' as const,
      PRINT: 'hr.payroll.print' as const,
      ADMIN: 'hr.payroll.admin' as const,
    },
    TIME_CONTROL: {
      ACCESS: 'hr.time-control.access' as const,
      REGISTER: 'hr.time-control.register' as const,
      EXPORT: 'hr.time-control.export' as const,
      PRINT: 'hr.time-control.print' as const,
    },
  },

  // ============================================================================
  // SALES — Vendas
  // ============================================================================
  SALES: {
    CUSTOMERS: {
      ACCESS: 'sales.customers.access' as const,
      REGISTER: 'sales.customers.register' as const,
      MODIFY: 'sales.customers.modify' as const,
      REMOVE: 'sales.customers.remove' as const,
      IMPORT: 'sales.customers.import' as const,
      EXPORT: 'sales.customers.export' as const,
      ONLYSELF: 'sales.customers.onlyself' as const,
    },
    PROMOTIONS: {
      ACCESS: 'sales.promotions.access' as const,
      REGISTER: 'sales.promotions.register' as const,
      MODIFY: 'sales.promotions.modify' as const,
      REMOVE: 'sales.promotions.remove' as const,
    },
    ORDERS: {
      ACCESS: 'sales.orders.access' as const,
      REGISTER: 'sales.orders.register' as const,
      MODIFY: 'sales.orders.modify' as const,
      REMOVE: 'sales.orders.remove' as const,
      EXPORT: 'sales.orders.export' as const,
      PRINT: 'sales.orders.print' as const,
      ADMIN: 'sales.orders.admin' as const,
      ONLYSELF: 'sales.orders.onlyself' as const,
    },
    CONTACTS: {
      ACCESS: 'sales.contacts.access' as const,
      REGISTER: 'sales.contacts.register' as const,
      MODIFY: 'sales.contacts.modify' as const,
      REMOVE: 'sales.contacts.remove' as const,
      ADMIN: 'sales.contacts.admin' as const,
      ONLYSELF: 'sales.contacts.onlyself' as const,
    },
    PIPELINES: {
      ACCESS: 'sales.pipelines.access' as const,
      ADMIN: 'sales.pipelines.admin' as const,
    },
  },

  // ============================================================================
  // ADMIN — Administração do tenant
  // ============================================================================
  ADMIN: {
    USERS: {
      ACCESS: 'admin.users.access' as const,
      REGISTER: 'admin.users.register' as const,
      MODIFY: 'admin.users.modify' as const,
      REMOVE: 'admin.users.remove' as const,
      ADMIN: 'admin.users.admin' as const,
      IMPORT: 'admin.users.import' as const,
    },
    PERMISSION_GROUPS: {
      ACCESS: 'admin.permission-groups.access' as const,
      REGISTER: 'admin.permission-groups.register' as const,
      MODIFY: 'admin.permission-groups.modify' as const,
      REMOVE: 'admin.permission-groups.remove' as const,
      ADMIN: 'admin.permission-groups.admin' as const,
    },
    COMPANIES: {
      ACCESS: 'admin.companies.access' as const,
      REGISTER: 'admin.companies.register' as const,
      MODIFY: 'admin.companies.modify' as const,
      REMOVE: 'admin.companies.remove' as const,
      ADMIN: 'admin.companies.admin' as const,
      IMPORT: 'admin.companies.import' as const,
    },
    SESSIONS: {
      ACCESS: 'admin.sessions.access' as const,
      ADMIN: 'admin.sessions.admin' as const,
    },
    AUDIT: {
      ACCESS: 'admin.audit.access' as const,
      EXPORT: 'admin.audit.export' as const,
      ADMIN: 'admin.audit.admin' as const,
    },
  },

  // ============================================================================
  // TOOLS — Ferramentas de produtividade
  // ============================================================================
  TOOLS: {
    EMAIL: {
      ACCOUNTS: {
        ACCESS: 'tools.email.accounts.access' as const,
        REGISTER: 'tools.email.accounts.register' as const,
        MODIFY: 'tools.email.accounts.modify' as const,
        REMOVE: 'tools.email.accounts.remove' as const,
        ADMIN: 'tools.email.accounts.admin' as const,
        SHARE: 'tools.email.accounts.share' as const,
      },
      MESSAGES: {
        ACCESS: 'tools.email.messages.access' as const,
        REGISTER: 'tools.email.messages.register' as const,
        MODIFY: 'tools.email.messages.modify' as const,
        REMOVE: 'tools.email.messages.remove' as const,
        ONLYSELF: 'tools.email.messages.onlyself' as const,
      },
    },
    TASKS: {
      BOARDS: {
        ACCESS: 'tools.tasks.boards.access' as const,
        REGISTER: 'tools.tasks.boards.register' as const,
        MODIFY: 'tools.tasks.boards.modify' as const,
        REMOVE: 'tools.tasks.boards.remove' as const,
        SHARE: 'tools.tasks.boards.share' as const,
      },
      CARDS: {
        ACCESS: 'tools.tasks.cards.access' as const,
        REGISTER: 'tools.tasks.cards.register' as const,
        MODIFY: 'tools.tasks.cards.modify' as const,
        REMOVE: 'tools.tasks.cards.remove' as const,
        ADMIN: 'tools.tasks.cards.admin' as const,
        SHARE: 'tools.tasks.cards.share' as const,
        ONLYSELF: 'tools.tasks.cards.onlyself' as const,
      },
    },
    CALENDAR: {
      ACCESS: 'tools.calendar.access' as const,
      REGISTER: 'tools.calendar.register' as const,
      MODIFY: 'tools.calendar.modify' as const,
      REMOVE: 'tools.calendar.remove' as const,
      EXPORT: 'tools.calendar.export' as const,
      ADMIN: 'tools.calendar.admin' as const,
      SHARE: 'tools.calendar.share' as const,
      ONLYSELF: 'tools.calendar.onlyself' as const,
    },
    STORAGE: {
      FOLDERS: {
        ACCESS: 'tools.storage.folders.access' as const,
        REGISTER: 'tools.storage.folders.register' as const,
        MODIFY: 'tools.storage.folders.modify' as const,
        REMOVE: 'tools.storage.folders.remove' as const,
        ADMIN: 'tools.storage.folders.admin' as const,
        SHARE: 'tools.storage.folders.share' as const,
      },
      FILES: {
        ACCESS: 'tools.storage.files.access' as const,
        REGISTER: 'tools.storage.files.register' as const,
        MODIFY: 'tools.storage.files.modify' as const,
        REMOVE: 'tools.storage.files.remove' as const,
        ADMIN: 'tools.storage.files.admin' as const,
        SHARE: 'tools.storage.files.share' as const,
        ONLYSELF: 'tools.storage.files.onlyself' as const,
      },
    },
  },

  // ============================================================================
  // SYSTEM — Sistema e configurações
  // ============================================================================
  SYSTEM: {
    LABEL_TEMPLATES: {
      ACCESS: 'system.label-templates.access' as const,
      REGISTER: 'system.label-templates.register' as const,
      MODIFY: 'system.label-templates.modify' as const,
      REMOVE: 'system.label-templates.remove' as const,
    },
    NOTIFICATIONS: {
      ADMIN: 'system.notifications.admin' as const,
    },
    SELF: {
      ACCESS: 'system.self.access' as const,
      MODIFY: 'system.self.modify' as const,
      ADMIN: 'system.self.admin' as const,
    },
  },
} as const;

// =============================================================================
// DEFAULT_USER_PERMISSIONS — Permissões concedidas automaticamente a todo usuário
// =============================================================================
export const DEFAULT_USER_PERMISSIONS: string[] = [
  // system.self — acesso completo ao próprio perfil
  PermissionCodes.SYSTEM.SELF.ACCESS,
  PermissionCodes.SYSTEM.SELF.MODIFY,
  PermissionCodes.SYSTEM.SELF.ADMIN,

  // system.label-templates — apenas visualizar
  PermissionCodes.SYSTEM.LABEL_TEMPLATES.ACCESS,

  // tools.email.accounts — visualizar contas compartilhadas
  PermissionCodes.TOOLS.EMAIL.ACCOUNTS.ACCESS,

  // tools.email.messages — gerenciar próprios e-mails
  PermissionCodes.TOOLS.EMAIL.MESSAGES.ACCESS,
  PermissionCodes.TOOLS.EMAIL.MESSAGES.REGISTER,
  PermissionCodes.TOOLS.EMAIL.MESSAGES.MODIFY,
  PermissionCodes.TOOLS.EMAIL.MESSAGES.REMOVE,
  PermissionCodes.TOOLS.EMAIL.MESSAGES.ONLYSELF,

  // tools.tasks.boards — visualizar quadros
  PermissionCodes.TOOLS.TASKS.BOARDS.ACCESS,

  // tools.tasks.cards — gerenciar próprios cards
  PermissionCodes.TOOLS.TASKS.CARDS.ACCESS,
  PermissionCodes.TOOLS.TASKS.CARDS.REGISTER,
  PermissionCodes.TOOLS.TASKS.CARDS.MODIFY,
  PermissionCodes.TOOLS.TASKS.CARDS.REMOVE,
  PermissionCodes.TOOLS.TASKS.CARDS.ONLYSELF,

  // tools.calendar — gerenciar próprios eventos
  PermissionCodes.TOOLS.CALENDAR.ACCESS,
  PermissionCodes.TOOLS.CALENDAR.REGISTER,
  PermissionCodes.TOOLS.CALENDAR.MODIFY,
  PermissionCodes.TOOLS.CALENDAR.REMOVE,
  PermissionCodes.TOOLS.CALENDAR.ONLYSELF,

  // tools.storage.folders — navegação
  PermissionCodes.TOOLS.STORAGE.FOLDERS.ACCESS,

  // tools.storage.files — gerenciar próprios arquivos
  PermissionCodes.TOOLS.STORAGE.FILES.ACCESS,
  PermissionCodes.TOOLS.STORAGE.FILES.REGISTER,
  PermissionCodes.TOOLS.STORAGE.FILES.MODIFY,
  PermissionCodes.TOOLS.STORAGE.FILES.REMOVE,
  PermissionCodes.TOOLS.STORAGE.FILES.ONLYSELF,
];

// =============================================================================
// isValidPermissionCode — Validação de formato
// =============================================================================
export function isValidPermissionCode(code: string): boolean {
  const parts = code.split('.');
  return parts.length >= 3 && parts.length <= 4;
}
