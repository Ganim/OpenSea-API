import type { PixCharge } from '@/entities/cashier/pix-charge';
import type { PixChargesRepository } from '@/repositories/cashier/pix-charges-repository';
import type { PixProvider } from '@/services/cashier/pix-provider.interface';

interface ReceivePixWebhookUseCaseRequest {
  rawPayload: unknown;
  signature: string;
}

interface ReceivePixWebhookUseCaseResponse {
  pixCharge: PixCharge;
}

export class ReceivePixWebhookUseCase {
  constructor(
    private pixChargesRepository: PixChargesRepository,
    private pixProvider: PixProvider,
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

    return { pixCharge };
  }
}
