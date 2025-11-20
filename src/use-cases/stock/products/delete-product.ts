import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductsRepository } from '@/repositories/stock/products-repository';

interface DeleteProductUseCaseRequest {
  id: string;
}

export class DeleteProductUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute(request: DeleteProductUseCaseRequest): Promise<void> {
    const { id } = request;

    const product = await this.productsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!product) {
      throw new ResourceNotFoundError('Product not found');
    }

    await this.productsRepository.delete(new UniqueEntityID(id));
  }
}
