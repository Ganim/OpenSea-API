import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { PaymentConfigDTO } from '@/mappers/sales/payment/payment-config-to-dto';
import { paymentConfigToDTO } from '@/mappers/sales/payment/payment-config-to-dto';
import type { PaymentConfigsRepository } from '@/repositories/sales/payment-configs-repository';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import {
  AVAILABLE_PROVIDERS,
  type ProviderName,
} from '@/services/payment/provider-registry';

interface SavePaymentConfigUseCaseRequest {
  tenantId: string;
  primaryProvider: string;
  primaryConfig: Record<string, unknown>;
  primaryActive: boolean;
  fallbackProvider?: string;
  fallbackConfig?: Record<string, unknown>;
  fallbackActive?: boolean;
}

interface SavePaymentConfigUseCaseResponse {
  paymentConfig: PaymentConfigDTO;
}

export class SavePaymentConfigUseCase {
  constructor(private paymentConfigsRepository: PaymentConfigsRepository) {}

  async execute(
    input: SavePaymentConfigUseCaseRequest,
  ): Promise<SavePaymentConfigUseCaseResponse> {
    if (!AVAILABLE_PROVIDERS.includes(input.primaryProvider as ProviderName)) {
      throw new BadRequestError(
        `Invalid primary provider: ${input.primaryProvider}. Available: ${AVAILABLE_PROVIDERS.join(', ')}`,
      );
    }

    if (
      input.fallbackProvider &&
      !AVAILABLE_PROVIDERS.includes(input.fallbackProvider as ProviderName)
    ) {
      throw new BadRequestError(
        `Invalid fallback provider: ${input.fallbackProvider}. Available: ${AVAILABLE_PROVIDERS.join(', ')}`,
      );
    }

    if (
      input.fallbackProvider &&
      input.fallbackProvider === input.primaryProvider
    ) {
      throw new BadRequestError(
        'Fallback provider must be different from the primary provider.',
      );
    }

    const cipherService = getFieldCipherService();

    const encryptedPrimaryConfig = cipherService.encrypt(
      JSON.stringify(input.primaryConfig),
    );

    let encryptedFallbackConfig: string | undefined;
    if (input.fallbackProvider && input.fallbackConfig) {
      encryptedFallbackConfig = cipherService.encrypt(
        JSON.stringify(input.fallbackConfig),
      );
    }

    const savedConfig = await this.paymentConfigsRepository.save({
      tenantId: input.tenantId,
      primaryProvider: input.primaryProvider,
      primaryConfig: encryptedPrimaryConfig,
      primaryActive: input.primaryActive,
      fallbackProvider: input.fallbackProvider,
      fallbackConfig: encryptedFallbackConfig,
      fallbackActive: input.fallbackActive ?? false,
    });

    return {
      paymentConfig: paymentConfigToDTO(savedConfig),
    };
  }
}
