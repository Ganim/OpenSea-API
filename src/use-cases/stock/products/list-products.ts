import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductsRepository } from '@/repositories/stock/products-repository';

interface ListProductsUseCaseRequest {
  tenantId: string;
  templateId?: string;
  manufacturerId?: string;
  categoryId?: string;
}

interface ListProductsUseCaseResponse {
  products: import('@/entities/stock/product').Product[];
}

export class ListProductsUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute(
    request: ListProductsUseCaseRequest,
  ): Promise<ListProductsUseCaseResponse> {
    const { tenantId, templateId, manufacturerId, categoryId } = request;

    let products;

    if (templateId) {
      products = await this.productsRepository.findManyByTemplate(
        new UniqueEntityID(templateId),
        tenantId,
      );
      // Post-filter by manufacturer and/or category if also active
      if (manufacturerId) {
        products = products.filter(
          (p) => p.manufacturerId?.toString() === manufacturerId,
        );
      }
      if (categoryId) {
        products = products.filter((p) =>
          p.categories?.some((c) => c.id.toString() === categoryId),
        );
      }
    } else if (manufacturerId) {
      products = await this.productsRepository.findManyByManufacturer(
        new UniqueEntityID(manufacturerId),
        tenantId,
      );
      // If both filters active, post-filter by category
      if (categoryId) {
        products = products.filter((p) =>
          p.categories?.some((c) => c.id.toString() === categoryId),
        );
      }
    } else if (categoryId) {
      products = await this.productsRepository.findManyByCategory(
        new UniqueEntityID(categoryId),
        tenantId,
      );
    } else {
      products = await this.productsRepository.findMany(tenantId);
    }

    return {
      products,
    };
  }
}
