import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceAttachmentsRepository } from '@/repositories/finance/finance-attachments-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

interface DeleteAttachmentUseCaseRequest {
  tenantId: string;
  entryId: string;
  attachmentId: string;
}

export class DeleteAttachmentUseCase {
  constructor(
    private financeAttachmentsRepository: FinanceAttachmentsRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute({
    tenantId,
    attachmentId,
  }: DeleteAttachmentUseCaseRequest): Promise<void> {
    const attachment = await this.financeAttachmentsRepository.findById(
      new UniqueEntityID(attachmentId),
      tenantId,
    );

    if (!attachment) {
      throw new ResourceNotFoundError('Attachment not found');
    }

    // Delete from storage
    await this.fileUploadService.delete(attachment.fileKey);

    // Delete from database
    await this.financeAttachmentsRepository.delete(
      new UniqueEntityID(attachmentId),
    );
  }
}
