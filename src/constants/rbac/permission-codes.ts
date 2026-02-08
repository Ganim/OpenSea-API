/**
 * Permission Codes Constants
 *
 * Códigos de permissão organizados por módulo
 * Fornece autocomplete e type-safety ao trabalhar com permissões
 *
 * Formato: module.resource.action ou module.resource.action.scope
 * Exemplo: 'core.users.create', 'hr.employees.read.all'
 *
 * NOTA: Notificações e preferências do próprio usuário NÃO precisam de permissão,
 * pois são implícitas à autenticação (apenas verifyJwt é necessário).
 */

export const PermissionCodes = {
  // ============================================================================
  // SELF - Permissões do próprio usuário
  // ============================================================================
  /**
   * Permissões para acesso aos próprios dados do usuário logado.
   * Usadas em endpoints /me/*
   *
   * NOTA: Notificações e preferências não estão aqui pois são implícitas à autenticação.
   */
  SELF: {
    PROFILE: {
      READ: 'self.profile.read' as const,
      UPDATE: 'self.profile.update' as const,
      UPDATE_EMAIL: 'self.profile.update-email' as const,
      UPDATE_PASSWORD: 'self.profile.update-password' as const,
      UPDATE_USERNAME: 'self.profile.update-username' as const,
      DELETE: 'self.profile.delete' as const,
    },
    SESSIONS: {
      READ: 'self.sessions.read' as const,
      LIST: 'self.sessions.list' as const,
      REVOKE: 'self.sessions.revoke' as const,
    },
    PERMISSIONS: {
      READ: 'self.permissions.read' as const,
      LIST: 'self.permissions.list' as const,
    },
    GROUPS: {
      READ: 'self.groups.read' as const,
      LIST: 'self.groups.list' as const,
    },
    AUDIT: {
      READ: 'self.audit.read' as const,
      LIST: 'self.audit.list' as const,
    },
    EMPLOYEE: {
      READ: 'self.employee.read' as const,
    },
    TIME_ENTRIES: {
      READ: 'self.time-entries.read' as const,
      LIST: 'self.time-entries.list' as const,
      CREATE: 'self.time-entries.create' as const,
    },
    SCHEDULE: {
      READ: 'self.schedule.read' as const,
    },
    TIME_BANK: {
      READ: 'self.time-bank.read' as const,
      LIST: 'self.time-bank.list' as const,
    },
    VACATIONS: {
      READ: 'self.vacations.read' as const,
      LIST: 'self.vacations.list' as const,
      REQUEST: 'self.vacations.request' as const,
      CANCEL: 'self.vacations.cancel' as const,
    },
    ABSENCES: {
      READ: 'self.absences.read' as const,
      LIST: 'self.absences.list' as const,
      REQUEST: 'self.absences.request' as const,
      CANCEL: 'self.absences.cancel' as const,
    },
    PAYSLIPS: {
      READ: 'self.payslips.read' as const,
      LIST: 'self.payslips.list' as const,
      DOWNLOAD: 'self.payslips.download' as const,
    },
    OVERTIME: {
      READ: 'self.overtime.read' as const,
      LIST: 'self.overtime.list' as const,
      REQUEST: 'self.overtime.request' as const,
    },
    REQUESTS: {
      READ: 'self.requests.read' as const,
      LIST: 'self.requests.list' as const,
      CREATE: 'self.requests.create' as const,
      CANCEL: 'self.requests.cancel' as const,
      COMMENT: 'self.requests.comment' as const,
    },
  },

  // ============================================================================
  // UI - Interface e Menus
  // ============================================================================
  /**
   * Controla a visibilidade de menus e elementos de interface no frontend.
   */
  UI: {
    MENU: {
      DASHBOARD: 'ui.menu.dashboard' as const,
      STOCK: 'ui.menu.stock' as const,
      SALES: 'ui.menu.sales' as const,
      HR: 'ui.menu.hr' as const,
      FINANCE: 'ui.menu.finance' as const,
      RBAC: 'ui.menu.rbac' as const,
      AUDIT: 'ui.menu.audit' as const,
      REPORTS: 'ui.menu.reports' as const,
      SETTINGS: 'ui.menu.settings' as const,
      REQUESTS: 'ui.menu.requests' as const,
      NOTIFICATIONS: 'ui.menu.notifications' as const,
    },
    MENU_STOCK: {
      PRODUCTS: 'ui.menu.stock.products' as const,
      VARIANTS: 'ui.menu.stock.variants' as const,
      ITEMS: 'ui.menu.stock.items' as const,
      CATEGORIES: 'ui.menu.stock.categories' as const,
      SUPPLIERS: 'ui.menu.stock.suppliers' as const,
      MANUFACTURERS: 'ui.menu.stock.manufacturers' as const,
      WAREHOUSES: 'ui.menu.stock.warehouses' as const,
      MOVEMENTS: 'ui.menu.stock.movements' as const,
      PURCHASE_ORDERS: 'ui.menu.stock.purchase-orders' as const,
    },
    MENU_SALES: {
      ORDERS: 'ui.menu.sales.orders' as const,
      CUSTOMERS: 'ui.menu.sales.customers' as const,
      PROMOTIONS: 'ui.menu.sales.promotions' as const,
      RESERVATIONS: 'ui.menu.sales.reservations' as const,
    },
    MENU_HR: {
      EMPLOYEES: 'ui.menu.hr.employees' as const,
      DEPARTMENTS: 'ui.menu.hr.departments' as const,
      POSITIONS: 'ui.menu.hr.positions' as const,
      COMPANIES: 'ui.menu.hr.companies' as const,
      TIME_CONTROL: 'ui.menu.hr.time-control' as const,
      VACATIONS: 'ui.menu.hr.vacations' as const,
      ABSENCES: 'ui.menu.hr.absences' as const,
      PAYROLL: 'ui.menu.hr.payroll' as const,
    },
    MENU_RBAC: {
      USERS: 'ui.menu.rbac.users' as const,
      GROUPS: 'ui.menu.rbac.groups' as const,
      PERMISSIONS: 'ui.menu.rbac.permissions' as const,
    },
    DASHBOARD: {
      SALES_SUMMARY: 'ui.dashboard.sales-summary' as const,
      STOCK_ALERTS: 'ui.dashboard.stock-alerts' as const,
      HR_SUMMARY: 'ui.dashboard.hr-summary' as const,
      FINANCIAL_SUMMARY: 'ui.dashboard.financial-summary' as const,
      RECENT_ACTIVITY: 'ui.dashboard.recent-activity' as const,
      PENDING_REQUESTS: 'ui.dashboard.pending-requests' as const,
    },
  },

  // ============================================================================
  // REPORTS - Relatórios
  // ============================================================================
  /**
   * Controla acesso a visualização e geração de relatórios.
   */
  REPORTS: {
    STOCK: {
      VIEW: 'reports.stock.view' as const,
      GENERATE: 'reports.stock.generate' as const,
      INVENTORY: 'reports.stock.inventory' as const,
      MOVEMENTS: 'reports.stock.movements' as const,
      LOW_STOCK: 'reports.stock.low-stock' as const,
      VALUATION: 'reports.stock.valuation' as const,
    },
    SALES: {
      VIEW: 'reports.sales.view' as const,
      GENERATE: 'reports.sales.generate' as const,
      DAILY: 'reports.sales.daily' as const,
      MONTHLY: 'reports.sales.monthly' as const,
      BY_CUSTOMER: 'reports.sales.by-customer' as const,
      BY_PRODUCT: 'reports.sales.by-product' as const,
      BY_SELLER: 'reports.sales.by-seller' as const,
      COMMISSIONS: 'reports.sales.commissions' as const,
    },
    HR: {
      VIEW: 'reports.hr.view' as const,
      GENERATE: 'reports.hr.generate' as const,
      HEADCOUNT: 'reports.hr.headcount' as const,
      TURNOVER: 'reports.hr.turnover' as const,
      ABSENCES: 'reports.hr.absences' as const,
      VACATIONS: 'reports.hr.vacations' as const,
      TIME_ENTRIES: 'reports.hr.time-entries' as const,
      OVERTIME: 'reports.hr.overtime' as const,
    },
    FINANCIAL: {
      VIEW: 'reports.financial.view' as const,
      GENERATE: 'reports.financial.generate' as const,
      PAYROLL: 'reports.financial.payroll' as const,
      EXPENSES: 'reports.financial.expenses' as const,
      REVENUE: 'reports.financial.revenue' as const,
      CASHFLOW: 'reports.financial.cashflow' as const,
    },
    AUDIT: {
      VIEW: 'reports.audit.view' as const,
      GENERATE: 'reports.audit.generate' as const,
      USER_ACTIVITY: 'reports.audit.user-activity' as const,
      SECURITY: 'reports.audit.security' as const,
    },
  },

  // ============================================================================
  // DATA - Importação/Exportação/Impressão
  // ============================================================================
  /**
   * Controla operações de dados em massa e geração de documentos.
   */
  DATA: {
    IMPORT: {
      PRODUCTS: 'data.import.products' as const,
      VARIANTS: 'data.import.variants' as const,
      CUSTOMERS: 'data.import.customers' as const,
      SUPPLIERS: 'data.import.suppliers' as const,
      EMPLOYEES: 'data.import.employees' as const,
      CATEGORIES: 'data.import.categories' as const,
      BULK: 'data.import.bulk' as const,
    },
    EXPORT: {
      PRODUCTS: 'data.export.products' as const,
      VARIANTS: 'data.export.variants' as const,
      CUSTOMERS: 'data.export.customers' as const,
      SUPPLIERS: 'data.export.suppliers' as const,
      EMPLOYEES: 'data.export.employees' as const,
      ORDERS: 'data.export.orders' as const,
      MOVEMENTS: 'data.export.movements' as const,
      REPORTS: 'data.export.reports' as const,
      AUDIT: 'data.export.audit' as const,
    },
    PRINT: {
      LABELS: 'data.print.labels' as const,
      BARCODES: 'data.print.barcodes' as const,
      RECEIPTS: 'data.print.receipts' as const,
      INVOICES: 'data.print.invoices' as const,
      REPORTS: 'data.print.reports' as const,
      CONTRACTS: 'data.print.contracts' as const,
      PAYSLIPS: 'data.print.payslips' as const,
      BADGES: 'data.print.badges' as const,
    },
  },

  // ============================================================================
  // SETTINGS - Configurações do Sistema
  // ============================================================================
  SETTINGS: {
    SYSTEM: {
      VIEW: 'settings.system.view' as const,
      UPDATE: 'settings.system.update' as const,
    },
    COMPANY: {
      VIEW: 'settings.company.view' as const,
      UPDATE: 'settings.company.update' as const,
    },
    INTEGRATIONS: {
      VIEW: 'settings.integrations.view' as const,
      MANAGE: 'settings.integrations.manage' as const,
    },
    NOTIFICATIONS: {
      VIEW: 'settings.notifications.view' as const,
      MANAGE: 'settings.notifications.manage' as const,
    },
    BACKUP: {
      VIEW: 'settings.backup.view' as const,
      CREATE: 'settings.backup.create' as const,
      RESTORE: 'settings.backup.restore' as const,
    },
  },

  // ============================================================================
  // CORE - Gestão de Usuários e Sessões (Admin)
  // ============================================================================
  /**
   * Sistema principal - gestão de usuários e sessões por administradores.
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
      LIST: 'core.sessions.list' as const,
      REVOKE: 'core.sessions.revoke' as const,
      REVOKE_ALL: 'core.sessions.revoke-all' as const,
    },
    PROFILES: {
      READ: 'core.profiles.read' as const,
      UPDATE: 'core.profiles.update' as const,
    },
    LABEL_TEMPLATES: {
      CREATE: 'core.label-templates.create' as const,
      READ: 'core.label-templates.read' as const,
      UPDATE: 'core.label-templates.update' as const,
      DELETE: 'core.label-templates.delete' as const,
      LIST: 'core.label-templates.list' as const,
      DUPLICATE: 'core.label-templates.duplicate' as const,
      MANAGE: 'core.label-templates.manage' as const,
    },
  },

  // ============================================================================
  // RBAC - Gestão de Permissões (Admin)
  // ============================================================================
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

  // ============================================================================
  // AUDIT - Auditoria (Admin)
  // ============================================================================
  AUDIT: {
    LOGS: {
      READ: 'audit.logs.read' as const,
      VIEW: 'audit.logs.view' as const,
      LIST: 'audit.logs.list' as const,
      SEARCH: 'audit.logs.search' as const,
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

  // ============================================================================
  // NOTIFICATIONS - Notificações (Admin)
  // ============================================================================
  /**
   * Permissões administrativas para gestão de notificações.
   * NOTA: Notificações do próprio usuário não precisam de permissão.
   */
  NOTIFICATIONS: {
    SEND: 'notifications._root.send' as const,
    BROADCAST: 'notifications._root.broadcast' as const,
    SCHEDULE: 'notifications._root.schedule' as const,
    MANAGE: 'notifications._root.manage' as const,
  },

  // ============================================================================
  // STOCK - Gestão de estoque
  // ============================================================================
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
      ENTRY: 'stock.items.entry' as const,
      EXIT: 'stock.items.exit' as const,
      TRANSFER: 'stock.items.transfer' as const,
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
    WAREHOUSES: {
      CREATE: 'stock.warehouses.create' as const,
      READ: 'stock.warehouses.read' as const,
      UPDATE: 'stock.warehouses.update' as const,
      DELETE: 'stock.warehouses.delete' as const,
      LIST: 'stock.warehouses.list' as const,
      MANAGE: 'stock.warehouses.manage' as const,
    },
    ZONES: {
      CREATE: 'stock.zones.create' as const,
      READ: 'stock.zones.read' as const,
      UPDATE: 'stock.zones.update' as const,
      DELETE: 'stock.zones.delete' as const,
      LIST: 'stock.zones.list' as const,
      CONFIGURE: 'stock.zones.configure' as const,
      MANAGE: 'stock.zones.manage' as const,
    },
    BINS: {
      READ: 'stock.bins.read' as const,
      UPDATE: 'stock.bins.update' as const,
      LIST: 'stock.bins.list' as const,
      SEARCH: 'stock.bins.search' as const,
      MANAGE: 'stock.bins.manage' as const,
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
      CANCEL: 'stock.purchase-orders.cancel' as const,
      MANAGE: 'stock.purchase-orders.manage' as const,
    },
    CARE: {
      READ: 'stock.care.read' as const,
      LIST: 'stock.care.list' as const,
      SET: 'stock.care.set' as const,
    },
    VOLUMES: {
      CREATE: 'stock.volumes.create' as const,
      READ: 'stock.volumes.read' as const,
      UPDATE: 'stock.volumes.update' as const,
      DELETE: 'stock.volumes.delete' as const,
      LIST: 'stock.volumes.list' as const,
      MANAGE: 'stock.volumes.manage' as const,
      CLOSE: 'stock.volumes.close' as const,
      REOPEN: 'stock.volumes.reopen' as const,
      DELIVER: 'stock.volumes.deliver' as const,
      RETURN: 'stock.volumes.return' as const,
      ADD_ITEM: 'stock.volumes.add-item' as const,
      REMOVE_ITEM: 'stock.volumes.remove-item' as const,
      ROMANEIO: 'stock.volumes.romaneio' as const,
    },
  },

  // ============================================================================
  // SALES - Gestão de vendas
  // ============================================================================
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
      CANCEL: 'sales.orders.cancel' as const,
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
      RELEASE: 'sales.reservations.release' as const,
      MANAGE: 'sales.reservations.manage' as const,
    },
    COMMENTS: {
      CREATE: 'sales.comments.create' as const,
      READ: 'sales.comments.read' as const,
      UPDATE: 'sales.comments.update' as const,
      DELETE: 'sales.comments.delete' as const,
      LIST: 'sales.comments.list' as const,
    },
    // NOTIFICATIONS removido - funcionalidades do próprio usuário são implícitas
  },

  // ============================================================================
  // REQUESTS - Sistema de Requisições
  // ============================================================================
  REQUESTS: {
    REQUESTS: {
      CREATE: 'requests.requests.create' as const,
      READ: 'requests.requests.read' as const,
      UPDATE: 'requests.requests.update' as const,
      DELETE: 'requests.requests.delete' as const,
      LIST: 'requests.requests.list' as const,
      ASSIGN: 'requests.requests.assign' as const,
      COMPLETE: 'requests.requests.complete' as const,
      CANCEL: 'requests.requests.cancel' as const,
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

  // ============================================================================
  // HR - Recursos Humanos (com escopo all/team)
  // ============================================================================
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
      READ_ALL: 'hr.employees.read.all' as const,
      READ_TEAM: 'hr.employees.read.team' as const,
      UPDATE: 'hr.employees.update' as const,
      UPDATE_ALL: 'hr.employees.update.all' as const,
      UPDATE_TEAM: 'hr.employees.update.team' as const,
      DELETE: 'hr.employees.delete' as const,
      LIST: 'hr.employees.list' as const,
      LIST_ALL: 'hr.employees.list.all' as const,
      LIST_TEAM: 'hr.employees.list.team' as const,
      TERMINATE: 'hr.employees.terminate' as const,
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
    TIME_ENTRIES: {
      CREATE: 'hr.time-entries.create' as const,
      READ: 'hr.time-entries.read' as const,
      READ_ALL: 'hr.time-entries.read.all' as const,
      READ_TEAM: 'hr.time-entries.read.team' as const,
      UPDATE: 'hr.time-entries.update' as const,
      UPDATE_ALL: 'hr.time-entries.update.all' as const,
      UPDATE_TEAM: 'hr.time-entries.update.team' as const,
      DELETE: 'hr.time-entries.delete' as const,
      LIST: 'hr.time-entries.list' as const,
      LIST_ALL: 'hr.time-entries.list.all' as const,
      LIST_TEAM: 'hr.time-entries.list.team' as const,
      APPROVE: 'hr.time-entries.approve' as const,
      APPROVE_ALL: 'hr.time-entries.approve.all' as const,
      APPROVE_TEAM: 'hr.time-entries.approve.team' as const,
      MANAGE: 'hr.time-entries.manage' as const,
    },
    VACATIONS: {
      CREATE: 'hr.vacations.create' as const,
      READ: 'hr.vacations.read' as const,
      READ_ALL: 'hr.vacations.read.all' as const,
      READ_TEAM: 'hr.vacations.read.team' as const,
      UPDATE: 'hr.vacations.update' as const,
      DELETE: 'hr.vacations.delete' as const,
      LIST: 'hr.vacations.list' as const,
      LIST_ALL: 'hr.vacations.list.all' as const,
      LIST_TEAM: 'hr.vacations.list.team' as const,
      APPROVE: 'hr.vacations.approve' as const,
      APPROVE_ALL: 'hr.vacations.approve.all' as const,
      APPROVE_TEAM: 'hr.vacations.approve.team' as const,
      MANAGE: 'hr.vacations.manage' as const,
    },
    ABSENCES: {
      CREATE: 'hr.absences.create' as const,
      READ: 'hr.absences.read' as const,
      READ_ALL: 'hr.absences.read.all' as const,
      READ_TEAM: 'hr.absences.read.team' as const,
      UPDATE: 'hr.absences.update' as const,
      DELETE: 'hr.absences.delete' as const,
      LIST: 'hr.absences.list' as const,
      LIST_ALL: 'hr.absences.list.all' as const,
      LIST_TEAM: 'hr.absences.list.team' as const,
      APPROVE: 'hr.absences.approve' as const,
      APPROVE_ALL: 'hr.absences.approve.all' as const,
      APPROVE_TEAM: 'hr.absences.approve.team' as const,
      MANAGE: 'hr.absences.manage' as const,
    },
    OVERTIME: {
      CREATE: 'hr.overtime.create' as const,
      READ: 'hr.overtime.read' as const,
      READ_ALL: 'hr.overtime.read.all' as const,
      READ_TEAM: 'hr.overtime.read.team' as const,
      UPDATE: 'hr.overtime.update' as const,
      DELETE: 'hr.overtime.delete' as const,
      LIST: 'hr.overtime.list' as const,
      LIST_ALL: 'hr.overtime.list.all' as const,
      LIST_TEAM: 'hr.overtime.list.team' as const,
      APPROVE: 'hr.overtime.approve' as const,
      APPROVE_ALL: 'hr.overtime.approve.all' as const,
      APPROVE_TEAM: 'hr.overtime.approve.team' as const,
      MANAGE: 'hr.overtime.manage' as const,
    },
    PAYROLL: {
      CREATE: 'hr.payroll.create' as const,
      READ: 'hr.payroll.read' as const,
      UPDATE: 'hr.payroll.update' as const,
      DELETE: 'hr.payroll.delete' as const,
      LIST: 'hr.payroll.list' as const,
      PROCESS: 'hr.payroll.process' as const,
      APPROVE: 'hr.payroll.approve' as const,
      MANAGE: 'hr.payroll.manage' as const,
    },
    TIME_BANK: {
      CREATE: 'hr.time-bank.create' as const,
      READ: 'hr.time-bank.read' as const,
      READ_ALL: 'hr.time-bank.read.all' as const,
      READ_TEAM: 'hr.time-bank.read.team' as const,
      UPDATE: 'hr.time-bank.update' as const,
      DELETE: 'hr.time-bank.delete' as const,
      LIST: 'hr.time-bank.list' as const,
      LIST_ALL: 'hr.time-bank.list.all' as const,
      LIST_TEAM: 'hr.time-bank.list.team' as const,
      MANAGE: 'hr.time-bank.manage' as const,
    },
    WORK_SCHEDULES: {
      CREATE: 'hr.work-schedules.create' as const,
      READ: 'hr.work-schedules.read' as const,
      UPDATE: 'hr.work-schedules.update' as const,
      DELETE: 'hr.work-schedules.delete' as const,
      LIST: 'hr.work-schedules.list' as const,
      MANAGE: 'hr.work-schedules.manage' as const,
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
  },

  // ============================================================================
  // STUDIO - Editor de etiquetas
  // ============================================================================
  STUDIO: {
    LABELS: {
      MANAGE: 'studio.labels.manage' as const,
      USE: 'studio.labels.use' as const,
      VIEW: 'studio.labels.view' as const,
      LIST: 'studio.labels.list' as const,
      EDIT: 'studio.labels.edit' as const,
      DELETE: 'studio.labels.delete' as const,
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
 * Aceita formatos: module.resource.action ou module.resource.action.scope
 */
export function isValidPermissionCode(code: string): boolean {
  const parts = code.split('.');
  return parts.length >= 3 && parts.length <= 4;
}

/**
 * Permissões padrão do grupo USER
 * Apenas acesso aos próprios dados
 *
 * NOTA: Notificações e preferências não estão aqui pois são
 * implícitas à autenticação (não precisam de permissão)
 */
export const DEFAULT_USER_PERMISSIONS = [
  // Profile
  'self.profile.read',
  'self.profile.update',
  'self.profile.update-email',
  'self.profile.update-password',
  'self.profile.update-username',

  // Sessions
  'self.sessions.read',
  'self.sessions.list',
  'self.sessions.revoke',

  // Permissions & Groups (view only)
  'self.permissions.read',
  'self.permissions.list',
  'self.groups.read',
  'self.groups.list',

  // Audit (own logs)
  'self.audit.read',
  'self.audit.list',

  // Employee data (if linked)
  'self.employee.read',

  // Time entries
  'self.time-entries.read',
  'self.time-entries.list',
  'self.time-entries.create',

  // Schedule
  'self.schedule.read',

  // Time bank
  'self.time-bank.read',
  'self.time-bank.list',

  // Vacations
  'self.vacations.read',
  'self.vacations.list',
  'self.vacations.request',
  'self.vacations.cancel',

  // Absences
  'self.absences.read',
  'self.absences.list',
  'self.absences.request',
  'self.absences.cancel',

  // Payslips
  'self.payslips.read',
  'self.payslips.list',
  'self.payslips.download',

  // Overtime
  'self.overtime.read',
  'self.overtime.list',
  'self.overtime.request',

  // Requests
  'self.requests.read',
  'self.requests.list',
  'self.requests.create',
  'self.requests.cancel',
  'self.requests.comment',
] as const;
