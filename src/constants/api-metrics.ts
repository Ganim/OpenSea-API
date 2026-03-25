export const API_METRICS = {
  // AI
  AI_QUERIES_T1: 'ai_queries_t1', // Gemini Flash / budget models
  AI_QUERIES_T2: 'ai_queries_t2', // Claude / Gemini Pro

  // Messaging
  WHATSAPP_MESSAGES: 'whatsapp_messages',
  WHATSAPP_CONVERSATIONS: 'whatsapp_conversations',
  INSTAGRAM_MESSAGES: 'instagram_messages',
  TELEGRAM_MESSAGES: 'telegram_messages',

  // Fiscal
  FISCAL_DOCUMENTS: 'fiscal_documents',

  // Marketplace
  MARKETPLACE_API_CALLS: 'marketplace_api_calls',
  MARKETPLACE_ORDERS: 'marketplace_orders',

  // Payments
  PIX_TRANSACTIONS: 'pix_transactions',

  // Storage
  STORAGE_GB: 'storage_gb',
} as const;

export type ApiMetric = (typeof API_METRICS)[keyof typeof API_METRICS];

export const METRIC_CATEGORIES = {
  ai: {
    prefix: 'ai_',
    label: 'Inteligencia Artificial',
    color: '#8b5cf6',
  },
  messaging: {
    prefix: 'whatsapp_|instagram_|telegram_',
    label: 'Mensageria',
    color: '#0ea5e9',
  },
  fiscal: {
    prefix: 'fiscal_',
    label: 'Fiscal (NF-e/NFC-e)',
    color: '#10b981',
  },
  marketplace: {
    prefix: 'marketplace_',
    label: 'Marketplace',
    color: '#f97316',
  },
  payments: {
    prefix: 'pix_',
    label: 'Pagamentos',
    color: '#ec4899',
  },
  storage: {
    prefix: 'storage_',
    label: 'Armazenamento',
    color: '#6366f1',
  },
} as const;

export type MetricCategory = keyof typeof METRIC_CATEGORIES;
