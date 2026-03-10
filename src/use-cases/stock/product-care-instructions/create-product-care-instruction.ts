import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { ProductCareInstructionRecord } from '@/repositories/stock/product-care-instructions-repository';
import { ProductCareInstructionsRepository } from '@/repositories/stock/product-care-instructions-repository';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';
import { CareCatalogProvider } from '@/services/care/care-catalog-provider';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface CreateProductCareInstructionUseCaseRequest {
  productId: string;
  tenantId: string;
  careInstructionId: string;
  order?: number;
}

interface CreateProductCareInstructionUseCaseResponse {
  productCareInstruction: ProductCareInstructionRecord;
}

export class CreateProductCareInstructionUseCase {
  constructor(
    private productCareInstructionsRepository: ProductCareInstructionsRepository,
    private productsRepository: ProductsRepository,
    private templatesRepository: TemplatesRepository,
    private careCatalogProvider: CareCatalogProvider,
  ) {}

  async execute(
    request: CreateProductCareInstructionUseCaseRequest,
  ): Promise<CreateProductCareInstructionUseCaseResponse> {
    const { productId, tenantId, careInstructionId, order } = request;

    // Validate product exists and belongs to tenant
    const product = await this.productsRepository.findById(
      new UniqueEntityID(productId),
      tenantId,
    );

    if (!product) {
      throw new ResourceNotFoundError('Product not found');
    }

    // Validate product's template has CARE_INSTRUCTIONS in specialModules
    const template = await this.templatesRepository.findById(
      product.templateId,
      tenantId,
    );

    if (!template) {
      throw new ResourceNotFoundError('Template not found');
    }

    if (!template.hasSpecialModule('CARE_INSTRUCTIONS')) {
      throw new BadRequestError(
        'Product template does not support care instructions',
      );
    }

    // Validate care instruction ID exists in catalog
    if (!this.careCatalogProvider.exists(careInstructionId)) {
      throw new BadRequestError(
        `Invalid care instruction ID: ${careInstructionId}`,
      );
    }

    // Check for duplicate (same productId + careInstructionId)
    const existing =
      await this.productCareInstructionsRepository.findByProductIdAndCareInstructionId(
        productId,
        careInstructionId,
      );

    if (existing) {
      throw new BadRequestError(
        'Care instruction already assigned to this product',
      );
    }

    // Create the record
    const productCareInstruction =
      await this.productCareInstructionsRepository.create({
        productId,
        tenantId,
        careInstructionId,
        order,
      });

    return { productCareInstruction };
  }
}
