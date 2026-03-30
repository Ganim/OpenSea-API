import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { prisma } from '@/lib/prisma';
import { XmlSigner } from '@/services/esocial/crypto/xml-signer';
import { CertificateManager } from '@/services/esocial/crypto/certificate-manager';
import { EsocialSoapClient } from '@/services/esocial/transmitter/soap-client';
import { calculateNextRetry } from '@/services/esocial/transmitter/retry-handler';
import { env } from '@/@env';

const MAX_EVENTS_PER_BATCH = 50;

export interface TransmitBatchRequest {
  tenantId: string;
  userId: string;
}

export interface TransmitBatchResponse {
  batchId: string;
  protocol?: string;
  eventCount: number;
  status: string;
}

export class TransmitBatchUseCase {
  private xmlSigner = new XmlSigner();
  private certManager = new CertificateManager();
  private soapClient = new EsocialSoapClient();

  async execute(
    request: TransmitBatchRequest,
  ): Promise<TransmitBatchResponse[]> {
    const { tenantId, userId } = request;

    // 1. Get tenant eSocial config
    const config = await prisma.esocialConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      throw new ResourceNotFoundError(
        'Configuração do eSocial não encontrada. Configure o eSocial antes de transmitir.',
      );
    }

    // 2. Get certificate
    const certificate = await prisma.esocialCertificate.findUnique({
      where: { tenantId },
    });

    if (!certificate) {
      throw new ResourceNotFoundError(
        'Certificado digital não encontrado. Faça o upload do certificado antes de transmitir.',
      );
    }

    // Check expiry
    if (this.certManager.isExpired(certificate.validUntil)) {
      throw new BadRequestError(
        'Certificado digital expirado. Faça o upload de um novo certificado.',
      );
    }

    // 3. Decrypt PFX
    const encryptionKey = env.ESOCIAL_ENCRYPTION_KEY || env.JWT_SECRET;
    const pfxBuffer = await this.certManager.decrypt(
      Buffer.from(certificate.encryptedPfx),
      encryptionKey,
      certificate.encryptionIv,
      certificate.encryptionTag,
    );

    // Parse certificate to get private key and cert
    const certInfo = await this.certManager.parsePfx(pfxBuffer, '');

    // 4. Get all APPROVED events
    const approvedEvents = await prisma.esocialEvent.findMany({
      where: {
        tenantId,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (approvedEvents.length === 0) {
      throw new BadRequestError('Nenhum evento aprovado encontrado para transmissão.');
    }

    // 5. Group into batches of max 50 events
    const batches: (typeof approvedEvents)[] = [];
    for (let i = 0; i < approvedEvents.length; i += MAX_EVENTS_PER_BATCH) {
      batches.push(approvedEvents.slice(i, i + MAX_EVENTS_PER_BATCH));
    }

    const results: TransmitBatchResponse[] = [];

    // 6. Process each batch
    for (const batchEvents of batches) {
      // Create batch record
      const batch = await prisma.esocialBatch.create({
        data: {
          tenantId,
          status: 'TRANSMITTING',
          environment: config.environment,
          totalEvents: batchEvents.length,
          createdBy: userId,
        },
      });

      try {
        // Sign each event
        const signedEvents: Array<{ id: string; xml: string }> = [];
        for (const event of batchEvents) {
          if (!event.xmlContent) {
            continue;
          }

          const signedXml = await this.xmlSigner.sign(
            event.xmlContent,
            certInfo.privateKey,
            certInfo.certificate,
          );

          signedEvents.push({ id: event.id, xml: signedXml });

          // Update event with signed XML
          await prisma.esocialEvent.update({
            where: { id: event.id },
            data: {
              signedXml,
              status: 'TRANSMITTING',
              batchId: batch.id,
            },
          });
        }

        // Transmit batch
        const result = await this.soapClient.sendBatch(
          signedEvents,
          config.environment,
          { pfx: pfxBuffer, passphrase: '' },
        );

        // Update batch with protocol
        await prisma.esocialBatch.update({
          where: { id: batch.id },
          data: {
            protocol: result.protocol,
            status: 'TRANSMITTED',
            transmittedAt: new Date(),
          },
        });

        results.push({
          batchId: batch.id,
          protocol: result.protocol,
          eventCount: signedEvents.length,
          status: 'TRANSMITTED',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';

        // Calculate retry
        const nextRetry = calculateNextRetry(0);

        // Update batch with error
        await prisma.esocialBatch.update({
          where: { id: batch.id },
          data: {
            status: 'ERROR',
            errorMessage,
            retryCount: 1,
            nextRetryAt: nextRetry,
          },
        });

        // Revert events back to APPROVED
        await prisma.esocialEvent.updateMany({
          where: { batchId: batch.id },
          data: {
            status: 'APPROVED',
            batchId: null,
            retryCount: { increment: 1 },
            nextRetryAt: nextRetry,
          },
        });

        results.push({
          batchId: batch.id,
          eventCount: batchEvents.length,
          status: 'ERROR',
        });
      }
    }

    return results;
  }
}
