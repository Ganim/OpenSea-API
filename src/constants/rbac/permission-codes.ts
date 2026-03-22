/**
 * Permission Codes Constants
 *
 * 363 códigos de permissão organizados por módulo → recurso → ação
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
    // --- CRM: Clientes ---
    CUSTOMERS: {
      ACCESS: 'sales.customers.access' as const,
      REGISTER: 'sales.customers.register' as const,
      MODIFY: 'sales.customers.modify' as const,
      REMOVE: 'sales.customers.remove' as const,
      IMPORT: 'sales.customers.import' as const,
      EXPORT: 'sales.customers.export' as const,
      ONLYSELF: 'sales.customers.onlyself' as const,
      ADMIN: 'sales.customers.admin' as const,
    },
    // --- CRM: Contatos ---
    CONTACTS: {
      ACCESS: 'sales.contacts.access' as const,
      REGISTER: 'sales.contacts.register' as const,
      MODIFY: 'sales.contacts.modify' as const,
      REMOVE: 'sales.contacts.remove' as const,
      ADMIN: 'sales.contacts.admin' as const,
      ONLYSELF: 'sales.contacts.onlyself' as const,
    },
    // --- CRM: Negócios ---
    DEALS: {
      ACCESS: 'sales.deals.access' as const,
      REGISTER: 'sales.deals.register' as const,
      MODIFY: 'sales.deals.modify' as const,
      REMOVE: 'sales.deals.remove' as const,
      REASSIGN: 'sales.deals.reassign' as const,
      ADMIN: 'sales.deals.admin' as const,
      ONLYSELF: 'sales.deals.onlyself' as const,
    },
    // --- CRM: Pipelines ---
    PIPELINES: {
      ACCESS: 'sales.pipelines.access' as const,
      ADMIN: 'sales.pipelines.admin' as const,
    },
    // --- CRM: Atividades ---
    ACTIVITIES: {
      ACCESS: 'sales.activities.access' as const,
      REGISTER: 'sales.activities.register' as const,
    },
    // --- CRM: Conversas (Inbox) ---
    CONVERSATIONS: {
      ACCESS: 'sales.conversations.access' as const,
      REPLY: 'sales.conversations.reply' as const,
      REASSIGN: 'sales.conversations.reassign' as const,
      ADMIN: 'sales.conversations.admin' as const,
    },
    // --- CRM: Workflows ---
    WORKFLOWS: {
      ACCESS: 'sales.workflows.access' as const,
      ADMIN: 'sales.workflows.admin' as const,
      EXECUTE: 'sales.workflows.execute' as const,
    },
    // --- CRM: Formulários ---
    FORMS: {
      ACCESS: 'sales.forms.access' as const,
      ADMIN: 'sales.forms.admin' as const,
    },
    // --- CRM: Propostas ---
    PROPOSALS: {
      ACCESS: 'sales.proposals.access' as const,
      REGISTER: 'sales.proposals.register' as const,
      SEND: 'sales.proposals.send' as const,
      ADMIN: 'sales.proposals.admin' as const,
    },
    // --- CRM: Templates de Mensagem ---
    MSG_TEMPLATES: {
      ACCESS: 'sales.msg-templates.access' as const,
      ADMIN: 'sales.msg-templates.admin' as const,
    },
    // --- Preços ---
    PRICE_TABLES: {
      ACCESS: 'sales.price-tables.access' as const,
      REGISTER: 'sales.price-tables.register' as const,
      MODIFY: 'sales.price-tables.modify' as const,
      REMOVE: 'sales.price-tables.remove' as const,
      ADMIN: 'sales.price-tables.admin' as const,
    },
    DISCOUNTS: {
      ACCESS: 'sales.discounts.access' as const,
      ADMIN: 'sales.discounts.admin' as const,
    },
    COUPONS: {
      ACCESS: 'sales.coupons.access' as const,
      REGISTER: 'sales.coupons.register' as const,
      REMOVE: 'sales.coupons.remove' as const,
      ADMIN: 'sales.coupons.admin' as const,
    },
    CAMPAIGNS: {
      ACCESS: 'sales.campaigns.access' as const,
      REGISTER: 'sales.campaigns.register' as const,
      MODIFY: 'sales.campaigns.modify' as const,
      REMOVE: 'sales.campaigns.remove' as const,
      ADMIN: 'sales.campaigns.admin' as const,
      ACTIVATE: 'sales.campaigns.activate' as const,
    },
    COMBOS: {
      ACCESS: 'sales.combos.access' as const,
      REGISTER: 'sales.combos.register' as const,
      REMOVE: 'sales.combos.remove' as const,
      ADMIN: 'sales.combos.admin' as const,
    },
    // --- Promoções (existente) ---
    PROMOTIONS: {
      ACCESS: 'sales.promotions.access' as const,
      REGISTER: 'sales.promotions.register' as const,
      MODIFY: 'sales.promotions.modify' as const,
      REMOVE: 'sales.promotions.remove' as const,
    },
    // --- Pedidos (existente, expandido) ---
    ORDERS: {
      ACCESS: 'sales.orders.access' as const,
      REGISTER: 'sales.orders.register' as const,
      MODIFY: 'sales.orders.modify' as const,
      REMOVE: 'sales.orders.remove' as const,
      EXPORT: 'sales.orders.export' as const,
      PRINT: 'sales.orders.print' as const,
      ADMIN: 'sales.orders.admin' as const,
      ONLYSELF: 'sales.orders.onlyself' as const,
      CONFIRM: 'sales.orders.confirm' as const,
      APPROVE: 'sales.orders.approve' as const,
      CANCEL: 'sales.orders.cancel' as const,
    },
    // --- Orçamentos ---
    QUOTES: {
      ACCESS: 'sales.quotes.access' as const,
      REGISTER: 'sales.quotes.register' as const,
      MODIFY: 'sales.quotes.modify' as const,
      REMOVE: 'sales.quotes.remove' as const,
      CONVERT: 'sales.quotes.convert' as const,
      SEND: 'sales.quotes.send' as const,
      PRINT: 'sales.quotes.print' as const,
      ONLYSELF: 'sales.quotes.onlyself' as const,
    },
    // --- Devoluções ---
    RETURNS: {
      ACCESS: 'sales.returns.access' as const,
      REGISTER: 'sales.returns.register' as const,
      APPROVE: 'sales.returns.approve' as const,
      ADMIN: 'sales.returns.admin' as const,
    },
    // --- Comissões ---
    COMMISSIONS: {
      ACCESS: 'sales.commissions.access' as const,
      ADMIN: 'sales.commissions.admin' as const,
      ONLYSELF: 'sales.commissions.onlyself' as const,
    },
    // --- PDV ---
    POS: {
      ACCESS: 'sales.pos.access' as const,
      SELL: 'sales.pos.sell' as const,
      CANCEL: 'sales.pos.cancel' as const,
      OVERRIDE: 'sales.pos.override' as const,
      ADMIN: 'sales.pos.admin' as const,
      ONLYSELF: 'sales.pos.onlyself' as const,
    },
    // --- Caixa ---
    CASHIER: {
      ACCESS: 'sales.cashier.access' as const,
      OPEN: 'sales.cashier.open' as const,
      CLOSE: 'sales.cashier.close' as const,
      WITHDRAW: 'sales.cashier.withdraw' as const,
      SUPPLY: 'sales.cashier.supply' as const,
      RECEIVE: 'sales.cashier.receive' as const,
      VERIFY: 'sales.cashier.verify' as const,
      OVERRIDE: 'sales.cashier.override' as const,
      ADMIN: 'sales.cashier.admin' as const,
    },
    // --- Licitações ---
    BIDS: {
      ACCESS: 'sales.bids.access' as const,
      REGISTER: 'sales.bids.register' as const,
      MODIFY: 'sales.bids.modify' as const,
      REMOVE: 'sales.bids.remove' as const,
      ADMIN: 'sales.bids.admin' as const,
    },
    BID_PROPOSALS: {
      ACCESS: 'sales.bid-proposals.access' as const,
      ADMIN: 'sales.bid-proposals.admin' as const,
      SEND: 'sales.bid-proposals.send' as const,
    },
    BID_BOT: {
      ACCESS: 'sales.bid-bot.access' as const,
      ADMIN: 'sales.bid-bot.admin' as const,
      ACTIVATE: 'sales.bid-bot.activate' as const,
    },
    BID_CONTRACTS: {
      ACCESS: 'sales.bid-contracts.access' as const,
      ADMIN: 'sales.bid-contracts.admin' as const,
      REGISTER: 'sales.bid-contracts.register' as const,
      MODIFY: 'sales.bid-contracts.modify' as const,
      REMOVE: 'sales.bid-contracts.remove' as const,
    },
    BID_DOCUMENTS: {
      ACCESS: 'sales.bid-documents.access' as const,
      ADMIN: 'sales.bid-documents.admin' as const,
      REGISTER: 'sales.bid-documents.register' as const,
      MODIFY: 'sales.bid-documents.modify' as const,
      REMOVE: 'sales.bid-documents.remove' as const,
    },
    // --- Catálogos e Conteúdo ---
    CATALOGS: {
      ACCESS: 'sales.catalogs.access' as const,
      REGISTER: 'sales.catalogs.register' as const,
      MODIFY: 'sales.catalogs.modify' as const,
      REMOVE: 'sales.catalogs.remove' as const,
      ADMIN: 'sales.catalogs.admin' as const,
      PUBLISH: 'sales.catalogs.publish' as const,
    },
    CONTENT: {
      ACCESS: 'sales.content.access' as const,
      REGISTER: 'sales.content.register' as const,
      REMOVE: 'sales.content.remove' as const,
      GENERATE: 'sales.content.generate' as const,
      PUBLISH: 'sales.content.publish' as const,
      APPROVE: 'sales.content.approve' as const,
      ADMIN: 'sales.content.admin' as const,
    },
    // --- Marketplaces ---
    MARKETPLACES: {
      ACCESS: 'sales.marketplaces.access' as const,
      ADMIN: 'sales.marketplaces.admin' as const,
      SYNC: 'sales.marketplaces.sync' as const,
    },
    // --- Analytics ---
    ANALYTICS: {
      ACCESS: 'sales.analytics.access' as const,
      ADMIN: 'sales.analytics.admin' as const,
      EXPORT: 'sales.analytics.export' as const,
      ONLYSELF: 'sales.analytics.onlyself' as const,
    },
    // --- Customer Prices ---
    CUSTOMER_PRICES: {
      ACCESS: 'sales.customer-prices.access' as const,
      REGISTER: 'sales.customer-prices.register' as const,
      MODIFY: 'sales.customer-prices.modify' as const,
      REMOVE: 'sales.customer-prices.remove' as const,
    },
    // --- Brand ---
    BRAND: {
      ACCESS: 'sales.brand.access' as const,
      MODIFY: 'sales.brand.modify' as const,
    },
    ANALYTICS_GOALS: {
      ACCESS: 'sales.analytics-goals.access' as const,
      REGISTER: 'sales.analytics-goals.register' as const,
      MODIFY: 'sales.analytics-goals.modify' as const,
      REMOVE: 'sales.analytics-goals.remove' as const,
    },
    ANALYTICS_REPORTS: {
      ACCESS: 'sales.analytics-reports.access' as const,
      REGISTER: 'sales.analytics-reports.register' as const,
      MODIFY: 'sales.analytics-reports.modify' as const,
      REMOVE: 'sales.analytics-reports.remove' as const,
      GENERATE: 'sales.analytics-reports.generate' as const,
    },
    ANALYTICS_DASHBOARDS: {
      ACCESS: 'sales.analytics-dashboards.access' as const,
      REGISTER: 'sales.analytics-dashboards.register' as const,
      MODIFY: 'sales.analytics-dashboards.modify' as const,
      REMOVE: 'sales.analytics-dashboards.remove' as const,
    },
    ANALYTICS_RANKINGS: {
      ACCESS: 'sales.analytics-rankings.access' as const,
    },
    CUSTOMER_PORTAL: {
      ACCESS: 'sales.customer-portal.access' as const,
      REGISTER: 'sales.customer-portal.register' as const,
      REMOVE: 'sales.customer-portal.remove' as const,
    },
    BID_EMPENHOS: {
      ACCESS: 'sales.bid-empenhos.access' as const,
      REGISTER: 'sales.bid-empenhos.register' as const,
      MODIFY: 'sales.bid-empenhos.modify' as const,
    },
    MARKETPLACE_CONNECTIONS: {
      ACCESS: 'sales.marketplace-connections.access' as const,
      REGISTER: 'sales.marketplace-connections.register' as const,
      MODIFY: 'sales.marketplace-connections.modify' as const,
      REMOVE: 'sales.marketplace-connections.remove' as const,
    },
    MARKETPLACE_LISTINGS: {
      ACCESS: 'sales.marketplace-listings.access' as const,
      REGISTER: 'sales.marketplace-listings.register' as const,
      MODIFY: 'sales.marketplace-listings.modify' as const,
      REMOVE: 'sales.marketplace-listings.remove' as const,
    },
    MARKETPLACE_ORDERS: {
      ACCESS: 'sales.marketplace-orders.access' as const,
      MODIFY: 'sales.marketplace-orders.modify' as const,
    },
    MARKETPLACE_PAYMENTS: {
      ACCESS: 'sales.marketplace-payments.access' as const,
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
    SIGNATURE: {
      ENVELOPES: {
        ACCESS: 'tools.signature.envelopes.access' as const,
        REGISTER: 'tools.signature.envelopes.register' as const,
        MODIFY: 'tools.signature.envelopes.modify' as const,
        REMOVE: 'tools.signature.envelopes.remove' as const,
        ADMIN: 'tools.signature.envelopes.admin' as const,
      },
      CERTIFICATES: {
        ACCESS: 'tools.signature.certificates.access' as const,
        REGISTER: 'tools.signature.certificates.register' as const,
        REMOVE: 'tools.signature.certificates.remove' as const,
        ADMIN: 'tools.signature.certificates.admin' as const,
      },
      TEMPLATES: {
        ACCESS: 'tools.signature.templates.access' as const,
        REGISTER: 'tools.signature.templates.register' as const,
        MODIFY: 'tools.signature.templates.modify' as const,
        REMOVE: 'tools.signature.templates.remove' as const,
      },
    },
    AI: {
      CHAT: {
        ACCESS: 'tools.ai.chat.access' as const,
      },
      INSIGHTS: {
        ACCESS: 'tools.ai.insights.access' as const,
      },
      CONFIG: {
        ACCESS: 'tools.ai.config.access' as const,
        MODIFY: 'tools.ai.config.modify' as const,
      },
      FAVORITES: {
        ACCESS: 'tools.ai.favorites.access' as const,
        REGISTER: 'tools.ai.favorites.register' as const,
        REMOVE: 'tools.ai.favorites.remove' as const,
      },
      ACTIONS: {
        ACCESS: 'tools.ai.actions.access' as const,
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

  // tools.ai — acesso ao assistente IA
  PermissionCodes.TOOLS.AI.CHAT.ACCESS,
  PermissionCodes.TOOLS.AI.INSIGHTS.ACCESS,
  PermissionCodes.TOOLS.AI.FAVORITES.ACCESS,
  PermissionCodes.TOOLS.AI.FAVORITES.REGISTER,
  PermissionCodes.TOOLS.AI.FAVORITES.REMOVE,
  PermissionCodes.TOOLS.AI.ACTIONS.ACCESS,

  // sales — CRM básico (visualização + atividades próprias)
  PermissionCodes.SALES.CUSTOMERS.ACCESS,
  PermissionCodes.SALES.CONTACTS.ACCESS,
  PermissionCodes.SALES.DEALS.ACCESS,
  PermissionCodes.SALES.DEALS.ONLYSELF,
  PermissionCodes.SALES.ACTIVITIES.ACCESS,
  PermissionCodes.SALES.ACTIVITIES.REGISTER,
  PermissionCodes.SALES.CONVERSATIONS.ACCESS,
  PermissionCodes.SALES.CONVERSATIONS.REPLY,
  PermissionCodes.SALES.ANALYTICS.ACCESS,
  PermissionCodes.SALES.ANALYTICS.ONLYSELF,
];

// =============================================================================
// isValidPermissionCode — Validação de formato
// =============================================================================
export function isValidPermissionCode(code: string): boolean {
  const parts = code.split('.');
  return parts.length >= 3 && parts.length <= 4;
}

// =============================================================================
// parsePermissionCode — Decomposição de código em module/resource/action
// =============================================================================

export interface ParsedPermissionCode {
  module: string;
  resource: string;
  action: string;
}

/**
 * Decompõe um código de permissão em suas partes constituintes.
 *
 * - 3 níveis: `stock.products.access` → `{ module: 'stock', resource: 'products', action: 'access' }`
 * - 4 níveis: `tools.email.accounts.access` → `{ module: 'tools', resource: 'email.accounts', action: 'access' }`
 *
 * O sub-recurso é absorvido pelo campo `resource` (Option B),
 * mantendo `action` sempre como um verbo único.
 *
 * @throws Error se o código não tiver 3 ou 4 partes
 */
export function parsePermissionCode(code: string): ParsedPermissionCode {
  const parts = code.split('.');

  if (parts.length === 3) {
    return { module: parts[0], resource: parts[1], action: parts[2] };
  }

  if (parts.length === 4) {
    return {
      module: parts[0],
      resource: `${parts[1]}.${parts[2]}`,
      action: parts[3],
    };
  }

  throw new Error(
    `Invalid permission code: '${code}'. Expected 3 or 4 dot-separated parts.`,
  );
}
