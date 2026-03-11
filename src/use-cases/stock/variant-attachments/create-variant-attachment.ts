import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { VariantAttachmentRecord } from '@/repositories/stock/variant-attachments-repository';
import { VariantAttachmentsRepository } from '@/repositories/stock/variant-attachments-repository';
import { VariantsRepository } from '@/repositories/stock/variants-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface CreateVariantAttachmentUseCaseRequest {
  variantId: string;
  tenantId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  label?: string;
  order?: number;
}

interface CreateVariantAttachmentUseCaseResponse {
  variantAttachment: VariantAttachmentRecord;
}

export class CreateVariantAttachmentUseCase {
  constructor(
    private variantAttachmentsRepository: VariantAttachmentsRepository,
    private variantsRepository: VariantsRepository,
  ) {}

  async execute(
    request: CreateVariantAttachmentUseCaseRequest,
  ): Promise<CreateVariantAttachmentUseCaseResponse> {
    const {
      variantId,
      tenantId,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      label,
      order,
    } = request;

    // Validate variant exists and belongs to tenant
    const variant = await this.variantsRepository.findById(
      new UniqueEntityID(variantId),
      tenantId,
    );

    if (!variant) {
      throw new ResourceNotFoundError('Variant not found');
    }

    // Create the record
    const variantAttachment = await this.variantAttachmentsRepository.create({
      variantId,
      tenantId,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      label,
      order,
    });

    return { variantAttachment };
  }
}
