import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { ProductAttachmentRecord } from '@/repositories/stock/product-attachments-repository';
import { ProductAttachmentsRepository } from '@/repositories/stock/product-attachments-repository';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface CreateProductAttachmentUseCaseRequest {
  productId: string;
  tenantId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  label?: string;
  order?: number;
}

interface CreateProductAttachmentUseCaseResponse {
  productAttachment: ProductAttachmentRecord;
}

export class CreateProductAttachmentUseCase {
  constructor(
    private productAttachmentsRepository: ProductAttachmentsRepository,
    private productsRepository: ProductsRepository,
  ) {}

  async execute(
    request: CreateProductAttachmentUseCaseRequest,
  ): Promise<CreateProductAttachmentUseCaseResponse> {
    const {
      productId,
      tenantId,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      label,
      order,
    } = request;

    // Validate product exists and belongs to tenant
    const product = await this.productsRepository.findById(
      new UniqueEntityID(productId),
      tenantId,
    );

    if (!product) {
      throw new ResourceNotFoundError('Product not found');
    }

    // Create the record
    const productAttachment = await this.productAttachmentsRepository.create({
      productId,
      tenantId,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      label,
      order,
    });

    return { productAttachment };
  }
}
