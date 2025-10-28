import type { ProductDTO } from '@/mappers/stock/product/product-to-dto';
import { productToDTO } from '@/mappers/stock/product/product-to-dto';
import { ProductsRepository } from '@/repositories/stock/products-repository';

interface ListProductsUseCaseResponse {
  products: ProductDTO[];
}

export class ListProductsUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute(): Promise<ListProductsUseCaseResponse> {
    const products = await this.productsRepository.findMany();

    return {
      products: products.map(productToDTO),
    };
  }
}
