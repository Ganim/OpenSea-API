import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import { Slug } from '@/entities/stock/value-objects/slug';
import { CategoriesRepository } from '@/repositories/stock/categories-repository';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { SuppliersRepository } from '@/repositories/stock/suppliers-repository';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';
import type { CareCatalogProvider } from '@/services/care';
import {
  generateBarcode,
  generateEAN13,
  generateUPC,
} from '@/utils/barcode-generator';
import { assertValidAttributes } from '@/utils/validate-template-attributes';

/**
 * Gera código hierárquico com padding
 * @example padCode(1, 3) => "001", padCode(42, 4) => "0042"
 */
function padCode(seq: number, digits: number): string {
  return seq.toString().padStart(digits, '0');
}

interface CreateProductUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  status?: string;
  outOfLine?: boolean;
  templateId: string;
  supplierId?: string;
  manufacturerId?: string;
  attributes?: Record<string, unknown>;
  categoryIds?: string[];
  careInstructionIds?: string[];
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
    private categoriesRepository: CategoriesRepository,
    private careCatalogProvider: CareCatalogProvider,
  ) {}

  async execute(
    request: CreateProductUseCaseRequest,
  ): Promise<CreateProductUseCaseResponse> {
    const {
      tenantId,
      name,
      description,
      status,
      outOfLine,
      templateId,
      supplierId,
      manufacturerId,
      attributes,
      categoryIds,
      careInstructionIds,
    } = request;

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Name is required');
    }

    if (name.length > 200) {
      throw new BadRequestError('Name must be at most 200 characters long');
    }

    // Check if product with same name already exists
    const existingProduct = await this.productsRepository.findByName(
      name,
      tenantId,
    );
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
    const finalStatus = status ?? 'ACTIVE'; // Mudança: padrão é ACTIVE
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

    // Validate template exists
    const template = await this.templatesRepository.findById(
      new UniqueEntityID(templateId),
      tenantId,
    );
    if (!template) {
      throw new ResourceNotFoundError('Template not found');
    }

    // Validate supplier exists if provided
    if (supplierId) {
      const supplier = await this.suppliersRepository.findById(
        new UniqueEntityID(supplierId),
        tenantId,
      );
      if (!supplier) {
        throw new ResourceNotFoundError('Supplier not found');
      }
    }

    // Validate manufacturer exists if provided
    if (manufacturerId) {
      const manufacturer = await this.manufacturersRepository.findById(
        new UniqueEntityID(manufacturerId),
        tenantId,
      );
      if (!manufacturer) {
        throw new ResourceNotFoundError('Manufacturer not found');
      }
    }

    // Validate categories exist if provided
    if (categoryIds !== undefined) {
      for (const categoryId of categoryIds) {
        const category = await this.categoriesRepository.findById(
          new UniqueEntityID(categoryId),
          tenantId,
        );
        if (!category) {
          throw new ResourceNotFoundError(`Category not found: ${categoryId}`);
        }
      }
    }

    // Validate care instruction IDs if provided
    if (careInstructionIds !== undefined && careInstructionIds.length > 0) {
      const invalidIds =
        this.careCatalogProvider.validateIds(careInstructionIds);
      if (invalidIds.length > 0) {
        throw new BadRequestError(
          `Invalid care instruction IDs: ${invalidIds.join(', ')}`,
        );
      }
    }

    // Validate attributes against template
    assertValidAttributes(attributes, template.productAttributes, 'product');

    // Get template code (manual or auto-generated from sequentialCode)
    const templateCode =
      template.code ?? padCode(template.sequentialCode ?? 1, 3);

    // Get manufacturer code (or '000' if no manufacturer)
    let manufacturerCode = '000';
    if (manufacturerId) {
      const manufacturer = await this.manufacturersRepository.findById(
        new UniqueEntityID(manufacturerId),
        tenantId,
      );
      if (manufacturer) {
        manufacturerCode = manufacturer.code;
      }
    }

    // Get next product sequential code
    const productSeq = await this.productsRepository.getNextSequentialCode();

    // Generate fullCode: TEMPLATE.FABRICANTE.PRODUTO (ex: 001.001.0001)
    const fullCode = `${templateCode}.${manufacturerCode}.${padCode(productSeq, 4)}`;

    // Generate slug from name (with productSeq as suffix to ensure uniqueness)
    const slug = Slug.createUniqueFromText(name, productSeq.toString());

    // Generate barcode codes from fullCode (IMUTÁVEIS)
    const barcode = generateBarcode(fullCode);
    const eanCode = generateEAN13(fullCode);
    const upcCode = generateUPC(fullCode);

    // Save to repository
    const createdProduct = await this.productsRepository.create({
      tenantId,
      name,
      slug,
      fullCode,
      barcode,
      eanCode,
      upcCode,
      description,
      status: productStatus,
      outOfLine: outOfLine ?? false,
      templateId: new UniqueEntityID(templateId),
      supplierId: supplierId ? new UniqueEntityID(supplierId) : undefined,
      manufacturerId: manufacturerId
        ? new UniqueEntityID(manufacturerId)
        : undefined,
      attributes: attributes ?? {},
      categoryIds,
      careInstructionIds,
    });

    return {
      product: createdProduct,
    };
  }
}
