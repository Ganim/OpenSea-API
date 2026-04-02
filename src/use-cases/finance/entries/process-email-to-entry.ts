import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { getImapConnectionPool } from '@/services/email/imap-connection-pool';
import type {
  OcrExtractDataUseCase,
  OcrExtractResult,
} from './ocr-extract-data';
import type { CreateFinanceEntryUseCase } from './create-finance-entry';

// ============================================================================
// TYPES
// ============================================================================

interface ProcessEmailToEntryRequest {
  tenantId: string;
}

interface ProcessedEmailInfo {
  messageId: string;
  subject: string;
  status: 'created' | 'draft' | 'skipped' | 'failed';
  error?: string;
  entryId?: string;
}

interface ProcessEmailToEntryResponse {
  processed: number;
  created: number;
  failed: number;
  skipped: number;
  entries: ProcessedEmailInfo[];
}

export interface EmailToEntryConfig {
  id: string;
  tenantId: string;
  emailAccountId: string;
  monitoredFolder: string;
  isActive: boolean;
  autoCreate: boolean;
  defaultType: string;
  defaultCategoryId: string | null;
  processedCount: number;
  lastProcessedAt: Date | null;
}

// ============================================================================
// USE CASE
// ============================================================================

export class ProcessEmailToEntryUseCase {
  constructor(
    private ocrExtractDataUseCase: OcrExtractDataUseCase,
    private createFinanceEntryUseCase: CreateFinanceEntryUseCase,
    private credentialCipherService: CredentialCipherService,
  ) {}

  async execute(
    request: ProcessEmailToEntryRequest,
  ): Promise<ProcessEmailToEntryResponse> {
    const { tenantId } = request;

    // 1. Fetch config
    const config = await prisma.emailToEntryConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      return { processed: 0, created: 0, failed: 0, skipped: 0, entries: [] };
    }

    if (!config.isActive) {
      return { processed: 0, created: 0, failed: 0, skipped: 0, entries: [] };
    }

    // 2. Fetch email account
    const account = await prisma.emailAccount.findFirst({
      where: { id: config.emailAccountId, tenantId, isActive: true },
    });

    if (!account) {
      logger.warn(
        { tenantId, emailAccountId: config.emailAccountId },
        'Email-to-entry: email account not found or inactive',
      );
      return { processed: 0, created: 0, failed: 0, skipped: 0, entries: [] };
    }

    // 3. Decrypt credentials
    const decryptResult = this.credentialCipherService.decryptWithRotation(
      account.encryptedSecret,
    );

    // 4. Connect to IMAP
    const pool = getImapConnectionPool();
    let client;

    try {
      client = await pool.acquire(account.id, {
        host: account.imapHost,
        port: account.imapPort,
        secure: account.imapSecure,
        username: account.username,
        secret: decryptResult.plainText,
        rejectUnauthorized: account.tlsVerify,
      });
    } catch (error) {
      logger.error(
        { err: error, tenantId },
        'Email-to-entry: IMAP connection failed',
      );
      return { processed: 0, created: 0, failed: 0, skipped: 0, entries: [] };
    }

    const results: ProcessedEmailInfo[] = [];
    let created = 0;
    let failed = 0;
    let skipped = 0;

    try {
      // 5. Open monitored folder
      let lock;
      try {
        lock = await client.getMailboxLock(config.monitoredFolder);
      } catch {
        logger.warn(
          { tenantId, folder: config.monitoredFolder },
          'Email-to-entry: monitored folder not found',
        );
        return { processed: 0, created: 0, failed: 0, skipped: 0, entries: [] };
      }

      try {
        // 6. Fetch unseen messages
        const messages: Array<{
          uid: number;
          envelope: { subject?: string; messageId?: string };
          bodyStructure: unknown;
        }> = [];

        for await (const msg of client.fetch(
          '1:*',
          {
            uid: true,
            envelope: true,
            bodyStructure: true,
            flags: true,
          },
          { uid: true },
        )) {
          // Only process unseen messages
          const flags = (msg as unknown as { flags: Set<string> }).flags;
          if (flags && !flags.has('\\Seen')) {
            messages.push(msg as unknown as (typeof messages)[0]);
          }
        }

        // 7. Process each message with attachments
        for (const msg of messages) {
          const subject = msg.envelope?.subject ?? 'Sem assunto';
          const messageId = msg.envelope?.messageId ?? String(msg.uid);

          try {
            // Find PDF/image attachments in bodyStructure
            const attachmentParts = this.findAttachmentParts(msg.bodyStructure);

            if (attachmentParts.length === 0) {
              // No relevant attachments - skip
              skipped++;
              results.push({
                messageId,
                subject,
                status: 'skipped',
              });
              continue;
            }

            // Process first suitable attachment
            const part = attachmentParts[0];
            let ocrResult: OcrExtractResult | null = null;

            try {
              // Download attachment
              const downloaded = await client.download(
                String(msg.uid),
                part.partId,
                { uid: true },
              );
              const chunks: Buffer[] = [];
              for await (const chunk of downloaded.content) {
                chunks.push(
                  Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
                );
              }
              const buffer = Buffer.concat(chunks);

              // Run OCR
              ocrResult = await this.ocrExtractDataUseCase.execute({
                buffer,
                mimeType: part.mimeType,
                tenantId,
              });
            } catch (_ocrError) {
              // OCR failed - try to extract from subject/filename
              ocrResult = await this.extractFromMetadata(
                subject,
                part.filename,
                tenantId,
              );
            }

            // Extract data
            const data = ocrResult?.extractedData;
            const amount = data?.valor;
            const dueDateStr = data?.vencimento;
            const supplierName =
              data?.beneficiario ?? this.extractSupplierFromSubject(subject);
            const description = this.buildDescription(
              subject,
              supplierName,
              part.filename,
            );

            if (!amount || amount <= 0) {
              // Cannot create entry without amount
              skipped++;
              results.push({
                messageId,
                subject,
                status: 'skipped',
                error: 'Valor não identificado no documento',
              });
              continue;
            }

            // Parse due date
            const dueDate = dueDateStr ? new Date(dueDateStr) : new Date();
            if (isNaN(dueDate.getTime())) {
              dueDate.setTime(Date.now());
            }

            // Ensure dueDate >= issueDate
            const issueDate = new Date();
            if (dueDate < issueDate) {
              // Past due date is OK - just keep it
            }

            // Create the finance entry
            const entryType =
              config.defaultType === 'RECEIVABLE' ? 'RECEIVABLE' : 'PAYABLE';

            // We need a category - use default or skip
            if (!config.defaultCategoryId) {
              skipped++;
              results.push({
                messageId,
                subject,
                status: 'skipped',
                error: 'Categoria padrão não configurada',
              });
              continue;
            }

            // Find a cost center for the tenant
            const costCenter = await prisma.costCenter.findFirst({
              where: { tenantId, isActive: true },
              orderBy: { createdAt: 'asc' },
            });

            if (!costCenter) {
              skipped++;
              results.push({
                messageId,
                subject,
                status: 'skipped',
                error: 'Nenhum centro de custo ativo encontrado',
              });
              continue;
            }

            const entryResult = await this.createFinanceEntryUseCase.execute({
              tenantId,
              type: entryType as 'PAYABLE' | 'RECEIVABLE',
              description,
              categoryId: config.defaultCategoryId,
              costCenterId: costCenter.id,
              expectedAmount: amount,
              issueDate,
              dueDate,
              supplierName: supplierName ?? undefined,
              boletoBarcode: data?.codigoBarras ?? undefined,
              boletoDigitLine: data?.linhaDigitavel ?? undefined,
              beneficiaryName: data?.beneficiario ?? undefined,
              tags: ['email-to-entry', 'automático'],
            });

            // Mark message as read
            try {
              await client.messageFlagsAdd(String(msg.uid), ['\\Seen'], {
                uid: true,
              });
            } catch {
              // Non-critical
            }

            created++;
            results.push({
              messageId,
              subject,
              status: config.autoCreate ? 'created' : 'draft',
              entryId: entryResult.entry.id,
            });
          } catch (msgError) {
            failed++;
            const errorMsg =
              msgError instanceof Error ? msgError.message : String(msgError);
            logger.error(
              { err: msgError, tenantId, messageId },
              'Email-to-entry: failed to process message',
            );
            results.push({
              messageId,
              subject,
              status: 'failed',
              error: errorMsg,
            });
          }
        }
      } finally {
        lock.release();
      }

      // 8. Update config stats
      const totalProcessed = created + failed + skipped;
      await prisma.emailToEntryConfig.update({
        where: { tenantId },
        data: {
          processedCount: { increment: created },
          lastProcessedAt: new Date(),
        },
      });

      return {
        processed: totalProcessed,
        created,
        failed,
        skipped,
        entries: results,
      };
    } catch (error) {
      logger.error(
        { err: error, tenantId },
        'Email-to-entry: processing failed',
      );
      pool.destroy(account.id);
      throw error;
    } finally {
      pool.release(account.id);
    }
  }

  private findAttachmentParts(
    bodyStructure: Record<string, unknown>,
  ): Array<{ partId: string; mimeType: string; filename: string }> {
    const parts: Array<{ partId: string; mimeType: string; filename: string }> =
      [];
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    const walk = (node: Record<string, unknown>, partId = '1') => {
      if (!node) return;

      const type = String(node.type ?? '').toLowerCase();
      const subtype = String(node.subtype ?? '').toLowerCase();
      const mimeType = `${type}/${subtype}`;

      if (allowedTypes.includes(mimeType)) {
        const disposition = node.disposition as
          | Record<string, unknown>
          | undefined;
        const params = (node.parameters ?? disposition?.params ?? {}) as Record<
          string,
          string
        >;
        const filename =
          params.name ?? params.filename ?? `attachment.${subtype}`;

        parts.push({
          partId: String(node.part ?? partId),
          mimeType,
          filename: String(filename),
        });
      }

      const childNodes = node.childNodes as
        | Array<Record<string, unknown>>
        | undefined;
      if (Array.isArray(childNodes)) {
        childNodes.forEach((child, i) => {
          walk(child, `${partId}.${i + 1}`);
        });
      }
    };

    walk(bodyStructure as Record<string, unknown>);
    return parts;
  }

  private extractSupplierFromSubject(subject: string): string | null {
    // Try to extract a company name from common patterns
    const patterns = [
      /(?:nf|nota fiscal|boleto|fatura|cobrança)\s*(?:de|:|-)\s*(.+)/i,
      /(?:pagamento|conta)\s*(?:de|:|-)\s*(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = subject.match(pattern);
      if (match) {
        const name = match[1]
          .trim()
          .split(/\s*[-–|]\s*/)[0]
          .trim();
        if (name.length > 2 && name.length <= 256) return name;
      }
    }

    return null;
  }

  private buildDescription(
    subject: string,
    supplierName: string | null,
    _filename: string,
  ): string {
    if (supplierName) {
      return `[E-mail] ${subject} - ${supplierName}`.substring(0, 500);
    }
    return `[E-mail] ${subject}`.substring(0, 500);
  }

  private async extractFromMetadata(
    subject: string,
    filename: string,
    tenantId: string,
  ): Promise<OcrExtractResult> {
    // Fallback: try to extract financial data from subject and filename
    const combinedText = `${subject}\n${filename}`;
    return this.ocrExtractDataUseCase.execute({ text: combinedText, tenantId });
  }
}
