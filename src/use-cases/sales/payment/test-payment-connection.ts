import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { PaymentConfigsRepository } from '@/repositories/sales/payment-configs-repository';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import {
  createPaymentProvider,
  type ProviderName,
} from '@/services/payment/provider-registry';
import { ManualProvider } from '@/services/payment/providers/manual.provider';

interface TestPaymentConnectionUseCaseRequest {
  tenantId: string;
  slot: 'primary' | 'fallback';
}

interface TestPaymentConnectionUseCaseResponse {
  ok: boolean;
  message: string;
}

export class TestPaymentConnectionUseCase {
  constructor(private paymentConfigsRepository: PaymentConfigsRepository) {}

  async execute(
    input: TestPaymentConnectionUseCaseRequest,
  ): Promise<TestPaymentConnectionUseCaseResponse> {
    const config = await this.paymentConfigsRepository.findByTenantId(
      input.tenantId,
    );

    if (!config) {
      throw new ResourceNotFoundError('Payment configuration not found.');
    }

    const providerName =
      input.slot === 'primary'
        ? config.primaryProvider
        : config.fallbackProvider;

    const encryptedConfig =
      input.slot === 'primary' ? config.primaryConfig : config.fallbackConfig;

    if (!providerName) {
      throw new BadRequestError(`No ${input.slot} provider configured.`);
    }

    if (providerName === 'manual') {
      const manualProvider = new ManualProvider();
      const testResult = await manualProvider.testConnection();

      await this.paymentConfigsRepository.updateTestedAt(
        input.tenantId,
        input.slot,
        new Date(),
      );

      return testResult;
    }

    if (!encryptedConfig) {
      throw new BadRequestError(
        `No configuration found for ${input.slot} provider.`,
      );
    }

    const cipherService = getFieldCipherService();
    const decryptedConfigJson = cipherService.decrypt(encryptedConfig);
    const parsedConfig = JSON.parse(decryptedConfigJson);

    const provider = createPaymentProvider(
      providerName as ProviderName,
      parsedConfig,
    );

    const testResult = await provider.testConnection();

    if (testResult.ok) {
      await this.paymentConfigsRepository.updateTestedAt(
        input.tenantId,
        input.slot,
        new Date(),
      );
    }

    return testResult;
  }
}
