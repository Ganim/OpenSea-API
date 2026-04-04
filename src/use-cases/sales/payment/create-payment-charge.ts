import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { PosPaymentMethod } from '@/entities/sales/pos-transaction-payment';
import type { PaymentChargeDTO } from '@/mappers/sales/payment/payment-charge-to-dto';
import { paymentChargeToDTO } from '@/mappers/sales/payment/payment-charge-to-dto';
import type { PaymentChargesRepository } from '@/repositories/sales/payment-charges-repository';
import type { PaymentConfigsRepository } from '@/repositories/sales/payment-configs-repository';
import { PaymentProviderFactory } from '@/services/payment/payment-provider.factory';

interface CreatePaymentChargeUseCaseRequest {
  tenantId: string;
  orderId: string;
  orderNumber: string;
  method: PosPaymentMethod;
  amount: number;
  customerName?: string;
  customerDocument?: string;
  description?: string;
  installments?: number;
  expiresInMinutes?: number;
}

interface CreatePaymentChargeUseCaseResponse {
  paymentCharge: PaymentChargeDTO;
}

export class CreatePaymentChargeUseCase {
  constructor(
    private paymentConfigsRepository: PaymentConfigsRepository,
    private paymentChargesRepository: PaymentChargesRepository,
  ) {}

  async execute(
    input: CreatePaymentChargeUseCaseRequest,
  ): Promise<CreatePaymentChargeUseCaseResponse> {
    if (input.amount <= 0) {
      throw new BadRequestError('Charge amount must be positive.');
    }

    const tenantConfig = await this.paymentConfigsRepository.findByTenantId(
      input.tenantId,
    );

    const factory = new PaymentProviderFactory();
    const provider = factory.resolve(tenantConfig, input.method);

    const chargeResult = await provider.createCharge({
      amount: input.amount,
      method: input.method as 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'PAYMENT_LINK',
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      customerName: input.customerName,
      customerDocument: input.customerDocument,
      description: input.description,
      installments: input.installments,
      expiresInMinutes: input.expiresInMinutes,
    });

    const paymentCharge = await this.paymentChargesRepository.create({
      tenantId: input.tenantId,
      orderId: input.orderId,
      provider: provider.name,
      providerChargeId: chargeResult.chargeId,
      method: input.method,
      amount: input.amount,
      status: chargeResult.status === 'PAID' ? 'PAID' : 'PENDING',
      qrCode: chargeResult.qrCode,
      checkoutUrl: chargeResult.checkoutUrl,
      boletoUrl: chargeResult.boletoUrl,
      boletoBarcode: chargeResult.boletoBarcode,
      paidAt: chargeResult.status === 'PAID' ? new Date() : undefined,
      paidAmount: chargeResult.status === 'PAID' ? input.amount : undefined,
      expiresAt: chargeResult.expiresAt,
      rawResponse: chargeResult.rawResponse,
    });

    return {
      paymentCharge: paymentChargeToDTO(paymentCharge),
    };
  }
}
