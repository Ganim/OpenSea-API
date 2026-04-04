import type { PaymentCharge } from '@/entities/sales/payment-charge';
import type { PaymentChargeStatus } from '@/entities/sales/payment-charge';
import type { PosPaymentMethod } from '@/entities/sales/pos-transaction-payment';

export interface CreatePaymentChargeSchema {
  tenantId: string;
  orderId: string;
  provider: string;
  providerChargeId?: string;
  method: PosPaymentMethod;
  amount: number;
  status?: PaymentChargeStatus;
  qrCode?: string;
  checkoutUrl?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  paidAt?: Date;
  paidAmount?: number;
  expiresAt?: Date;
  rawResponse?: unknown;
}

export interface PaymentChargesRepository {
  create(data: CreatePaymentChargeSchema): Promise<PaymentCharge>;
  findById(id: string, tenantId: string): Promise<PaymentCharge | null>;
  findByProviderChargeId(
    providerChargeId: string,
  ): Promise<PaymentCharge | null>;
  findPendingByOrder(
    orderId: string,
    tenantId: string,
  ): Promise<PaymentCharge[]>;
  updateStatusIdempotent(
    id: string,
    newStatus: PaymentChargeStatus,
    paidAmount?: number,
    paidAt?: Date,
    webhookData?: unknown,
  ): Promise<number>;
  save(charge: PaymentCharge): Promise<void>;
}
