import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface ValidateBulkVariantsRequest {
  tenantId: string;
  productNames: string[];
  templateId: string;
}

interface ValidateBulkVariantsResponse {
  existingProducts: Array<{ name: string; id: string }>;
  missingProducts: string[];
  templateValid: boolean;
}

export class ValidateBulkVariantsUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private templatesRepository: TemplatesRepository,
  ) {}

  async execute(
    request: ValidateBulkVariantsRequest,
  ): Promise<ValidateBulkVariantsResponse> {
    const { tenantId, productNames, templateId } = request;

    const [foundProducts, template] = await Promise.all([
      productNames.length > 0
        ? this.productsRepository.findManyByNames(productNames, tenantId)
        : Promise.resolve([]),
      this.templatesRepository.findById(
        new UniqueEntityID(templateId),
        tenantId,
      ),
    ]);

    const existingProducts = foundProducts.map((product) => ({
      name: product.name,
      id: product.id.toString(),
    }));

    const foundProductNamesLower = foundProducts.map((product) =>
      product.name.toLowerCase(),
    );
    const missingProducts = productNames.filter(
      (name) => !foundProductNamesLower.includes(name.toLowerCase()),
    );

    return {
      existingProducts,
      missingProducts,
      templateValid: template !== null,
    };
  }
}
