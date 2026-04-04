import type { PaymentCharge } from '@/entities/sales/payment-charge';

export interface PaymentChargeDTO {
  id: string;
  tenantId: string;
  orderId: string;
  transactionPaymentId?: string;
  provider: string;
  providerChargeId?: string;
  method: string;
  amount: number;
  status: string;
  qrCode?: string;
  checkoutUrl?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  paidAt?: Date;
  paidAmount?: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function paymentChargeToDTO(charge: PaymentCharge): PaymentChargeDTO {
  const dto: PaymentChargeDTO = {
    id: charge.id.toString(),
    tenantId: charge.tenantId.toString(),
    orderId: charge.orderId.toString(),
    provider: charge.provider,
    method: charge.method,
    amount: charge.amount,
    status: charge.status,
    createdAt: charge.createdAt,
    updatedAt: charge.updatedAt,
  };

  if (charge.transactionPaymentId)
    dto.transactionPaymentId = charge.transactionPaymentId.toString();
  if (charge.providerChargeId) dto.providerChargeId = charge.providerChargeId;
  if (charge.qrCode) dto.qrCode = charge.qrCode;
  if (charge.checkoutUrl) dto.checkoutUrl = charge.checkoutUrl;
  if (charge.boletoUrl) dto.boletoUrl = charge.boletoUrl;
  if (charge.boletoBarcode) dto.boletoBarcode = charge.boletoBarcode;
  if (charge.paidAt) dto.paidAt = charge.paidAt;
  if (charge.paidAmount !== undefined) dto.paidAmount = charge.paidAmount;
  if (charge.expiresAt) dto.expiresAt = charge.expiresAt;

  return dto;
}
