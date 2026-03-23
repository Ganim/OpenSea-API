import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidDocument } from '@/entities/sales/bid-document';
import type { BidDocumentTypeEnum } from '@/entities/sales/bid-document';
import type { BidDocumentsRepository } from '@/repositories/sales/bid-documents-repository';

interface CreateBidDocumentUseCaseRequest {
  tenantId: string;
  bidId?: string;
  type: string;
  name: string;
  description?: string;
  fileId: string;
  issueDate?: Date;
  expirationDate?: Date;
  autoRenewable?: boolean;
}

interface CreateBidDocumentUseCaseResponse {
  document: BidDocument;
}

export class CreateBidDocumentUseCase {
  constructor(private bidDocumentsRepository: BidDocumentsRepository) {}

  async execute(
    request: CreateBidDocumentUseCaseRequest,
  ): Promise<CreateBidDocumentUseCaseResponse> {
    if (!request.name || request.name.trim().length === 0) {
      throw new BadRequestError('Document name is required');
    }

    if (!request.fileId) {
      throw new BadRequestError('File ID is required');
    }

    const document = BidDocument.create({
      tenantId: new UniqueEntityID(request.tenantId),
      bidId: request.bidId ? new UniqueEntityID(request.bidId) : undefined,
      type: request.type as BidDocumentTypeEnum,
      name: request.name.trim(),
      description: request.description,
      fileId: new UniqueEntityID(request.fileId),
      issueDate: request.issueDate,
      expirationDate: request.expirationDate,
      autoRenewable: request.autoRenewable,
    });

    await this.bidDocumentsRepository.create(document);

    return { document };
  }
}
