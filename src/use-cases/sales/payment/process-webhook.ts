import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { PaymentChargesRepository } from '@/repositories/sales/payment-charges-repository';
import type { PaymentConfigsRepository } from '@/repositories/sales/payment-configs-repository';
import { PaymentProviderFactory } from '@/services/payment/payment-provider.factory';

interface ProcessWebhookUseCaseRequest {
  providerName: string;
  payload: unknown;
  headers: Record<string, string>;
}

interface ProcessWebhookUseCaseResponse {
  processed: boolean;
  chargeId?: string;
  newStatus?: string;
}

export class ProcessWebhookUseCase {
  constructor(
    private paymentChargesRepository: PaymentChargesRepository,
    private paymentConfigsRepository: PaymentConfigsRepository,
  ) {}

  async execute(
    input: ProcessWebhookUseCaseRequest,
  ): Promise<ProcessWebhookUseCaseResponse> {
    // Instantiate the provider to parse the webhook payload.
    // For webhook processing, we instantiate a "blank" provider since
    // the provider only needs to parse the payload, not make API calls.
    // The actual provider config is not needed for handleWebhook.
    const factory = new PaymentProviderFactory();

    // We use a null config and a compatible method to get a ManualProvider first,
    // then use the provider registry to parse the webhook.
    const {
      createPaymentProvider,
    } = await import('@/services/payment/provider-registry');

    let webhookResult;

    try {
      // For webhook parsing we need a provider instance with the correct name.
      // Since webhook parsing doesn't require credentials, we instantiate with
      // empty configs just for parsing.
      const dummyConfigs: Record<string, Record<string, string>> = {
        infinitepay: { clientId: '', clientSecret: '' },
        asaas: { apiKey: '', environment: 'sandbox' },
      };

      const providerConfig = dummyConfigs[input.providerName];
      if (!providerConfig) {
        return { processed: false };
      }

      const provider = createPaymentProvider(
        input.providerName as 'infinitepay' | 'asaas',
        providerConfig as never,
      );

      webhookResult = await provider.handleWebhook(
        input.payload,
        input.headers,
      );
    } catch (error) {
      console.error(
        `[ProcessWebhook] Failed to parse webhook from ${input.providerName}:`,
        error,
      );
      return { processed: false };
    }

    if (!webhookResult.chargeId) {
      console.warn(
        `[ProcessWebhook] No chargeId found in webhook from ${input.providerName}`,
      );
      return { processed: false };
    }

    // Look up the charge by the provider's charge ID
    const charge = await this.paymentChargesRepository.findByProviderChargeId(
      webhookResult.chargeId,
    );

    if (!charge) {
      console.warn(
        `[ProcessWebhook] No charge found for providerChargeId: ${webhookResult.chargeId}`,
      );
      return { processed: false };
    }

    // Idempotent update — only updates if status is PENDING
    const affectedCount =
      await this.paymentChargesRepository.updateStatusIdempotent(
        charge.id.toString(),
        webhookResult.status,
        webhookResult.paidAmount,
        webhookResult.status === 'PAID' ? new Date() : undefined,
        { ...((webhookResult.metadata as Record<string, unknown>) ?? {}), rawPayload: input.payload },
      );

    if (affectedCount === 0) {
      // Already processed — idempotent, return success
      return {
        processed: true,
        chargeId: charge.id.toString(),
        newStatus: charge.status,
      };
    }

    return {
      processed: true,
      chargeId: charge.id.toString(),
      newStatus: webhookResult.status,
    };
  }
}
