import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { FiscalDocument } from '@/entities/fiscal/fiscal-document';
import type { FiscalDocumentEvent } from '@/entities/fiscal/fiscal-document-event';
import type { FiscalDocumentItem } from '@/entities/fiscal/fiscal-document-item';
import type { FiscalDocumentEventsRepository } from '@/repositories/fiscal/fiscal-document-events-repository';
import type { FiscalDocumentItemsRepository } from '@/repositories/fiscal/fiscal-document-items-repository';
import type { FiscalDocumentsRepository } from '@/repositories/fiscal/fiscal-documents-repository';

interface GetFiscalDocumentUseCaseRequest {
  tenantId: string;
  documentId: string;
}

interface GetFiscalDocumentUseCaseResponse {
  fiscalDocument: FiscalDocument;
  documentItems: FiscalDocumentItem[];
  documentEvents: FiscalDocumentEvent[];
}

export class GetFiscalDocumentUseCase {
  constructor(
    private fiscalDocumentsRepository: FiscalDocumentsRepository,
    private fiscalDocumentItemsRepository: FiscalDocumentItemsRepository,
    private fiscalDocumentEventsRepository: FiscalDocumentEventsRepository,
  ) {}

  async execute(
    request: GetFiscalDocumentUseCaseRequest,
  ): Promise<GetFiscalDocumentUseCaseResponse> {
    const fiscalDocument = await this.fiscalDocumentsRepository.findById(
      request.documentId,
    );

    if (
      !fiscalDocument ||
      fiscalDocument.tenantId.toString() !== request.tenantId
    ) {
      throw new ResourceNotFoundError('Fiscal document not found.');
    }

    const documentItems =
      await this.fiscalDocumentItemsRepository.findByDocumentId(
        request.documentId,
      );

    const documentEvents =
      await this.fiscalDocumentEventsRepository.findByDocumentId(
        request.documentId,
      );

    return { fiscalDocument, documentItems, documentEvents };
  }
}
