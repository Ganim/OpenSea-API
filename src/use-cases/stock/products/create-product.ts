import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import { UnitOfMeasure } from '@/entities/stock/value-objects/unit-of-measure';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { SuppliersRepository } from '@/repositories/stock/suppliers-repository';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface CreateProductUseCaseRequest {
  name: string;
  code: string;
  description?: string;
  status?: string;
  unitOfMeasure: string;
  templateId: string;
  supplierId?: string;
  manufacturerId?: string;
  attributes?: Record<string, unknown>;
}

interface CreateProductUseCaseResponse {
  product: import('@/entities/stock/product').Product;
}

export class CreateProductUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private templatesRepository: TemplatesRepository,
    private suppliersRepository: SuppliersRepository,
    private manufacturersRepository: ManufacturersRepository,
  ) {}

  async execute(
    request: CreateProductUseCaseRequest,
  ): Promise<CreateProductUseCaseResponse> {
    const {
      name,
      code,
      description,
      status,
      unitOfMeasure,
      templateId,
      supplierId,
      manufacturerId,
      attributes,
    } = request;

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Name is required');
    }

    if (name.length > 200) {
      throw new BadRequestError('Name must be at most 200 characters long');
    }

    // Validate code
    if (!code || code.trim().length === 0) {
      throw new BadRequestError('Code is required');
    }

    if (code.length > 100) {
      throw new BadRequestError('Code must be at most 100 characters long');
    }

    // Check if product with same name already exists
    const existingProduct = await this.productsRepository.findByName(name);
    if (existingProduct) {
      throw new BadRequestError('Product with this name already exists');
    }

    // Validate status
    const validStatuses = [
      'DRAFT',
      'ACTIVE',
      'INACTIVE',
      'DISCONTINUED',
      'OUT_OF_STOCK',
    ];
    const finalStatus = status ?? 'DRAFT';
    if (!validStatuses.includes(finalStatus)) {
      throw new BadRequestError(
        'Invalid status. Must be one of: DRAFT, ACTIVE, INACTIVE, DISCONTINUED, OUT_OF_STOCK',
      );
    }
    const productStatus = ProductStatus.create(
      finalStatus as
        | 'DRAFT'
        | 'ACTIVE'
        | 'INACTIVE'
        | 'DISCONTINUED'
        | 'OUT_OF_STOCK',
    );

    // Validate unit of measure
    const validUnits = ['METERS', 'KILOGRAMS', 'UNITS'];
    if (!validUnits.includes(unitOfMeasure)) {
      throw new BadRequestError(
        'Invalid unit of measure. Must be one of: METERS, KILOGRAMS, UNITS',
      );
    }
    const productUnitOfMeasure = UnitOfMeasure.create(
      unitOfMeasure as 'METERS' | 'KILOGRAMS' | 'UNITS',
    );

    // Validate template exists
    const template = await this.templatesRepository.findById(
      new UniqueEntityID(templateId),
    );
    if (!template) {
      throw new ResourceNotFoundError('Template not found');
    }

    // Validate supplier exists if provided
    if (supplierId) {
      const supplier = await this.suppliersRepository.findById(
        new UniqueEntityID(supplierId),
      );
      if (!supplier) {
        throw new ResourceNotFoundError('Supplier not found');
      }
    }

    // Validate manufacturer exists if provided
    if (manufacturerId) {
      const manufacturer = await this.manufacturersRepository.findById(
        new UniqueEntityID(manufacturerId),
      );
      if (!manufacturer) {
        throw new ResourceNotFoundError('Manufacturer not found');
      }
    }

    // Validate attributes against template
    if (attributes) {
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

    // Save to repository
    const createdProduct = await this.productsRepository.create({
      name,
      code,
      description,
      status: productStatus,
      unitOfMeasure: productUnitOfMeasure,
      templateId: new UniqueEntityID(templateId),
      supplierId: supplierId ? new UniqueEntityID(supplierId) : undefined,
      manufacturerId: manufacturerId
        ? new UniqueEntityID(manufacturerId)
        : undefined,
      attributes: attributes ?? {},
    });

    return {
      product: createdProduct,
    };
  }
}
