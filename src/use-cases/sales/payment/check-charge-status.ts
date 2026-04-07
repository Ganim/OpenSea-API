import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { PaymentChargeDTO } from '@/mappers/sales/payment/payment-charge-to-dto';
import { paymentChargeToDTO } from '@/mappers/sales/payment/payment-charge-to-dto';
import type { PaymentChargesRepository } from '@/repositories/sales/payment-charges-repository';
import type { PaymentConfigsRepository } from '@/repositories/sales/payment-configs-repository';
import { PaymentProviderFactory } from '@/services/payment/payment-provider.factory';

interface CheckChargeStatusUseCaseRequest {
  tenantId: string;
  chargeId: string;
}

interface CheckChargeStatusUseCaseResponse {
  paymentCharge: PaymentChargeDTO;
  changed: boolean;
}

export class CheckChargeStatusUseCase {
  constructor(
    private paymentChargesRepository: PaymentChargesRepository,
    private paymentConfigsRepository: PaymentConfigsRepository,
  ) {}

  async execute(
    input: CheckChargeStatusUseCaseRequest,
  ): Promise<CheckChargeStatusUseCaseResponse> {
    const charge = await this.paymentChargesRepository.findById(
      input.chargeId,
      input.tenantId,
    );

    if (!charge) {
      throw new ResourceNotFoundError('Payment charge not found.');
    }

    // If charge is already in a terminal state, no need to check provider
    if (charge.status !== 'PENDING') {
      return {
        paymentCharge: paymentChargeToDTO(charge),
        changed: false,
      };
    }

    // Only check provider if there is a providerChargeId (non-manual charges)
    if (!charge.providerChargeId || charge.provider === 'manual') {
      return {
        paymentCharge: paymentChargeToDTO(charge),
        changed: false,
      };
    }

    const tenantConfig = await this.paymentConfigsRepository.findByTenantId(
      input.tenantId,
    );

    const factory = new PaymentProviderFactory();
    const provider = factory.resolve(tenantConfig, charge.method);

    const providerStatus = await provider.checkStatus(charge.providerChargeId);

    if (providerStatus.status === charge.status) {
      return {
        paymentCharge: paymentChargeToDTO(charge),
        changed: false,
      };
    }

    // Status changed — update idempotently
    const affectedCount =
      await this.paymentChargesRepository.updateStatusIdempotent(
        charge.id.toString(),
        providerStatus.status,
        providerStatus.paidAmount,
        providerStatus.paidAt,
      );

    if (affectedCount === 0) {
      // Already updated by another process (webhook, etc.)
      const freshCharge = await this.paymentChargesRepository.findById(
        input.chargeId,
        input.tenantId,
      );

      return {
        paymentCharge: paymentChargeToDTO(freshCharge ?? charge),
        changed: false,
      };
    }

    // Reflect the update in the entity for the DTO
    charge.status = providerStatus.status;
    if (providerStatus.paidAmount !== undefined) {
      charge.paidAmount = providerStatus.paidAmount;
    }
    if (providerStatus.paidAt) {
      charge.paidAt = providerStatus.paidAt;
    }

    return {
      paymentCharge: paymentChargeToDTO(charge),
      changed: true,
    };
  }
}
