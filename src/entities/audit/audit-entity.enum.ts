export enum AuditEntity {
  // ==========================================
  // Auth & Users
  // ==========================================
  USER = 'USER',
  USER_PROFILE = 'USER_PROFILE',
  USER_EMAIL = 'USER_EMAIL',
  USER_PASSWORD = 'USER_PASSWORD',
  USER_ACCESS_PIN = 'USER_ACCESS_PIN',
  USER_ACTION_PIN = 'USER_ACTION_PIN',
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
  ORDER = 'ORDER',
  ORDER_ITEM = 'ORDER_ITEM',
  ORDER_RETURN = 'ORDER_RETURN',
  PAYMENT_CONDITION = 'PAYMENT_CONDITION',
  STORE_CREDIT = 'STORE_CREDIT',
  ITEM_RESERVATION = 'ITEM_RESERVATION',
  CONTACT = 'CONTACT',
  PIPELINE = 'PIPELINE',
  PIPELINE_STAGE = 'PIPELINE_STAGE',
  DEAL = 'DEAL',
  ACTIVITY = 'ACTIVITY',
  PRICE_TABLE = 'PRICE_TABLE',
  CUSTOMER_PRICE = 'CUSTOMER_PRICE',
  CAMPAIGN = 'CAMPAIGN',
  COUPON = 'COUPON',
  COMBO = 'COMBO',
  CATALOG = 'CATALOG',
  CATALOG_ITEM = 'CATALOG_ITEM',
  TENANT_BRAND = 'TENANT_BRAND',
  GENERATED_CONTENT = 'GENERATED_CONTENT',

  // ==========================================
  // POS - Ponto de Venda
  // ==========================================
  POS_TERMINAL = 'POS_TERMINAL',
  POS_SESSION = 'POS_SESSION',
  POS_TRANSACTION = 'POS_TRANSACTION',
  POS_CASH_MOVEMENT = 'POS_CASH_MOVEMENT',

  // ==========================================
  // Bids - Licitacoes
  // ==========================================
  BID = 'BID',
  BID_DOCUMENT = 'BID_DOCUMENT',
  BID_CONTRACT = 'BID_CONTRACT',
  BID_EMPENHO = 'BID_EMPENHO',
  BID_AI_CONFIG = 'BID_AI_CONFIG',

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
  EMPLOYEE_DEPENDANT = 'EMPLOYEE_DEPENDANT',
  DEPARTMENT = 'DEPARTMENT',
  POSITION = 'POSITION',

  // ==========================================
  // HR - Controle de Ponto e Tempo
  // ==========================================
  TIME_ENTRY = 'TIME_ENTRY',
  WORK_SCHEDULE = 'WORK_SCHEDULE',
  OVERTIME = 'OVERTIME',
  TIME_BANK = 'TIME_BANK',
  PUNCH_CONFIGURATION = 'PUNCH_CONFIGURATION',
  GEOFENCE_ZONE = 'GEOFENCE_ZONE',

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
  TERMINATION = 'TERMINATION',

  // ==========================================
  // Label Templates
  // ==========================================
  LABEL_TEMPLATE = 'LABEL_TEMPLATE',

  // ==========================================
  // Finance - Financeiro
  // ==========================================
  COST_CENTER = 'COST_CENTER',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  FINANCE_CATEGORY = 'FINANCE_CATEGORY',
  FINANCE_ENTRY = 'FINANCE_ENTRY',
  FINANCE_ENTRY_PAYMENT = 'FINANCE_ENTRY_PAYMENT',
  FINANCE_ATTACHMENT = 'FINANCE_ATTACHMENT',
  LOAN = 'LOAN',
  LOAN_INSTALLMENT = 'LOAN_INSTALLMENT',
  CONSORTIUM = 'CONSORTIUM',
  CONSORTIUM_PAYMENT = 'CONSORTIUM_PAYMENT',
  CONTRACT = 'CONTRACT',
  RECURRING_CONFIG = 'RECURRING_CONFIG',
  FINANCE_BUDGET = 'FINANCE_BUDGET',
  BANK_RECONCILIATION = 'BANK_RECONCILIATION',
  BANK_RECONCILIATION_ITEM = 'BANK_RECONCILIATION_ITEM',

  // ==========================================
  // Teams - Equipes
  // ==========================================
  TEAM = 'TEAM',
  TEAM_MEMBER = 'TEAM_MEMBER',

  // ==========================================
  // Calendar - Agenda
  // ==========================================
  CALENDAR = 'CALENDAR',
  CALENDAR_EVENT = 'CALENDAR_EVENT',
  EVENT_PARTICIPANT = 'EVENT_PARTICIPANT',
  EVENT_REMINDER = 'EVENT_REMINDER',

  // ==========================================
  // Storage - Armazenamento
  // ==========================================
  STORAGE_FOLDER = 'STORAGE_FOLDER',
  STORAGE_FILE = 'STORAGE_FILE',
  STORAGE_FILE_VERSION = 'STORAGE_FILE_VERSION',
  FOLDER_ACCESS_RULE = 'FOLDER_ACCESS_RULE',
  STORAGE_SHARE_LINK = 'STORAGE_SHARE_LINK',

  // ==========================================
  // Tasks - Tarefas
  // ==========================================
  TASK_BOARD = 'TASK_BOARD',
  TASK_CARD = 'TASK_CARD',
  BOARD_MEMBER = 'BOARD_MEMBER',
  BOARD_AUTOMATION = 'BOARD_AUTOMATION',

  // ==========================================
  // Email
  // ==========================================
  EMAIL_ACCOUNT = 'EMAIL_ACCOUNT',
  EMAIL_ACCOUNT_ACCESS = 'EMAIL_ACCOUNT_ACCESS',
  EMAIL_MESSAGE = 'EMAIL_MESSAGE',
  EMAIL_ATTACHMENT = 'EMAIL_ATTACHMENT',

  // ==========================================
  // Admin - Gestão de Tenants e Planos
  // ==========================================
  TENANT = 'TENANT',
  PLAN = 'PLAN',
  TENANT_USER = 'TENANT_USER',
  FEATURE_FLAG = 'FEATURE_FLAG',

  // ==========================================
  // System
  // ==========================================
  OTHER = 'OTHER',
}
