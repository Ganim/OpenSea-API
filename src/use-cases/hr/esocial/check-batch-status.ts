import { prisma } from '@/lib/prisma';
import { CertificateManager } from '@/services/esocial/crypto/certificate-manager';
import { EsocialSoapClient } from '@/services/esocial/transmitter/soap-client';
import { calculateNextRetry } from '@/services/esocial/transmitter/retry-handler';
import { env } from '@/@env';

export interface CheckBatchStatusRequest {
  tenantId: string;
  batchId: string;
}

export interface CheckBatchStatusResponse {
  batchId: string;
  status: string;
  acceptedCount: number;
  rejectedCount: number;
  events: Array<{
    id: string;
    status: string;
    receipt?: string;
    rejectionCode?: string;
    rejectionMessage?: string;
  }>;
}

export class CheckBatchStatusUseCase {
  private certManager = new CertificateManager();
  private soapClient = new EsocialSoapClient();

  async execute(
    request: CheckBatchStatusRequest,
  ): Promise<CheckBatchStatusResponse> {
    const { tenantId, batchId } = request;

    // 1. Get batch
    const batch = await prisma.esocialBatch.findFirst({
      where: { id: batchId, tenantId },
      include: { events: true },
    });

    if (!batch) {
      throw new Error('Lote não encontrado.');
    }

    if (!batch.protocol) {
      throw new Error('Lote não possui protocolo. Transmita o lote primeiro.');
    }

    // 2. Get config
    const config = await prisma.esocialConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      throw new Error('Configuração do eSocial não encontrada.');
    }

    // 3. Get and decrypt certificate
    const certificate = await prisma.esocialCertificate.findUnique({
      where: { tenantId },
    });

    if (!certificate) {
      throw new Error('Certificado digital não encontrado.');
    }

    const encryptionKey = env.ESOCIAL_ENCRYPTION_KEY || env.JWT_SECRET;
    const pfxBuffer = await this.certManager.decrypt(
      Buffer.from(certificate.encryptedPfx),
      encryptionKey,
      certificate.encryptionIv,
      certificate.encryptionTag,
    );

    // 4. Check status via SOAP
    const result = await this.soapClient.checkBatchStatus(
      batch.protocol,
      config.environment,
      { pfx: pfxBuffer, passphrase: '' },
    );

    // 5. Update events based on response
    let acceptedCount = 0;
    let rejectedCount = 0;
    const eventResults: CheckBatchStatusResponse['events'] = [];

    for (const eventResult of result.events) {
      const event = batch.events.find((e) => e.id === eventResult.id);
      if (!event) continue;

      const isAccepted = eventResult.receipt && !eventResult.rejectionCode;

      if (isAccepted) {
        acceptedCount++;
        await prisma.esocialEvent.update({
          where: { id: event.id },
          data: {
            status: 'ACCEPTED',
            receipt: eventResult.receipt,
          },
        });
      } else {
        rejectedCount++;
        const nextRetry = calculateNextRetry(event.retryCount);

        await prisma.esocialEvent.update({
          where: { id: event.id },
          data: {
            status: 'REJECTED',
            rejectionCode: eventResult.rejectionCode,
            rejectionMessage: eventResult.rejectionMessage,
            retryCount: { increment: 1 },
            nextRetryAt: nextRetry,
          },
        });
      }

      eventResults.push({
        id: event.id,
        status: isAccepted ? 'ACCEPTED' : 'REJECTED',
        receipt: eventResult.receipt,
        rejectionCode: eventResult.rejectionCode,
        rejectionMessage: eventResult.rejectionMessage,
      });
    }

    // 6. Update batch status
    let batchStatus: string;
    if (rejectedCount === 0 && acceptedCount > 0) {
      batchStatus = 'ACCEPTED';
    } else if (acceptedCount === 0 && rejectedCount > 0) {
      batchStatus = 'REJECTED';
    } else if (acceptedCount > 0 && rejectedCount > 0) {
      batchStatus = 'PARTIALLY_ACCEPTED';
    } else {
      batchStatus = batch.status;
    }

    await prisma.esocialBatch.update({
      where: { id: batch.id },
      data: {
        status: batchStatus as 'ACCEPTED' | 'REJECTED' | 'PARTIALLY_ACCEPTED',
        acceptedCount,
        rejectedCount,
        checkedAt: new Date(),
      },
    });

    return {
      batchId: batch.id,
      status: batchStatus,
      acceptedCount,
      rejectedCount,
      events: eventResults,
    };
  }
}
