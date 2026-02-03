/**
 * Set Product Care Instructions Use Case
 *
 * Updates the care instruction IDs for a specific product.
 * Validates that all IDs exist in the care catalog and that there are no duplicates.
 */

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { Product } from '@/entities/stock/product';
import type { ProductsRepository } from '@/repositories/stock/products-repository';
import type { CareCatalogProvider } from '@/services/care';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface SetProductCareInstructionsUseCaseRequest {
  tenantId: string;
  productId: string;
  careInstructionIds: string[];
}

interface SetProductCareInstructionsUseCaseResponse {
  product: Product;
}

export class SetProductCareInstructionsUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private careCatalogProvider: CareCatalogProvider,
  ) {}

  async execute(
    request: SetProductCareInstructionsUseCaseRequest,
  ): Promise<SetProductCareInstructionsUseCaseResponse> {
    const { tenantId, productId, careInstructionIds } = request;

    // Check for duplicates
    const uniqueIds = [...new Set(careInstructionIds)];
    if (uniqueIds.length !== careInstructionIds.length) {
      throw new BadRequestError(
        'Duplicate care instruction IDs are not allowed',
      );
    }

    // Validate all IDs exist in the catalog
    const invalidIds = this.careCatalogProvider.validateIds(careInstructionIds);
    if (invalidIds.length > 0) {
      throw new BadRequestError(
        `Invalid care instruction IDs: ${invalidIds.join(', ')}`,
      );
    }

    // Check if product exists
    const existingProduct = await this.productsRepository.findById(
      new UniqueEntityID(productId),
      tenantId,
    );

    if (!existingProduct) {
      throw new ResourceNotFoundError('Product not found');
    }

    // Update care instructions
    const product = await this.productsRepository.updateCareInstructions(
      new UniqueEntityID(productId),
      careInstructionIds,
    );

    return { product };
  }
}
