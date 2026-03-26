import type { PixCharge } from '@/entities/cashier/pix-charge';
import type { PixChargesRepository } from '@/repositories/cashier/pix-charges-repository';
import type { PixProvider } from '@/services/cashier/pix-provider.interface';
import type { AutoRegisterPixPaymentUseCase } from '@/use-cases/finance/entries/auto-register-pix-payment';

interface ReceivePixWebhookUseCaseRequest {
  rawPayload: unknown;
  signature: string;
}

interface ReceivePixWebhookUseCaseResponse {
  pixCharge: PixCharge;
  financeEntryRegistered?: boolean;
}

export class ReceivePixWebhookUseCase {
  constructor(
    private pixChargesRepository: PixChargesRepository,
    private pixProvider: PixProvider,
    private autoRegisterPixPaymentUseCase?: AutoRegisterPixPaymentUseCase,
  ) {}

  async execute({
    rawPayload,
    signature,
  }: ReceivePixWebhookUseCaseRequest): Promise<ReceivePixWebhookUseCaseResponse> {
    const isValidSignature = this.pixProvider.verifyWebhook(
      rawPayload,
      signature,
    );

    if (!isValidSignature) {
      throw new Error('Invalid webhook signature');
    }

    const webhookEvent = await this.pixProvider.parseWebhook(rawPayload);

    const pixCharge = await this.pixChargesRepository.findByTxId(
      webhookEvent.txId,
    );

    if (!pixCharge) {
      throw new Error(`PIX charge not found for txId: ${webhookEvent.txId}`);
    }

    if (pixCharge.status !== 'ACTIVE') {
      throw new Error(
        `PIX charge is not active. Current status: ${pixCharge.status}`,
      );
    }

    pixCharge.markAsPaid(
      webhookEvent.payerName ?? '',
      webhookEvent.payerCpfCnpj ?? '',
      webhookEvent.endToEndId,
    );

    await this.pixChargesRepository.save(pixCharge);

    // Auto-register payment in finance entry if linked
    let financeEntryRegistered = false;
    if (this.autoRegisterPixPaymentUseCase) {
      try {
        const autoResult = await this.autoRegisterPixPaymentUseCase.execute({
          txId: webhookEvent.txId,
          amount: webhookEvent.amount,
          paidAt: webhookEvent.paidAt,
          payerName: webhookEvent.payerName,
          endToEndId: webhookEvent.endToEndId,
        });
        financeEntryRegistered = autoResult.registered;
      } catch {
        // Auto-registration failure should not break the webhook processing
      }
    }

    return { pixCharge, financeEntryRegistered };
  }
}
