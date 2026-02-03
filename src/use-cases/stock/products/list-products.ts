import { ProductsRepository } from '@/repositories/stock/products-repository';

interface ListProductsUseCaseRequest {
  tenantId: string;
}

interface ListProductsUseCaseResponse {
  products: import('@/entities/stock/product').Product[];
}

export class ListProductsUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute(
    request: ListProductsUseCaseRequest,
  ): Promise<ListProductsUseCaseResponse> {
    const { tenantId } = request;

    const products = await this.productsRepository.findMany(tenantId);

    return {
      products,
    };
  }
}
