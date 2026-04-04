import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PaymentCharge } from '@/entities/sales/payment-charge';
import type { PaymentChargeStatus } from '@/entities/sales/payment-charge';
import type {
  PaymentChargesRepository,
  CreatePaymentChargeSchema,
} from '../payment-charges-repository';

export class InMemoryPaymentChargesRepository
  implements PaymentChargesRepository
{
  public items: PaymentCharge[] = [];

  async create(data: CreatePaymentChargeSchema): Promise<PaymentCharge> {
    const charge = PaymentCharge.create({
      tenantId: new UniqueEntityID(data.tenantId),
      orderId: new UniqueEntityID(data.orderId),
      provider: data.provider,
      providerChargeId: data.providerChargeId,
      method: data.method,
      amount: data.amount,
      status: data.status ?? 'PENDING',
      qrCode: data.qrCode,
      checkoutUrl: data.checkoutUrl,
      boletoUrl: data.boletoUrl,
      boletoBarcode: data.boletoBarcode,
      paidAt: data.paidAt,
      paidAmount: data.paidAmount,
      expiresAt: data.expiresAt,
      rawResponse: data.rawResponse,
    });

    this.items.push(charge);
    return charge;
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<PaymentCharge | null> {
    return (
      this.items.find(
        (charge) =>
          charge.id.toString() === id &&
          charge.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByProviderChargeId(
    providerChargeId: string,
  ): Promise<PaymentCharge | null> {
    return (
      this.items.find(
        (charge) => charge.providerChargeId === providerChargeId,
      ) ?? null
    );
  }

  async findPendingByOrder(
    orderId: string,
    tenantId: string,
  ): Promise<PaymentCharge[]> {
    return this.items.filter(
      (charge) =>
        charge.orderId.toString() === orderId &&
        charge.tenantId.toString() === tenantId &&
        charge.status === 'PENDING',
    );
  }

  async updateStatusIdempotent(
    id: string,
    newStatus: PaymentChargeStatus,
    paidAmount?: number,
    paidAt?: Date,
    webhookData?: unknown,
  ): Promise<number> {
    const charge = this.items.find(
      (c) => c.id.toString() === id && c.status === 'PENDING',
    );

    if (!charge) {
      return 0;
    }

    charge.status = newStatus;
    if (paidAmount !== undefined) charge.paidAmount = paidAmount;
    if (paidAt) charge.paidAt = paidAt;
    if (webhookData) charge.webhookData = webhookData;

    return 1;
  }

  async save(charge: PaymentCharge): Promise<void> {
    const index = this.items.findIndex((c) => c.id.equals(charge.id));
    if (index >= 0) {
      this.items[index] = charge;
    }
  }
}
