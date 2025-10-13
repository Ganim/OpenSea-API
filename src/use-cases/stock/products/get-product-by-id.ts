import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductsRepository } from '@/repositories/stock/products-repository';

interface GetProductByIdUseCaseRequest {
  id: string;
}

interface GetProductByIdUseCaseResponse {
  product: {
    id: string;
    name: string;
    code: string;
    description?: string;
    status: string;
    unitOfMeasure: string;
    templateId: string;
    supplierId?: string;
    manufacturerId?: string;
    attributes: Record<string, unknown>;
  };
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
      product: {
        id: product.id.toString(),
        name: product.name,
        code: product.code,
        description: product.description,
        status: product.status.value,
        unitOfMeasure: product.unitOfMeasure.value,
        templateId: product.templateId.toString(),
        supplierId: product.supplierId?.toString(),
        manufacturerId: product.manufacturerId?.toString(),
        attributes: product.attributes,
      },
    };
  }
}
