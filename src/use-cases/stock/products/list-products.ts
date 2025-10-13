import { ProductsRepository } from '@/repositories/stock/products-repository';

interface ProductDTO {
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
}

interface ListProductsUseCaseResponse {
  products: ProductDTO[];
}

export class ListProductsUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute(): Promise<ListProductsUseCaseResponse> {
    const products = await this.productsRepository.findMany();

    return {
      products: products.map((product) => ({
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
      })),
    };
  }
}
