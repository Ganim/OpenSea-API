export interface CreatePixChargeParams {
  txId: string;
  amount: number;
  description?: string;
  expirationSeconds?: number; // default 3600 (1 hour)
  payerCpfCnpj?: string;
  payerName?: string;
}

export interface PixChargeResult {
  txId: string;
  location: string; // QR Code URL
  pixCopiaECola: string; // Copy-paste string
  expiresAt: Date;
}

export interface PixWebhookEvent {
  txId: string;
  endToEndId: string;
  payerName?: string;
  payerCpfCnpj?: string;
  amount: number;
  paidAt: Date;
}

export interface PixProvider {
  readonly providerName: string;
  createCharge(params: CreatePixChargeParams): Promise<PixChargeResult>;
  cancelCharge(txId: string): Promise<void>;
  queryCharge(txId: string): Promise<{ status: string; paidAt?: Date }>;
  parseWebhook(payload: unknown): Promise<PixWebhookEvent>;
  verifyWebhook(payload: unknown, signature: string): boolean;
}
