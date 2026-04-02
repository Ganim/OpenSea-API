export type ProviderCapability = 'READ' | 'BOLETO' | 'PIX' | 'PAYMENT' | 'TED';

// Read types
export interface BankAccountData {
  id: string;
  type: 'BANK' | 'CREDIT';
  name: string;
  number: string;
  balance: number;
  currencyCode: string;
}

export interface AccountBalance {
  available: number;
  current: number;
  currency: string;
  updatedAt: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  category?: string;
  providerCode?: string;
}

// Boleto types
export interface CreateBoletoInput {
  amount: number;
  dueDate: string;
  customerName: string;
  customerCpfCnpj: string;
  description: string;
  isHybrid?: boolean;
}

export interface BoletoResult {
  nossoNumero: string;
  barcode: string;
  digitableLine: string;
  pixCopyPaste?: string;
  pdfUrl?: string;
  status: string;
  dueDate: string;
  amount: number;
}

// PIX types
export interface CreatePixChargeInput {
  amount: number;
  pixKey: string;
  description: string;
  expiresInSeconds?: number;
  customerName?: string;
  customerCpfCnpj?: string;
}

export interface PixChargeResult {
  txId: string;
  status: string;
  pixCopyPaste: string;
  qrCodeBase64?: string;
  amount: number;
  createdAt: string;
}

export interface ExecutePixPaymentInput {
  amount: number;
  recipientPixKey: string;
  recipientName?: string;
  recipientCpfCnpj?: string;
  description?: string;
}

// Payment types
export interface ExecutePaymentInput {
  method: 'TED' | 'BOLETO';
  amount: number;
  recipientBankCode?: string;
  recipientAgency?: string;
  recipientAccount?: string;
  recipientName?: string;
  recipientCpfCnpj?: string;
  barcode?: string;
  dueDate?: string;
}

export interface PaymentReceipt {
  externalId: string;
  method: string;
  amount: number;
  status: string;
  executedAt: string;
  recipientName?: string;
  receiptData: Record<string, unknown>;
}

export interface PaymentStatus {
  externalId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETURNED';
  amount: number;
  executedAt?: string;
  errorMessage?: string;
}

// Webhook types
export type WebhookEvent = 'PIX_RECEIVED' | 'BOLETO_PAID' | 'PAYMENT_CONFIRMED';

export interface WebhookResult {
  eventType: WebhookEvent;
  externalId: string;
  amount: number;
  paidAt: string;
  payerName?: string;
  payerCpfCnpj?: string;
  rawPayload: Record<string, unknown>;
}

// Health check
export interface HealthCheckResult {
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  checks: {
    auth: { ok: boolean; error?: string };
    balance: { ok: boolean; error?: string };
    timestamp: string;
  };
  sandbox: boolean;
}

// Provider interface
export interface BankingProvider {
  readonly providerName: string;
  readonly capabilities: ProviderCapability[];
  authenticate(): Promise<void>;
  healthCheck(accountId: string): Promise<HealthCheckResult>;
  getAccounts(): Promise<BankAccountData[]>;
  getBalance(accountId: string): Promise<AccountBalance>;
  getTransactions(
    accountId: string,
    from: string,
    to: string,
  ): Promise<BankTransaction[]>;
  createBoleto(data: CreateBoletoInput): Promise<BoletoResult>;
  cancelBoleto(nossoNumero: string): Promise<void>;
  getBoleto(nossoNumero: string): Promise<BoletoResult>;
  createPixCharge(data: CreatePixChargeInput): Promise<PixChargeResult>;
  executePixPayment(data: ExecutePixPaymentInput): Promise<PaymentReceipt>;
  getPixCharge(txId: string): Promise<PixChargeResult>;
  executePayment(data: ExecutePaymentInput): Promise<PaymentReceipt>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  registerWebhook(url: string, events: WebhookEvent[]): Promise<void>;
  handleWebhookPayload(payload: unknown): Promise<WebhookResult>;
}
