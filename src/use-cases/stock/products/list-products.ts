import { ProductsRepository } from '@/repositories/stock/products-repository';

interface ListProductsUseCaseRequest {
  tenantId: string;
  manufacturerId?: string;
}

interface ListProductsUseCaseResponse {
  products: import('@/entities/stock/product').Product[];
}

export class ListProductsUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute(
    request: ListProductsUseCaseRequest,
  ): Promise<ListProductsUseCaseResponse> {
    const { tenantId, manufacturerId } = request;

    const products = manufacturerId
      ? await this.productsRepository.findManyByManufacturer(
          manufacturerId,
          tenantId,
        )
      : await this.productsRepository.findMany(tenantId);

    return {
      products,
    };
  }
}
