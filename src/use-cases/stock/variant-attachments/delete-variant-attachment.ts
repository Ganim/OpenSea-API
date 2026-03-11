import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { VariantAttachmentsRepository } from '@/repositories/stock/variant-attachments-repository';

interface DeleteVariantAttachmentUseCaseRequest {
  id: string;
  tenantId: string;
}

export class DeleteVariantAttachmentUseCase {
  constructor(
    private variantAttachmentsRepository: VariantAttachmentsRepository,
  ) {}

  async execute(request: DeleteVariantAttachmentUseCaseRequest): Promise<void> {
    const { id, tenantId } = request;

    const record = await this.variantAttachmentsRepository.findById(id);

    if (!record) {
      throw new ResourceNotFoundError('Variant attachment not found');
    }

    if (record.tenantId !== tenantId) {
      throw new ResourceNotFoundError('Variant attachment not found');
    }

    await this.variantAttachmentsRepository.delete(id);
  }
}
