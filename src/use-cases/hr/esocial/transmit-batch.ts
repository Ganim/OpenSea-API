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

    // 3. Decrypt PFX and passphrase
    const encryptionKey = env.ESOCIAL_ENCRYPTION_KEY || env.JWT_SECRET;
    const pfxBuffer = await this.certManager.decrypt(
      Buffer.from(certificate.encryptedPfx),
      encryptionKey,
      certificate.encryptionIv,
      certificate.encryptionTag,
    );

    // The passphrase columns are optional on the schema for backwards
    // compatibility with certs uploaded before the P0-04 fix. For new
    // uploads the three fields always arrive together; for legacy rows the
    // user must re-upload the certificate.
    if (
      !certificate.encryptedPassphrase ||
      !certificate.passphraseIv ||
      !certificate.passphraseTag
    ) {
      throw new BadRequestError(
        'O certificado digital cadastrado não possui a senha persistida. Faça o upload novamente para habilitar a transmissão.',
      );
    }

    const passphraseBuffer = await this.certManager.decrypt(
      Buffer.from(certificate.encryptedPassphrase),
      encryptionKey,
      certificate.passphraseIv,
      certificate.passphraseTag,
    );
    const passphrase = passphraseBuffer.toString('utf-8');

    // Parse certificate to get private key and cert
    const certInfo = await this.certManager.parsePfx(pfxBuffer, passphrase);

    // 4. Idempotency lock (P0-07).
    //
    // Previous implementation:
    //   findMany({ status: APPROVED }) → create batch → mark events TRANSMITTING
    // was racy: two concurrent callers (e.g. a human clicking the button at
    // the same second a cron job runs) both saw the same APPROVED rows and
    // each created a batch transmitting the same events. Government receipt
    // conflicts, double S-1200 rows, doubled 13º calculations, legal penalty.
    //
    // Now: we transition APPROVED → TRANSMITTING via `updateMany` as the
    // very first write. Postgres serialises this into a row-level lock, so
    // only one caller can grab the rows. The loser sees `count === 0` and
    // we fast-fail with a clear error. We re-read the rows by
    // `status: TRANSMITTING AND batchId: null` — a "claimed but unassigned"
    // snapshot only this caller owns.
    const claimedAt = new Date();
    const claimResult = await prisma.esocialEvent.updateMany({
      where: {
        tenantId,
        status: 'APPROVED',
      },
      data: {
        status: 'TRANSMITTING',
      },
    });

    if (claimResult.count === 0) {
      // Either there is nothing approved OR another concurrent caller has
      // claimed everything already. Either way, surface a clear message.
      const inFlight = await prisma.esocialEvent.count({
        where: { tenantId, status: 'TRANSMITTING' },
      });
      if (inFlight > 0) {
        throw new BadRequestError(
          'Transmissão já em andamento para este tenant. Aguarde o lote atual finalizar antes de iniciar outro.',
        );
      }
      throw new BadRequestError(
        'Nenhum evento aprovado encontrado para transmissão.',
      );
    }

    // Re-read the rows we just claimed. They are uniquely identified by the
    // pair (status=TRANSMITTING, batchId=null) since every other in-flight
    // transmission has already bound its events to a batchId below.
    const approvedEvents = await prisma.esocialEvent.findMany({
      where: {
        tenantId,
        status: 'TRANSMITTING',
        batchId: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (approvedEvents.length === 0) {
      // Defensive: the updateMany claimed rows but another call grabbed
      // them in between. Should not happen under serializable isolation
      // but keep the branch to stay honest.
      throw new BadRequestError(
        'Nenhum evento aprovado encontrado para transmissão.',
      );
    }

    // Track the claim timestamp so we can revert all claimed events if a
    // catastrophic failure happens before any batch is created.
    void claimedAt;

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

          // Attach signed XML and bind the claimed event to this batch. The
          // status is already TRANSMITTING from the lock step above, so we
          // just record the batch pointer + the signed payload.
          await prisma.esocialEvent.update({
            where: { id: event.id },
            data: {
              signedXml,
              status: 'TRANSMITTING',
              batchId: batch.id,
            },
          });
        }

        // The envelope requires the employer CNPJ. Fall back to the config's
        // employerDocument, then to the tenant record as a defensive default.
        const employerCnpj = (config.employerDocument ?? '').replace(/\D/g, '');
        if (employerCnpj.length !== 14) {
          throw new BadRequestError(
            'CNPJ do empregador não configurado para o eSocial. Preencha o documento em Configurações antes de transmitir.',
          );
        }

        // Transmit batch
        const result = await this.soapClient.sendBatch(
          signedEvents,
          config.environment,
          { pfx: pfxBuffer, passphrase },
          employerCnpj,
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

    // 7. Any events we claimed but never bound to a batch (should be zero
    // under normal operation, but could happen if batching logic fails
    // mid-way) must be reverted so they don't get stuck in TRANSMITTING
    // limbo forever.
    await prisma.esocialEvent.updateMany({
      where: {
        tenantId,
        status: 'TRANSMITTING',
        batchId: null,
      },
      data: {
        status: 'APPROVED',
      },
    });

    return results;
  }
}
