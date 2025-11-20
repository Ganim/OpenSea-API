import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductsRepository } from '@/repositories/stock/products-repository';

interface GetProductByIdUseCaseRequest {
  id: string;
}

interface GetProductByIdUseCaseResponse {
  product: import('@/entities/stock/product').Product;
}

export class GetProductByIdUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute(
    request: GetProductByIdUseCaseRequest,
  ): Promise<GetProductByIdUseCaseResponse> {
    const { id } = request;

    const product = await this.productsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!product) {
      throw new ResourceNotFoundError('Product not found');
    }

    return {
      product,
    };
  }
}
