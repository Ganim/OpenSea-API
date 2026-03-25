import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { FiscalDocument } from '@/entities/fiscal/fiscal-document';
import { FiscalDocumentEvent } from '@/entities/fiscal/fiscal-document-event';
import type { FiscalConfigsRepository } from '@/repositories/fiscal/fiscal-configs-repository';
import type { FiscalDocumentEventsRepository } from '@/repositories/fiscal/fiscal-document-events-repository';
import type { FiscalDocumentsRepository } from '@/repositories/fiscal/fiscal-documents-repository';
import type { FiscalProvider } from '@/services/fiscal/fiscal-provider.interface';

interface CorrectionLetterUseCaseRequest {
  tenantId: string;
  documentId: string;
  correctionText: string;
}

interface CorrectionLetterUseCaseResponse {
  fiscalDocument: FiscalDocument;
}

export class CorrectionLetterUseCase {
  constructor(
    private fiscalConfigsRepository: FiscalConfigsRepository,
    private fiscalDocumentsRepository: FiscalDocumentsRepository,
    private fiscalDocumentEventsRepository: FiscalDocumentEventsRepository,
    private fiscalProvider: FiscalProvider,
  ) {}

  async execute(
    request: CorrectionLetterUseCaseRequest,
  ): Promise<CorrectionLetterUseCaseResponse> {
    const fiscalDocument = await this.fiscalDocumentsRepository.findById(
      request.documentId,
    );

    if (
      !fiscalDocument ||
      fiscalDocument.tenantId.toString() !== request.tenantId
    ) {
      throw new ResourceNotFoundError('Fiscal document not found.');
    }

    if (!fiscalDocument.canReceiveCorrectionLetter) {
      throw new BadRequestError(
        'Correction letters can only be sent for authorized NF-e documents.',
      );
    }

    if (request.correctionText.length < 15) {
      throw new BadRequestError(
        'Correction text must be at least 15 characters long (SEFAZ requirement).',
      );
    }

    if (request.correctionText.length > 1000) {
      throw new BadRequestError(
        'Correction text must not exceed 1000 characters.',
      );
    }

    const fiscalConfig = await this.fiscalConfigsRepository.findByTenantId(
      request.tenantId,
    );

    if (!fiscalConfig) {
      throw new ResourceNotFoundError('Fiscal configuration not found.');
    }

    const correctionResult = await this.fiscalProvider.correctionLetter(
      fiscalDocument.accessKey!,
      request.correctionText,
      fiscalConfig,
    );

    const correctionEvent = FiscalDocumentEvent.create({
      fiscalDocumentId: fiscalDocument.id,
      type: 'CORRECTION_LETTER',
      description: correctionResult.success
        ? `Correction letter sent for document ${fiscalDocument.number}`
        : `Correction letter failed for document ${fiscalDocument.number}: ${correctionResult.errorMessage}`,
      protocol: correctionResult.protocol,
      xmlResponse: correctionResult.xml,
      success: correctionResult.success,
      errorCode: correctionResult.errorCode,
      errorMessage: correctionResult.errorMessage,
    });

    await this.fiscalDocumentEventsRepository.create(correctionEvent);

    if (correctionResult.success) {
      fiscalDocument.markAsCorrected(request.correctionText);
      await this.fiscalDocumentsRepository.save(fiscalDocument);
    } else {
      throw new BadRequestError(
        `Failed to send correction letter: ${correctionResult.errorMessage ?? 'Unknown error from provider'}`,
      );
    }

    return { fiscalDocument };
  }
}
