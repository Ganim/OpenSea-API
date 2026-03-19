import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CategoriesRepository } from '@/repositories/stock/categories-repository';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface ValidateBulkProductsRequest {
  tenantId: string;
  productNames: string[];
  categoryNames: string[];
  manufacturerNames: string[];
  templateId: string;
}

interface EntityRef {
  name: string;
  id: string;
}

interface ValidateBulkProductsResponse {
  duplicateProducts: EntityRef[];
  existingCategories: EntityRef[];
  missingCategories: string[];
  existingManufacturers: EntityRef[];
  missingManufacturers: string[];
  templateValid: boolean;
}

export class ValidateBulkProductsUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private categoriesRepository: CategoriesRepository,
    private manufacturersRepository: ManufacturersRepository,
    private templatesRepository: TemplatesRepository,
  ) {}

  async execute(
    request: ValidateBulkProductsRequest,
  ): Promise<ValidateBulkProductsResponse> {
    const {
      tenantId,
      productNames,
      categoryNames,
      manufacturerNames,
      templateId,
    } = request;

    const [
      existingProducts,
      existingCategories,
      existingManufacturers,
      template,
    ] = await Promise.all([
      productNames.length > 0
        ? this.productsRepository.findManyByNames(productNames, tenantId)
        : Promise.resolve([]),
      categoryNames.length > 0
        ? this.categoriesRepository.findManyByNames(categoryNames, tenantId)
        : Promise.resolve([]),
      manufacturerNames.length > 0
        ? this.manufacturersRepository.findManyByNames(
            manufacturerNames,
            tenantId,
          )
        : Promise.resolve([]),
      this.templatesRepository.findById(
        new UniqueEntityID(templateId),
        tenantId,
      ),
    ]);

    const duplicateProducts = existingProducts.map((product) => ({
      name: product.name,
      id: product.id.toString(),
    }));

    const existingCategoryRefs = existingCategories.map((category) => ({
      name: category.name,
      id: category.id.toString(),
    }));

    const existingCategoryNamesLower = existingCategories.map((category) =>
      category.name.toLowerCase(),
    );
    const missingCategories = categoryNames.filter(
      (name) => !existingCategoryNamesLower.includes(name.toLowerCase()),
    );

    const existingManufacturerRefs = existingManufacturers.map(
      (manufacturer) => ({
        name: manufacturer.name,
        id: manufacturer.id.toString(),
      }),
    );

    const existingManufacturerNamesLower = existingManufacturers.map(
      (manufacturer) => manufacturer.name.toLowerCase(),
    );
    const missingManufacturers = manufacturerNames.filter(
      (name) => !existingManufacturerNamesLower.includes(name.toLowerCase()),
    );

    return {
      duplicateProducts,
      existingCategories: existingCategoryRefs,
      missingCategories,
      existingManufacturers: existingManufacturerRefs,
      missingManufacturers,
      templateValid: template !== null,
    };
  }
}
