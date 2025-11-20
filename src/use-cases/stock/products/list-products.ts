import { ProductsRepository } from '@/repositories/stock/products-repository';

interface ListProductsUseCaseResponse {
  products: import('@/entities/stock/product').Product[];
}

export class ListProductsUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute(): Promise<ListProductsUseCaseResponse> {
    const products = await this.productsRepository.findMany();

    return {
      products,
    };
  }
}
