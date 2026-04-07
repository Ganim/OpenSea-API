/**
 * Payment Provider interface.
 *
 * All payment gateway providers (InfinitePay, Asaas, Manual, etc.)
 * must implement this interface to be used by PaymentProviderFactory.
 *
 * NOTE: This file may be replaced/merged by the infrastructure agent.
 * Keep in sync with the spec at docs/superpowers/specs/2026-04-04-payment-gateway-design.md
 */

export type PaymentMethod =
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BOLETO'
  | 'PAYMENT_LINK';

export interface CreateChargeInput {
  /** Amount in cents */
  amount: number;
  method: PaymentMethod;
  orderId: string;
  orderNumber: string;
  customerName?: string;
  customerDocument?: string;
  description?: string;
  installments?: number;
  expiresInMinutes?: number;
}

export interface ChargeResult {
  chargeId: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  qrCode?: string;
  qrCodeImage?: string;
  checkoutUrl?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  expiresAt?: Date;
  rawResponse?: unknown;
}

export interface ChargeStatus {
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'REFUNDED';
  paidAt?: Date;
  paidAmount?: number;
}

export interface WebhookResult {
  chargeId: string;
  status: 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
  paidAmount?: number;
  metadata?: Record<string, unknown>;
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'file';
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface PaymentProvider {
  name: string;
  displayName: string;
  supportedMethods: PaymentMethod[];

  createCharge(input: CreateChargeInput): Promise<ChargeResult>;
  checkStatus(chargeId: string): Promise<ChargeStatus>;
  handleWebhook(
    payload: unknown,
    headers: Record<string, string>,
  ): Promise<WebhookResult>;
  testConnection(): Promise<{ ok: boolean; message: string }>;
  getConfigFields(): ConfigField[];
}
