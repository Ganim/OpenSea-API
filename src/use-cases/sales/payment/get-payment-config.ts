import type { PaymentConfigDTO } from '@/mappers/sales/payment/payment-config-to-dto';
import { paymentConfigToDTO } from '@/mappers/sales/payment/payment-config-to-dto';
import type { PaymentConfigsRepository } from '@/repositories/sales/payment-configs-repository';

interface GetPaymentConfigUseCaseRequest {
  tenantId: string;
}

interface GetPaymentConfigUseCaseResponse {
  paymentConfig: PaymentConfigDTO | null;
}

export class GetPaymentConfigUseCase {
  constructor(private paymentConfigsRepository: PaymentConfigsRepository) {}

  async execute(
    input: GetPaymentConfigUseCaseRequest,
  ): Promise<GetPaymentConfigUseCaseResponse> {
    const config = await this.paymentConfigsRepository.findByTenantId(
      input.tenantId,
    );

    if (!config) {
      return { paymentConfig: null };
    }

    return {
      paymentConfig: paymentConfigToDTO(config),
    };
  }
}
