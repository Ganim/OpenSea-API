/**
 * Constantes de Permissões para Frontend
 *
 * Gerado automaticamente a partir do backend
 * Versão: 2.2.0
 * Data: 2026-01-05
 *
 * FORMATOS SUPORTADOS:
 * - 1 parte: module (ex: stock) - acesso ao menu principal
 * - 2 partes: module.resource (ex: stock.locations) - acesso ao submenu
 * - 3 partes: module.resource.action (ex: stock.products.create)
 * - 4 partes: module.resource.action.scope (ex: hr.employees.list.all)
 *
 * Uso:
 *   import { PermissionCodes } from './permissions';
 *
 *   // Formato 1 parte (acesso ao menu)
 *   if (hasPermission(PermissionCodes.MENUS.STOCK)) {
 *     // mostrar menu Stock
 *   }
 *
 *   // Formato 2 partes (acesso ao submenu)
 *   if (hasPermission(PermissionCodes.SUBMENUS.STOCK.LOCATIONS)) {
 *     // mostrar submenu Locations
 *   }
 *
 *   // Formato 3 partes (ações CRUD)
 *   if (hasPermission(PermissionCodes.STOCK.PRODUCTS.CREATE)) {
 *     // mostrar botão de criar
 *   }
 *
 *   // Formato 4 partes (com escopo)
 *   if (hasPermission(PermissionCodes.HR.EMPLOYEES.LIST_ALL)) {
 *     // listar todos os funcionários
 *   } else if (hasPermission(PermissionCodes.HR.EMPLOYEES.LIST_TEAM)) {
 *     // listar apenas funcionários da equipe
 *   }
 */

export const PermissionCodes = {
  // ============================================================================
  // CORE - Sistema Principal
  // ============================================================================
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
      DELETE: 'core.sessions.delete',
      LIST: 'core.sessions.list',
      REVOKE: 'core.sessions.revoke',
      REVOKE_ALL: 'core.sessions.revoke-all',
    },
    PROFILES: {
      READ: 'core.profiles.read',
      UPDATE: 'core.profiles.update',
    },
  },

  // ============================================================================
  // STOCK - Estoque
  // ============================================================================
  STOCK: {
    PRODUCTS: {
      CREATE: 'stock.products.create',
      READ: 'stock.products.read',
      UPDATE: 'stock.products.update',
      DELETE: 'stock.products.delete',
      LIST: 'stock.products.list',
      REQUEST: 'stock.products.request',
      APPROVE: 'stock.products.approve',
      MANAGE: 'stock.products.manage',
    },
    VARIANTS: {
      CREATE: 'stock.variants.create',
      READ: 'stock.variants.read',
      UPDATE: 'stock.variants.update',
      DELETE: 'stock.variants.delete',
      LIST: 'stock.variants.list',
      REQUEST: 'stock.variants.request',
      APPROVE: 'stock.variants.approve',
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
      REQUEST: 'stock.items.request',
      APPROVE: 'stock.items.approve',
      MANAGE: 'stock.items.manage',
    },
    MOVEMENTS: {
      CREATE: 'stock.movements.create',
      READ: 'stock.movements.read',
      LIST: 'stock.movements.list',
      APPROVE: 'stock.movements.approve',
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
    CATEGORIES: {
      CREATE: 'stock.categories.create',
      READ: 'stock.categories.read',
      UPDATE: 'stock.categories.update',
      DELETE: 'stock.categories.delete',
      LIST: 'stock.categories.list',
      MANAGE: 'stock.categories.manage',
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
    CARE: {
      READ: 'stock.care.read',
      LIST: 'stock.care.list',
      SET: 'stock.care.set',
    },
    LOCATIONS: {
      CREATE: 'stock.locations.create',
      READ: 'stock.locations.read',
      UPDATE: 'stock.locations.update',
      DELETE: 'stock.locations.delete',
      LIST: 'stock.locations.list',
      MANAGE: 'stock.locations.manage',
    },
  },

  // ============================================================================
  // SALES - Vendas
  // ============================================================================
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
      REQUEST: 'sales.orders.request',
      APPROVE: 'sales.orders.approve',
      CANCEL: 'sales.orders.cancel',
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
      MANAGE: 'sales.comments.manage',
    },
    NOTIFICATIONS: {
      CREATE: 'sales.notifications.create',
      READ: 'sales.notifications.read',
      UPDATE: 'sales.notifications.update',
      DELETE: 'sales.notifications.delete',
      LIST: 'sales.notifications.list',
    },
  },

  // ============================================================================
  // REQUESTS - Requisições
  // ============================================================================
  REQUESTS: {
    REQUESTS: {
      ASSIGN: 'requests.requests.assign',
      COMPLETE: 'requests.requests.complete',
      REJECT: 'requests.requests.reject',
    },
  },

  // ============================================================================
  // RBAC - Controle de Acesso
  // ============================================================================
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
      ASSIGN: 'rbac.groups.assign',
      MANAGE: 'rbac.groups.manage',
    },
    AUDIT: {
      READ: 'rbac.audit.read',
      LIST: 'rbac.audit.list',
    },
    ASSIGNMENTS: {
      CREATE: 'rbac.assignments.create',
      READ: 'rbac.assignments.read',
      UPDATE: 'rbac.assignments.update',
      DELETE: 'rbac.assignments.delete',
      LIST: 'rbac.assignments.list',
      MANAGE: 'rbac.assignments.manage',
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

  // ============================================================================
  // AUDIT - Auditoria
  // ============================================================================
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

  // ============================================================================
  // HR - Recursos Humanos
  // ============================================================================
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
    PAYROLLS: {
      CREATE: 'hr.payrolls.create',
      READ: 'hr.payrolls.read',
      UPDATE: 'hr.payrolls.update',
      DELETE: 'hr.payrolls.delete',
      LIST: 'hr.payrolls.list',
      MANAGE: 'hr.payrolls.manage',
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
    VACATION_PERIODS: {
      CREATE: 'hr.vacation-periods.create',
      READ: 'hr.vacation-periods.read',
      UPDATE: 'hr.vacation-periods.update',
      DELETE: 'hr.vacation-periods.delete',
      LIST: 'hr.vacation-periods.list',
      MANAGE: 'hr.vacation-periods.manage',
    },
    FISCAL_SETTINGS: {
      CREATE: 'hr.fiscal-settings.create',
      READ: 'hr.fiscal-settings.read',
      UPDATE: 'hr.fiscal-settings.update',
      DELETE: 'hr.fiscal-settings.delete',
      MANAGE: 'hr.fiscal-settings.manage',
    },
    STAKEHOLDERS: {
      CREATE: 'hr.stakeholders.create',
      READ: 'hr.stakeholders.read',
      UPDATE: 'hr.stakeholders.update',
      DELETE: 'hr.stakeholders.delete',
      LIST: 'hr.stakeholders.list',
      MANAGE: 'hr.stakeholders.manage',
    },
    COMPANY_ADDRESSES: {
      CREATE: 'hr.company-addresses.create',
      READ: 'hr.company-addresses.read',
      UPDATE: 'hr.company-addresses.update',
      DELETE: 'hr.company-addresses.delete',
      LIST: 'hr.company-addresses.list',
      MANAGE: 'hr.company-addresses.manage',
    },
    COMPANY_CNAES: {
      CREATE: 'hr.company-cnaes.create',
      READ: 'hr.company-cnaes.read',
      UPDATE: 'hr.company-cnaes.update',
      DELETE: 'hr.company-cnaes.delete',
      LIST: 'hr.company-cnaes.list',
      MANAGE: 'hr.company-cnaes.manage',
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
    MANUFACTURERS: {
      CREATE: 'hr.manufacturers.create',
      READ: 'hr.manufacturers.read',
      UPDATE: 'hr.manufacturers.update',
      DELETE: 'hr.manufacturers.delete',
      LIST: 'hr.manufacturers.list',
      MANAGE: 'hr.manufacturers.manage',
    },
    SUPPLIERS: {
      CREATE: 'hr.suppliers.create',
      READ: 'hr.suppliers.read',
      UPDATE: 'hr.suppliers.update',
      DELETE: 'hr.suppliers.delete',
      LIST: 'hr.suppliers.list',
      MANAGE: 'hr.suppliers.manage',
    },
    TIME_CONTROL: {
      CREATE: 'hr.time-control.create',
      READ: 'hr.time-control.read',
      UPDATE: 'hr.time-control.update',
      DELETE: 'hr.time-control.delete',
      LIST: 'hr.time-control.list',
      MANAGE: 'hr.time-control.manage',
    },
  },

  // ============================================================================
  // SELF - Self-Service (Próprio Usuário)
  // ============================================================================
  SELF: {
    PROFILE: {
      READ: 'self.profile.read',
      UPDATE: 'self.profile.update',
      UPDATE_EMAIL: 'self.profile.update-email',
      UPDATE_PASSWORD: 'self.profile.update-password',
      UPDATE_USERNAME: 'self.profile.update-username',
      DELETE: 'self.profile.delete',
    },
    SESSIONS: {
      READ: 'self.sessions.read',
      LIST: 'self.sessions.list',
      REVOKE: 'self.sessions.revoke',
    },
    PERMISSIONS: {
      READ: 'self.permissions.read',
      LIST: 'self.permissions.list',
    },
    GROUPS: {
      READ: 'self.groups.read',
      LIST: 'self.groups.list',
    },
    AUDIT: {
      READ: 'self.audit.read',
      LIST: 'self.audit.list',
    },
    EMPLOYEE: {
      READ: 'self.employee.read',
    },
    TIME_ENTRIES: {
      READ: 'self.time-entries.read',
      LIST: 'self.time-entries.list',
      CREATE: 'self.time-entries.create',
    },
    SCHEDULE: {
      READ: 'self.schedule.read',
    },
    TIME_BANK: {
      READ: 'self.time-bank.read',
      LIST: 'self.time-bank.list',
    },
    VACATIONS: {
      READ: 'self.vacations.read',
      LIST: 'self.vacations.list',
      REQUEST: 'self.vacations.request',
      CANCEL: 'self.vacations.cancel',
    },
    ABSENCES: {
      READ: 'self.absences.read',
      LIST: 'self.absences.list',
      REQUEST: 'self.absences.request',
      CANCEL: 'self.absences.cancel',
    },
    PAYSLIPS: {
      READ: 'self.payslips.read',
      LIST: 'self.payslips.list',
      DOWNLOAD: 'self.payslips.download',
    },
    OVERTIME: {
      READ: 'self.overtime.read',
      LIST: 'self.overtime.list',
      REQUEST: 'self.overtime.request',
    },
    REQUESTS: {
      READ: 'self.requests.read',
      LIST: 'self.requests.list',
      CREATE: 'self.requests.create',
      CANCEL: 'self.requests.cancel',
      COMMENT: 'self.requests.comment',
    },
  },

  // ============================================================================
  // NOTIFICATIONS - Notificações (Admin)
  // ============================================================================
  NOTIFICATIONS: {
    SEND: 'notifications.send',
    BROADCAST: 'notifications.broadcast',
    SCHEDULE: 'notifications.schedule',
    MANAGE: 'notifications.manage',
  },

  // ============================================================================
  // SETTINGS - Configurações
  // ============================================================================
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

  // ============================================================================
  // REPORTS - Relatórios
  // ============================================================================
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

  // ============================================================================
  // DATA - Importação/Exportação
  // ============================================================================
  DATA: {
    IMPORT: {
      PRODUCTS: 'data.import.products',
      VARIANTS: 'data.import.variants',
      CUSTOMERS: 'data.import.customers',
      SUPPLIERS: 'data.import.suppliers',
      EMPLOYEES: 'data.import.employees',
      CATEGORIES: 'data.import.categories',
      BULK: 'data.import.bulk',
      STOCK: 'data.import.stock',
      SALES: 'data.import.sales',
      HR: 'data.import.hr',
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
      STOCK: 'data.export.stock',
      SALES: 'data.export.sales',
      HR: 'data.export.hr',
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
      DOCUMENTS: 'data.print.documents',
    },
  },

  // ============================================================================
  // UI - Interface (Menus e Dashboard)
  // ============================================================================
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
      // Submenus
      STOCK_LOCATIONS: 'ui.menu.stock.locations',
      STOCK_PURCHASE_ORDERS: 'ui.menu.stock.purchase-orders',
      STOCK_ZONES: 'ui.menu.stock.zones',
      SALES_ORDERS: 'ui.menu.sales.orders',
      HR_TIME_CONTROL: 'ui.menu.hr.time-control',
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
} as const;

// ============================================================================
// Tipos Auxiliares
// ============================================================================

export type PermissionCode = string;

export interface UserPermission {
  code: PermissionCode;
  effect: 'allow' | 'deny';
}

/**
 * Formato de permissão detectado
 */
export type PermissionFormat = '1-part' | '2-parts' | '3-parts' | '4-parts';

/**
 * Estrutura de uma permissão parseada
 */
export interface ParsedPermission {
  module: string;
  resource: string | null; // null para formato de 1 parte
  action: string | null; // null para formatos de 1 e 2 partes
  scope: string | null; // null se não houver escopo
  raw: string; // código original
  format: PermissionFormat;
}

// Helper para extrair todos os códigos de permissão
type DeepValues<T> = T extends object
  ? { [K in keyof T]: DeepValues<T[K]> }[keyof T]
  : T;

export type AllPermissionCodes = DeepValues<typeof PermissionCodes>;

// ============================================================================
// Funções Auxiliares
// ============================================================================

/**
 * Detecta o formato de uma permissão
 */
export function getPermissionFormat(code: string): PermissionFormat {
  const parts = code.split('.');
  if (parts.length === 1) return '1-part';
  if (parts.length === 2) return '2-parts';
  if (parts.length === 3) return '3-parts';
  if (parts.length === 4) return '4-parts';
  throw new Error(`Invalid permission format: ${code}. Expected 1-4 parts.`);
}

/**
 * Faz o parse de um código de permissão
 */
export function parsePermissionCode(code: string): ParsedPermission {
  const parts = code.split('.');
  const format = getPermissionFormat(code);

  if (parts.length === 1) {
    // Formato: module (ex: stock) - acesso ao menu
    return {
      module: parts[0],
      resource: null,
      action: null,
      scope: null,
      raw: code,
      format,
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
      format,
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
      format,
    };
  }

  // Formato: module.resource.action.scope (ex: hr.employees.list.all)
  return {
    module: parts[0],
    resource: parts[1],
    action: parts[2],
    scope: parts[3],
    raw: code,
    format,
  };
}

/**
 * Verifica se uma permissão é de escopo (termina com .all ou .team)
 */
export function isScopedPermission(code: string): boolean {
  return code.endsWith('.all') || code.endsWith('.team');
}

/**
 * Verifica se é uma permissão de menu (1 parte) ou submenu (2 partes)
 */
export function isMenuPermission(code: string): boolean {
  const format = getPermissionFormat(code);
  return format === '1-part' || format === '2-parts';
}

/**
 * Extrai o código base de uma permissão com escopo
 * Ex: 'hr.employees.list.all' -> 'hr.employees.list'
 */
export function getBasePermissionCode(code: string): string {
  if (code.endsWith('.all') || code.endsWith('.team')) {
    return code.replace(/\.(all|team)$/, '');
  }
  return code;
}

/**
 * Lista de módulos que suportam escopo (all/team)
 */
export const SCOPED_MODULES = ['hr'] as const;

/**
 * Lista de recursos com escopo dentro de HR
 */
export const HR_SCOPED_RESOURCES = [
  'employees',
  'absences',
  'vacations',
  'overtime',
  'time-bank',
  'time-entries',
] as const;

/**
 * Constantes para permissões de menu (1 parte)
 */
export const MENU_PERMISSIONS = {
  STOCK: 'stock',
  SALES: 'sales',
  HR: 'hr',
  CORE: 'core',
  RBAC: 'rbac',
  AUDIT: 'audit',
  REPORTS: 'reports',
} as const;

/**
 * Constantes para permissões de submenu (2 partes)
 */
export const SUBMENU_PERMISSIONS = {
  STOCK: {
    LOCATIONS: 'stock.locations',
    VOLUMES: 'stock.volumes',
    ZONES: 'stock.zones',
    PURCHASE_ORDERS: 'stock.purchase-orders',
    PRODUCTS: 'stock.products',
    ITEMS: 'stock.items',
    CATEGORIES: 'stock.categories',
    SUPPLIERS: 'stock.suppliers',
    MANUFACTURERS: 'stock.manufacturers',
    WAREHOUSES: 'stock.warehouses',
  },
  SALES: {
    CUSTOMERS: 'sales.customers',
    ORDERS: 'sales.orders',
    PROMOTIONS: 'sales.promotions',
    RESERVATIONS: 'sales.reservations',
  },
  HR: {
    COMPANIES: 'hr.companies',
    EMPLOYEES: 'hr.employees',
    DEPARTMENTS: 'hr.departments',
    POSITIONS: 'hr.positions',
    ABSENCES: 'hr.absences',
    VACATIONS: 'hr.vacations',
    PAYROLL: 'hr.payroll',
  },
} as const;
