import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ProductAttachmentsRepository } from '@/repositories/stock/product-attachments-repository';

interface DeleteProductAttachmentUseCaseRequest {
  id: string;
  tenantId: string;
}

export class DeleteProductAttachmentUseCase {
  constructor(
    private productAttachmentsRepository: ProductAttachmentsRepository,
  ) {}

  async execute(request: DeleteProductAttachmentUseCaseRequest): Promise<void> {
    const { id, tenantId } = request;

    const record = await this.productAttachmentsRepository.findById(id);

    if (!record) {
      throw new ResourceNotFoundError('Product attachment not found');
    }

    if (record.tenantId !== tenantId) {
      throw new ResourceNotFoundError('Product attachment not found');
    }

    await this.productAttachmentsRepository.delete(id);
  }
}
