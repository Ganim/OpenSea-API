export enum AuditEntity {
  // ==========================================
  // Auth & Users
  // ==========================================
  USER = 'USER',
  USER_PROFILE = 'USER_PROFILE',
  USER_EMAIL = 'USER_EMAIL',
  USER_PASSWORD = 'USER_PASSWORD',
  USER_USERNAME = 'USER_USERNAME',
  SESSION = 'SESSION',
  REFRESH_TOKEN = 'REFRESH_TOKEN',

  // ==========================================
  // RBAC - Controle de Acesso
  // ==========================================
  PERMISSION = 'PERMISSION',
  PERMISSION_GROUP = 'PERMISSION_GROUP',
  PERMISSION_GROUP_PERMISSION = 'PERMISSION_GROUP_PERMISSION',
  USER_PERMISSION_GROUP = 'USER_PERMISSION_GROUP',
  USER_DIRECT_PERMISSION = 'USER_DIRECT_PERMISSION',

  // ==========================================
  // Stock Management - Estoque
  // ==========================================
  PRODUCT = 'PRODUCT',
  VARIANT = 'VARIANT',
  ITEM = 'ITEM',
  CATEGORY = 'CATEGORY',
  SUPPLIER = 'SUPPLIER',
  MANUFACTURER = 'MANUFACTURER',
  LOCATION = 'LOCATION',
  TEMPLATE = 'TEMPLATE',
  ITEM_MOVEMENT = 'ITEM_MOVEMENT',
  PRODUCT_CATEGORY = 'PRODUCT_CATEGORY',
  VARIANT_PRICE_HISTORY = 'VARIANT_PRICE_HISTORY',
  TAG = 'TAG',
  PRODUCT_TAG = 'PRODUCT_TAG',
  VARIANT_IMAGE = 'VARIANT_IMAGE',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  PURCHASE_ORDER_ITEM = 'PURCHASE_ORDER_ITEM',
  UNIT_CONVERSION = 'UNIT_CONVERSION',
  STOCK_SNAPSHOT = 'STOCK_SNAPSHOT',
  VARIANT_SUPPLIER_CODE = 'VARIANT_SUPPLIER_CODE',
  VARIANT_PROMOTION = 'VARIANT_PROMOTION',

  // ==========================================
  // Sales - Vendas
  // ==========================================
  CUSTOMER = 'CUSTOMER',
  SALES_ORDER = 'SALES_ORDER',
  SALES_ORDER_ITEM = 'SALES_ORDER_ITEM',
  ITEM_RESERVATION = 'ITEM_RESERVATION',

  // ==========================================
  // Alerts & Notifications
  // ==========================================
  ALERT = 'ALERT',
  NOTIFICATION = 'NOTIFICATION',
  NOTIFICATION_TEMPLATE = 'NOTIFICATION_TEMPLATE',
  NOTIFICATION_PREFERENCE = 'NOTIFICATION_PREFERENCE',

  // ==========================================
  // Comments - Comentários
  // ==========================================
  COMMENT = 'COMMENT',

  // ==========================================
  // Requests - Workflow de Solicitações
  // ==========================================
  REQUEST = 'REQUEST',
  REQUEST_ATTACHMENT = 'REQUEST_ATTACHMENT',
  REQUEST_COMMENT = 'REQUEST_COMMENT',
  REQUEST_HISTORY = 'REQUEST_HISTORY',

  // ==========================================
  // HR - Organization (Empresa/Company)
  // ==========================================
  COMPANY = 'COMPANY',
  COMPANY_ADDRESS = 'COMPANY_ADDRESS',
  COMPANY_CNAE = 'COMPANY_CNAE',
  COMPANY_FISCAL_SETTINGS = 'COMPANY_FISCAL_SETTINGS',
  COMPANY_STAKEHOLDER = 'COMPANY_STAKEHOLDER',

  // ==========================================
  // HR - Estrutura Organizacional
  // ==========================================
  EMPLOYEE = 'EMPLOYEE',
  DEPARTMENT = 'DEPARTMENT',
  POSITION = 'POSITION',

  // ==========================================
  // HR - Controle de Ponto e Tempo
  // ==========================================
  TIME_ENTRY = 'TIME_ENTRY',
  WORK_SCHEDULE = 'WORK_SCHEDULE',
  OVERTIME = 'OVERTIME',
  TIME_BANK = 'TIME_BANK',

  // ==========================================
  // HR - Ausências e Férias
  // ==========================================
  ABSENCE = 'ABSENCE',
  VACATION_PERIOD = 'VACATION_PERIOD',
  VACATION_BALANCE = 'VACATION_BALANCE',

  // ==========================================
  // Payroll - Folha de Pagamento
  // ==========================================
  PAYROLL = 'PAYROLL',
  PAYROLL_ITEM = 'PAYROLL_ITEM',
  BONUS = 'BONUS',
  DEDUCTION = 'DEDUCTION',

  // ==========================================
  // Label Templates
  // ==========================================
  LABEL_TEMPLATE = 'LABEL_TEMPLATE',

  // ==========================================
  // System
  // ==========================================
  OTHER = 'OTHER',
}
