import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import { UnitOfMeasure } from '@/entities/stock/value-objects/unit-of-measure';
import {
  ProductDTO,
  productToDTO,
} from '@/mappers/stock/product/product-to-dto';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { SuppliersRepository } from '@/repositories/stock/suppliers-repository';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface UpdateProductUseCaseRequest {
  id: string;
  name?: string;
  code?: string;
  description?: string;
  status?: string;
  unitOfMeasure?: string;
  supplierId?: string;
  manufacturerId?: string;
  attributes?: Record<string, unknown>;
}

interface UpdateProductUseCaseResponse {
  product: ProductDTO;
}

export class UpdateProductUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private templatesRepository: TemplatesRepository,
    private suppliersRepository: SuppliersRepository,
    private manufacturersRepository: ManufacturersRepository,
  ) {}

  async execute(
    request: UpdateProductUseCaseRequest,
  ): Promise<UpdateProductUseCaseResponse> {
    const {
      id,
      name,
      code,
      description,
      status,
      unitOfMeasure,
      supplierId,
      manufacturerId,
      attributes,
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

    // Validate code if provided
    if (code !== undefined) {
      if (!code || code.trim().length === 0) {
        throw new BadRequestError('Code is required');
      }

      if (code.length > 100) {
        throw new BadRequestError('Code must be at most 100 characters long');
      }
    }

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

    // Validate unit of measure if provided
    let productUnitOfMeasure: UnitOfMeasure | undefined;
    if (unitOfMeasure !== undefined) {
      const validUnits = ['METERS', 'KILOGRAMS', 'UNITS'];
      if (!validUnits.includes(unitOfMeasure)) {
        throw new BadRequestError(
          'Invalid unit of measure. Must be one of: METERS, KILOGRAMS, UNITS',
        );
      }
      productUnitOfMeasure = UnitOfMeasure.create(
        unitOfMeasure as 'METERS' | 'KILOGRAMS' | 'UNITS',
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

    // Update product
    const updatedProduct = await this.productsRepository.update({
      id: new UniqueEntityID(id),
      name,
      code,
      description,
      status: productStatus,
      unitOfMeasure: productUnitOfMeasure,
      supplierId: supplierId ? new UniqueEntityID(supplierId) : undefined,
      manufacturerId: manufacturerId
        ? new UniqueEntityID(manufacturerId)
        : undefined,
      attributes,
    });

    if (!updatedProduct) {
      throw new ResourceNotFoundError('Product not found');
    }

    return {
      product: productToDTO(updatedProduct),
    };
  }
}
