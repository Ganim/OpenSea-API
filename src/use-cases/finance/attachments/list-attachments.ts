import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type FinanceAttachmentDTO,
  financeAttachmentToDTO,
} from '@/mappers/finance/finance-attachment/finance-attachment-to-dto';
import type { FinanceAttachmentsRepository } from '@/repositories/finance/finance-attachments-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

interface ListAttachmentsUseCaseRequest {
  tenantId: string;
  entryId: string;
}

interface ListAttachmentsUseCaseResponse {
  attachments: FinanceAttachmentDTO[];
}

export class ListAttachmentsUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeAttachmentsRepository: FinanceAttachmentsRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: ListAttachmentsUseCaseRequest,
  ): Promise<ListAttachmentsUseCaseResponse> {
    const { tenantId, entryId } = request;

    // Validate entry exists
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    const attachments =
      await this.financeAttachmentsRepository.findManyByEntryId(
        entryId,
        tenantId,
      );

    // Generate presigned URLs for all attachments
    const dtos: FinanceAttachmentDTO[] = await Promise.all(
      attachments.map(async (attachment) => {
        const dto = financeAttachmentToDTO(attachment);
        dto.url = await this.fileUploadService.getPresignedUrl(
          attachment.fileKey,
        );
        return dto;
      }),
    );

    return { attachments: dtos };
  }
}
