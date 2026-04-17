import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelopesRepository } from '@/repositories/signature/signature-envelopes-repository';
import type { SignatureEnvelopeSignersRepository } from '@/repositories/signature/signature-envelope-signers-repository';
import type { SignatureAuditEventsRepository } from '@/repositories/signature/signature-audit-events-repository';
import type { SignatureEmailService } from '@/services/signature/signature-email-service';

interface ResendNotificationsUseCaseRequest {
  tenantId: string;
  envelopeId: string;
}

interface ResendNotificationsUseCaseResponse {
  notifiedCount: number;
  emailDeliveryErrors: string[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function computeDaysRemaining(expiresAt: Date | null): number | null {
  if (!expiresAt) return null;
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / MS_PER_DAY);
}

export class ResendNotificationsUseCase {
  constructor(
    private envelopesRepository: SignatureEnvelopesRepository,
    private signersRepository: SignatureEnvelopeSignersRepository,
    private auditEventsRepository: SignatureAuditEventsRepository,
    private signatureEmailService?: SignatureEmailService,
  ) {}

  async execute(
    request: ResendNotificationsUseCaseRequest,
  ): Promise<ResendNotificationsUseCaseResponse> {
    const envelope = await this.envelopesRepository.findById(
      new UniqueEntityID(request.envelopeId),
      request.tenantId,
    );

    if (!envelope) {
      throw new ResourceNotFoundError('Envelope not found');
    }

    const signers = await this.signersRepository.findByEnvelopeId(
      request.envelopeId,
    );

    const pendingSigners = signers.filter(
      (signer) => !['SIGNED', 'REJECTED', 'EXPIRED'].includes(signer.status),
    );

    for (const pendingSigner of pendingSigners) {
      await this.signersRepository.update({
        id: pendingSigner.id.toString(),
        lastNotifiedAt: new Date(),
        notificationCount: pendingSigner.notificationCount + 1,
      });
    }

    const emailDeliveryErrors: string[] = [];
    if (this.signatureEmailService && pendingSigners.length > 0) {
      const daysRemaining = computeDaysRemaining(envelope.expiresAt);

      for (const pendingSigner of pendingSigners) {
        const hasEmail =
          pendingSigner.userId === null &&
          pendingSigner.externalEmail !== null &&
          pendingSigner.accessToken !== null;

        if (!hasEmail) continue;

        try {
          const deliveryResult = await this.signatureEmailService.sendReminder({
            to: pendingSigner.externalEmail as string,
            signerName: pendingSigner.displayName,
            envelopeTitle: envelope.title,
            accessToken: pendingSigner.accessToken as string,
            daysRemaining,
          });

          if (!deliveryResult.success) {
            emailDeliveryErrors.push(
              `Failed to send reminder to ${pendingSigner.externalEmail}: ${deliveryResult.message ?? 'unknown error'}`,
            );
          }
        } catch (error) {
          emailDeliveryErrors.push(
            `Reminder email error for ${pendingSigner.externalEmail}: ${error instanceof Error ? error.message : 'unknown error'}`,
          );
        }
      }
    }

    if (pendingSigners.length > 0) {
      await this.auditEventsRepository.create({
        envelopeId: request.envelopeId,
        tenantId: request.tenantId,
        type: 'REMINDED',
        description: `Reminder sent to ${pendingSigners.length} pending signer(s)`,
      });
    }

    return {
      notifiedCount: pendingSigners.length,
      emailDeliveryErrors,
    };
  }
}
