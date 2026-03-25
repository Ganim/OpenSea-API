import { randomUUID } from 'node:crypto';
import { API_METRICS } from '@/constants/api-metrics';
import { PixCharge } from '@/entities/cashier/pix-charge';
import type { PixChargesRepository } from '@/repositories/cashier/pix-charges-repository';
import type { TenantConsumptionsRepository } from '@/repositories/core/tenant-consumptions-repository';
import type { PixProvider } from '@/services/cashier/pix-provider.interface';

interface CreatePixChargeUseCaseRequest {
  tenantId: string;
  amount: number;
  description?: string;
  orderId?: string;
  posTransactionPaymentId?: string;
}

interface CreatePixChargeUseCaseResponse {
  pixCharge: PixCharge;
}

export class CreatePixChargeUseCase {
  constructor(
    private pixChargesRepository: PixChargesRepository,
    private consumptionsRepository: TenantConsumptionsRepository,
    private pixProvider: PixProvider,
  ) {}

  async execute({
    tenantId,
    amount,
    description,
    orderId,
    posTransactionPaymentId,
  }: CreatePixChargeUseCaseRequest): Promise<CreatePixChargeUseCaseResponse> {
    const txId = randomUUID().replace(/-/g, '').slice(0, 35);

    const providerChargeResult = await this.pixProvider.createCharge({
      txId,
      amount,
      description,
    });

    const pixCharge = PixCharge.create({
      tenantId,
      txId: providerChargeResult.txId,
      location: providerChargeResult.location,
      pixCopiaECola: providerChargeResult.pixCopiaECola,
      amount,
      expiresAt: providerChargeResult.expiresAt,
      provider: this.pixProvider.providerName,
      orderId: orderId ?? null,
      posTransactionPaymentId: posTransactionPaymentId ?? null,
    });

    await this.pixChargesRepository.create(pixCharge);

    // Track consumption
    const period = new Date().toISOString().slice(0, 7);
    await this.consumptionsRepository.incrementUsage(
      tenantId,
      period,
      API_METRICS.PIX_TRANSACTIONS,
      1,
    );

    return { pixCharge };
  }
}
