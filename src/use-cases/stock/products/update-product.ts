import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import { CategoriesRepository } from '@/repositories/stock/categories-repository';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { SuppliersRepository } from '@/repositories/stock/suppliers-repository';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface UpdateProductUseCaseRequest {
  id: string;
  name?: string;
  // code e fullCode são imutáveis após criação
  description?: string;
  status?: string;
  outOfLine?: boolean;
  supplierId?: string;
  manufacturerId?: string;
  attributes?: Record<string, unknown>;
  categoryIds?: string[];
}

interface UpdateProductUseCaseResponse {
  product: import('@/entities/stock/product').Product;
}

export class UpdateProductUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private templatesRepository: TemplatesRepository,
    private suppliersRepository: SuppliersRepository,
    private manufacturersRepository: ManufacturersRepository,
    private categoriesRepository: CategoriesRepository,
  ) {}

  async execute(
    request: UpdateProductUseCaseRequest,
  ): Promise<UpdateProductUseCaseResponse> {
    const {
      id,
      name,
      // code e fullCode são imutáveis após criação
      description,
      status,
      outOfLine,
      supplierId,
      manufacturerId,
      attributes,
      categoryIds,
    } = request;

    // Validate ID
    const product = await this.productsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!product) {
      throw new ResourceNotFoundError('Product not found');
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new BadRequestError('Name is required');
      }

      if (name.length > 200) {
        throw new BadRequestError('Name must be at most 200 characters long');
      }

      // Check if name is already used by another product
      if (name !== product.name) {
        const existingProduct = await this.productsRepository.findByName(name);
        if (existingProduct && !existingProduct.id.equals(product.id)) {
          throw new BadRequestError('Product with this name already exists');
        }
      }
    }

    // code e fullCode são imutáveis após criação

    // Validate status if provided
    let productStatus: ProductStatus | undefined;
    if (status !== undefined) {
      const validStatuses = [
        'DRAFT',
        'ACTIVE',
        'INACTIVE',
        'DISCONTINUED',
        'OUT_OF_STOCK',
      ];
      if (!validStatuses.includes(status)) {
        throw new BadRequestError(
          'Invalid status. Must be one of: DRAFT, ACTIVE, INACTIVE, DISCONTINUED, OUT_OF_STOCK',
        );
      }
      productStatus = ProductStatus.create(
        status as
          | 'DRAFT'
          | 'ACTIVE'
          | 'INACTIVE'
          | 'DISCONTINUED'
          | 'OUT_OF_STOCK',
      );
    }

    // Validate supplier exists if provided
    if (supplierId !== undefined) {
      const supplier = await this.suppliersRepository.findById(
        new UniqueEntityID(supplierId),
      );
      if (!supplier) {
        throw new ResourceNotFoundError('Supplier not found');
      }
    }

    // Validate manufacturer exists if provided
    if (manufacturerId !== undefined) {
      const manufacturer = await this.manufacturersRepository.findById(
        new UniqueEntityID(manufacturerId),
      );
      if (!manufacturer) {
        throw new ResourceNotFoundError('Manufacturer not found');
      }
    }

    // Validate attributes against template if provided
    if (attributes !== undefined) {
      const template = await this.templatesRepository.findById(
        product.templateId,
      );
      if (!template) {
        throw new ResourceNotFoundError('Template not found');
      }

      const templateAttributes = template.productAttributes;
      const attributeKeys = Object.keys(attributes);
      const templateKeys = Object.keys(templateAttributes);

      // Check for invalid attribute keys
      const invalidKeys = attributeKeys.filter(
        (key) => !templateKeys.includes(key),
      );
      if (invalidKeys.length > 0) {
        throw new BadRequestError(
          `Invalid attributes: ${invalidKeys.join(', ')}. Template only allows: ${templateKeys.join(', ')}`,
        );
      }
    }

    // Validate categories exist if provided
    if (categoryIds !== undefined) {
      for (const categoryId of categoryIds) {
        const category = await this.categoriesRepository.findById(
          new UniqueEntityID(categoryId),
        );
        if (!category) {
          throw new ResourceNotFoundError(`Category not found: ${categoryId}`);
        }
      }
    }

    // Update product
    // code e fullCode são imutáveis após criação
    const updatedProduct = await this.productsRepository.update({
      id: new UniqueEntityID(id),
      name,
      description,
      status: productStatus,
      outOfLine,
      supplierId: supplierId ? new UniqueEntityID(supplierId) : undefined,
      manufacturerId: manufacturerId
        ? new UniqueEntityID(manufacturerId)
        : undefined,
      attributes,
      categoryIds,
    });

    if (!updatedProduct) {
      throw new ResourceNotFoundError('Product not found');
    }

    return {
      product: updatedProduct,
    };
  }
}
