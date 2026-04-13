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
  QUOTE = 'QUOTE',
  PROPOSAL = 'PROPOSAL',
  DISCOUNT_RULE = 'DISCOUNT_RULE',
  LEAD_ROUTING_RULE = 'LEAD_ROUTING_RULE',
  LEAD_SCORING_RULE = 'LEAD_SCORING_RULE',
  LEAD_SCORE = 'LEAD_SCORE',
  INTEGRATION = 'INTEGRATION',
  TENANT_INTEGRATION = 'TENANT_INTEGRATION',
  WORKFLOW = 'WORKFLOW',
  WORKFLOW_STEP = 'WORKFLOW_STEP',
  MESSAGE_TEMPLATE = 'MESSAGE_TEMPLATE',

  // ==========================================
  // Conversations - Conversas CRM
  // ==========================================
  CONVERSATION = 'CONVERSATION',
  CONVERSATION_MESSAGE = 'CONVERSATION_MESSAGE',
  CHATBOT_CONFIG = 'CHATBOT_CONFIG',
  DEAL_PREDICTION = 'DEAL_PREDICTION',

  // ==========================================
  // Forms - Formulários CRM
  // ==========================================
  FORM = 'FORM',
  FORM_SUBMISSION = 'FORM_SUBMISSION',
  LANDING_PAGE = 'LANDING_PAGE',

  // ==========================================
  // Cashier - Caixa
  // ==========================================
  CASHIER_SESSION = 'CASHIER_SESSION',
  CASHIER_TRANSACTION = 'CASHIER_TRANSACTION',

  // ==========================================
  // Process Blueprints - Regras de Processo
  // ==========================================
  PROCESS_BLUEPRINT = 'PROCESS_BLUEPRINT',
  BLUEPRINT_STAGE_RULE = 'BLUEPRINT_STAGE_RULE',

  // ==========================================
  // POS - Ponto de Venda
  // ==========================================
  POS_TERMINAL = 'POS_TERMINAL',
  POS_SESSION = 'POS_SESSION',
  POS_TRANSACTION = 'POS_TRANSACTION',
  POS_CASH_MOVEMENT = 'POS_CASH_MOVEMENT',
  PAYMENT_CONFIG = 'PAYMENT_CONFIG',
  PAYMENT_CHARGE = 'PAYMENT_CHARGE',

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
  SHIFT = 'SHIFT',
  SHIFT_ASSIGNMENT = 'SHIFT_ASSIGNMENT',
  OVERTIME = 'OVERTIME',
  TIME_BANK = 'TIME_BANK',
  PUNCH_CONFIGURATION = 'PUNCH_CONFIGURATION',
  GEOFENCE_ZONE = 'GEOFENCE_ZONE',
  HR_TENANT_CONFIG = 'HR_TENANT_CONFIG',

  // ==========================================
  // HR - Advertências (Warnings)
  // ==========================================
  EMPLOYEE_WARNING = 'EMPLOYEE_WARNING',

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
  MEDICAL_EXAM = 'MEDICAL_EXAM',
  BENEFIT_PLAN = 'BENEFIT_PLAN',
  BENEFIT_ENROLLMENT = 'BENEFIT_ENROLLMENT',
  FLEX_BENEFIT_ALLOCATION = 'FLEX_BENEFIT_ALLOCATION',
  TRAINING_PROGRAM = 'TRAINING_PROGRAM',
  TRAINING_ENROLLMENT = 'TRAINING_ENROLLMENT',
  REVIEW_CYCLE = 'REVIEW_CYCLE',
  PERFORMANCE_REVIEW = 'PERFORMANCE_REVIEW',
  EMPLOYEE_REQUEST = 'EMPLOYEE_REQUEST',
  EMPLOYEE_KUDOS = 'EMPLOYEE_KUDOS',
  COMPANY_ANNOUNCEMENT = 'COMPANY_ANNOUNCEMENT',
  ONBOARDING_CHECKLIST = 'ONBOARDING_CHECKLIST',
  OFFBOARDING_CHECKLIST = 'OFFBOARDING_CHECKLIST',
  APPROVAL_DELEGATION = 'APPROVAL_DELEGATION',
  ADMISSION_INVITE = 'ADMISSION_INVITE',
  DIGITAL_SIGNATURE = 'DIGITAL_SIGNATURE',

  // ==========================================
  // Label Templates
  // ==========================================
  LABEL_TEMPLATE = 'LABEL_TEMPLATE',

  // ==========================================
  // Finance - Financeiro
  // ==========================================
  CHART_OF_ACCOUNT = 'CHART_OF_ACCOUNT',
  COST_CENTER = 'COST_CENTER',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  FINANCE_CATEGORY = 'FINANCE_CATEGORY',
  FINANCE_ENTRY = 'FINANCE_ENTRY',
  FINANCE_ENTRY_PAYMENT = 'FINANCE_ENTRY_PAYMENT',
  FINANCE_ATTACHMENT = 'FINANCE_ATTACHMENT',
  FINANCE_ENTRY_RETENTION = 'FINANCE_ENTRY_RETENTION',
  LOAN = 'LOAN',
  LOAN_INSTALLMENT = 'LOAN_INSTALLMENT',
  CONSORTIUM = 'CONSORTIUM',
  CONSORTIUM_PAYMENT = 'CONSORTIUM_PAYMENT',
  CONTRACT = 'CONTRACT',
  RECURRING_CONFIG = 'RECURRING_CONFIG',
  FINANCE_BUDGET = 'FINANCE_BUDGET',
  BANK_RECONCILIATION = 'BANK_RECONCILIATION',
  BANK_RECONCILIATION_ITEM = 'BANK_RECONCILIATION_ITEM',
  RECONCILIATION_SUGGESTION = 'RECONCILIATION_SUGGESTION',

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
  // Cadence Sequences
  // ==========================================
  CADENCE_SEQUENCE = 'CADENCE_SEQUENCE',
  CADENCE_STEP = 'CADENCE_STEP',
  CADENCE_ENROLLMENT = 'CADENCE_ENROLLMENT',

  // ==========================================
  // HR — Recruitment / ATS
  // ==========================================
  JOB_POSTING = 'JOB_POSTING',
  CANDIDATE = 'CANDIDATE',
  APPLICATION = 'APPLICATION',
  INTERVIEW_STAGE = 'INTERVIEW_STAGE',
  INTERVIEW = 'INTERVIEW',

  // ==========================================
  // Production — Controle de Produção
  // ==========================================
  WORKSTATION_TYPE = 'WORKSTATION_TYPE',
  WORKSTATION = 'WORKSTATION',
  WORK_CENTER = 'WORK_CENTER',
  PRODUCTION_BOM = 'PRODUCTION_BOM',
  PRODUCTION_BOM_ITEM = 'PRODUCTION_BOM_ITEM',
  OPERATION_ROUTING = 'OPERATION_ROUTING',
  PRODUCTION_ORDER = 'PRODUCTION_ORDER',
  PRODUCTION_MATERIAL_RESERVATION = 'PRODUCTION_MATERIAL_RESERVATION',
  PRODUCTION_MATERIAL_ISSUE = 'PRODUCTION_MATERIAL_ISSUE',
  PRODUCTION_MATERIAL_RETURN = 'PRODUCTION_MATERIAL_RETURN',
  PRODUCTION_JOB_CARD = 'PRODUCTION_JOB_CARD',
  PRODUCTION_TIME_ENTRY = 'PRODUCTION_TIME_ENTRY',
  PRODUCTION_ENTRY = 'PRODUCTION_ENTRY',
  DOWNTIME_REASON = 'DOWNTIME_REASON',
  DOWNTIME_RECORD = 'DOWNTIME_RECORD',
  PRODUCTION_SCHEDULE = 'PRODUCTION_SCHEDULE',
  DEFECT_TYPE = 'DEFECT_TYPE',
  INSPECTION_PLAN = 'INSPECTION_PLAN',
  INSPECTION_RESULT = 'INSPECTION_RESULT',
  DEFECT_RECORD = 'DEFECT_RECORD',
  QUALITY_HOLD = 'QUALITY_HOLD',
  PRODUCTION_COST = 'PRODUCTION_COST',
  PRODUCTION_TEXTILE_CUT_PLAN = 'PRODUCTION_TEXTILE_CUT_PLAN',
  PRODUCTION_TEXTILE_BUNDLE_TICKET = 'PRODUCTION_TEXTILE_BUNDLE_TICKET',

  // ==========================================
  // System
  // ==========================================
  OTHER = 'OTHER',
}
