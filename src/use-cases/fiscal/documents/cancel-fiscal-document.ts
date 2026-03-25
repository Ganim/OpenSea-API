import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { FiscalDocument } from '@/entities/fiscal/fiscal-document';
import { FiscalDocumentEvent } from '@/entities/fiscal/fiscal-document-event';
import type { FiscalConfigsRepository } from '@/repositories/fiscal/fiscal-configs-repository';
import type { FiscalDocumentEventsRepository } from '@/repositories/fiscal/fiscal-document-events-repository';
import type { FiscalDocumentsRepository } from '@/repositories/fiscal/fiscal-documents-repository';
import type { FiscalProvider } from '@/services/fiscal/fiscal-provider.interface';

interface CancelFiscalDocumentUseCaseRequest {
  tenantId: string;
  documentId: string;
  reason: string;
}

interface CancelFiscalDocumentUseCaseResponse {
  fiscalDocument: FiscalDocument;
}

export class CancelFiscalDocumentUseCase {
  constructor(
    private fiscalConfigsRepository: FiscalConfigsRepository,
    private fiscalDocumentsRepository: FiscalDocumentsRepository,
    private fiscalDocumentEventsRepository: FiscalDocumentEventsRepository,
    private fiscalProvider: FiscalProvider,
  ) {}

  async execute(
    request: CancelFiscalDocumentUseCaseRequest,
  ): Promise<CancelFiscalDocumentUseCaseResponse> {
    const fiscalDocument = await this.fiscalDocumentsRepository.findById(
      request.documentId,
    );

    if (
      !fiscalDocument ||
      fiscalDocument.tenantId.toString() !== request.tenantId
    ) {
      throw new ResourceNotFoundError('Fiscal document not found.');
    }

    if (!fiscalDocument.canBeCancelled) {
      throw new BadRequestError(
        `Document with status "${fiscalDocument.status}" cannot be cancelled. Only AUTHORIZED documents can be cancelled.`,
      );
    }

    if (!fiscalDocument.isWithinCancellationWindow()) {
      throw new BadRequestError(
        `Cancellation window of ${fiscalDocument.cancellationWindowHours}h has expired for this ${fiscalDocument.type}.`,
      );
    }

    if (request.reason.length < 15) {
      throw new BadRequestError(
        'Cancellation reason must be at least 15 characters long (SEFAZ requirement).',
      );
    }

    const fiscalConfig = await this.fiscalConfigsRepository.findByTenantId(
      request.tenantId,
    );

    if (!fiscalConfig) {
      throw new ResourceNotFoundError('Fiscal configuration not found.');
    }

    const cancelResult = await this.fiscalProvider.cancelDocument(
      fiscalDocument.accessKey!,
      request.reason,
      fiscalConfig,
    );

    const cancellationEvent = FiscalDocumentEvent.create({
      fiscalDocumentId: fiscalDocument.id,
      type: 'CANCELLATION',
      description: cancelResult.success
        ? `Document ${fiscalDocument.number} cancelled successfully`
        : `Document ${fiscalDocument.number} cancellation failed: ${cancelResult.errorMessage}`,
      protocol: cancelResult.protocol,
      xmlResponse: cancelResult.xml,
      success: cancelResult.success,
      errorCode: cancelResult.errorCode,
      errorMessage: cancelResult.errorMessage,
    });

    await this.fiscalDocumentEventsRepository.create(cancellationEvent);

    if (cancelResult.success) {
      fiscalDocument.cancel(request.reason);
      if (cancelResult.xml) {
        fiscalDocument.xmlCancellation = cancelResult.xml;
      }
      await this.fiscalDocumentsRepository.save(fiscalDocument);
    } else {
      throw new BadRequestError(
        `Failed to cancel document: ${cancelResult.errorMessage ?? 'Unknown error from provider'}`,
      );
    }

    return { fiscalDocument };
  }
}
