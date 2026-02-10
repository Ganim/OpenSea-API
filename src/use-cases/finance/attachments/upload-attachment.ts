import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type FinanceAttachmentDTO,
  financeAttachmentToDTO,
} from '@/mappers/finance/finance-attachment/finance-attachment-to-dto';
import type { FinanceAttachmentsRepository } from '@/repositories/finance/finance-attachments-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FileUploadService, UploadResult } from '@/services/storage/file-upload-service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

interface UploadAttachmentUseCaseRequest {
  tenantId: string;
  entryId: string;
  type: string; // 'BOLETO' | 'PAYMENT_RECEIPT' | 'CONTRACT' | 'INVOICE' | 'OTHER'
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  uploadedBy?: string;
}

interface UploadAttachmentUseCaseResponse {
  attachment: FinanceAttachmentDTO;
}

export class UploadAttachmentUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeAttachmentsRepository: FinanceAttachmentsRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(request: UploadAttachmentUseCaseRequest): Promise<UploadAttachmentUseCaseResponse> {
    const { tenantId, entryId, type, fileName, fileBuffer, mimeType, uploadedBy } = request;

    // Validate entry exists
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    // Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new BadRequestError('File size exceeds maximum allowed (10MB)');
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestError(
        'Invalid file type. Allowed types: PDF, JPEG, PNG',
      );
    }

    // Upload to storage
    let uploadResult: UploadResult;
    try {
      uploadResult = await this.fileUploadService.upload(fileBuffer, fileName, mimeType, {
        prefix: `finance/${tenantId}/${entryId}`,
        maxSize: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_MIME_TYPES,
      });
    } catch {
      throw new BadRequestError('Failed to upload file');
    }

    // Create attachment record
    const attachment = await this.financeAttachmentsRepository.create({
      tenantId,
      entryId,
      type,
      fileName,
      fileKey: uploadResult.key,
      fileSize: uploadResult.size,
      mimeType: uploadResult.mimeType,
      uploadedBy,
    });

    // Generate presigned URL for response
    const url = await this.fileUploadService.getPresignedUrl(uploadResult.key);
    const dto = financeAttachmentToDTO(attachment);
    dto.url = url;

    return { attachment: dto };
  }
}
