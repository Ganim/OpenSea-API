import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Product } from '@/entities/stock/product';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import { Slug } from '@/entities/stock/value-objects/slug';
import { CategoriesRepository } from '@/repositories/stock/categories-repository';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';
import {
  generateBarcode,
  generateEAN13,
  generateUPC,
} from '@/utils/barcode-generator';
import {
  assertValidAttributes,
  normalizeSelectAttributes,
} from '@/utils/validate-template-attributes';

/**
 * Gera código hierárquico com padding
 * @example padCode(1, 3) => "001", padCode(42, 4) => "0042"
 */
function padCode(seq: number, digits: number): string {
  return seq.toString().padStart(digits, '0');
}

interface BulkProductInput {
  name: string;
  description?: string;
  status?: string;
  templateId: string;
  manufacturerId?: string;
  supplierId?: string;
  categoryIds?: string[];
  attributes?: Record<string, unknown>;
}

interface BulkCreateProductsUseCaseRequest {
  tenantId: string;
  products: BulkProductInput[];
  options: { skipDuplicates: boolean };
}

interface BulkCreateProductsUseCaseResponse {
  created: Product[];
  skipped: Array<{ name: string; reason: string }>;
  errors: Array<{ index: number; name: string; message: string }>;
}

export class BulkCreateProductsUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private templatesRepository: TemplatesRepository,
    private manufacturersRepository: ManufacturersRepository,
    private categoriesRepository: CategoriesRepository,
  ) {}

  async execute(
    request: BulkCreateProductsUseCaseRequest,
  ): Promise<BulkCreateProductsUseCaseResponse> {
    const { tenantId, products, options } = request;

    const created: Product[] = [];
    const skipped: Array<{ name: string; reason: string }> = [];
    const errors: Array<{ index: number; name: string; message: string }> = [];

    if (products.length === 0) {
      return { created, skipped, errors };
    }

    // Validate template (all products share the same template in import wizard)
    const template = await this.templatesRepository.findById(
      new UniqueEntityID(products[0].templateId),
      tenantId,
    );
    if (!template) {
      throw new ResourceNotFoundError('Template not found');
    }

    // Pre-fetch existing product names in batch
    const allProductNames = products.map((p) => p.name);
    const existingProducts = await this.productsRepository.findManyByNames(
      allProductNames,
      tenantId,
    );
    const existingNamesSet = new Set(
      existingProducts.map((p) => p.name.toLowerCase()),
    );

    // Pre-fetch all unique manufacturers
    const uniqueManufacturerIds = [
      ...new Set(
        products
          .map((p) => p.manufacturerId)
          .filter((id): id is string => !!id),
      ),
    ];
    const manufacturerMap = new Map<
      string,
      Awaited<
        ReturnType<typeof this.manufacturersRepository.findById>
      > extends infer T
        ? NonNullable<T>
        : never
    >();
    for (const manufacturerId of uniqueManufacturerIds) {
      const manufacturer = await this.manufacturersRepository.findById(
        new UniqueEntityID(manufacturerId),
        tenantId,
      );
      if (manufacturer) {
        manufacturerMap.set(manufacturerId, manufacturer);
      }
    }

    // Pre-fetch all unique category IDs
    const allCategoryIds = [
      ...new Set(products.flatMap((p) => p.categoryIds ?? [])),
    ];
    const validCategoryIdSet = new Set<string>();
    for (const categoryId of allCategoryIds) {
      const category = await this.categoriesRepository.findById(
        new UniqueEntityID(categoryId),
        tenantId,
      );
      if (category) {
        validCategoryIdSet.add(categoryId);
      }
    }

    // Get starting sequential code (fetch once, increment per valid product)
    let nextSeq = await this.productsRepository.getNextSequentialCode();

    // Validate statuses
    const validStatuses = [
      'DRAFT',
      'ACTIVE',
      'INACTIVE',
      'DISCONTINUED',
      'OUT_OF_STOCK',
    ];

    // Process each product
    for (let index = 0; index < products.length; index++) {
      const productInput = products[index];
      const productName = productInput.name;

      // a. Validate name
      if (!productName || productName.trim().length === 0) {
        errors.push({
          index,
          name: productName ?? '',
          message: 'Name is required',
        });
        continue;
      }

      if (productName.length > 200) {
        errors.push({
          index,
          name: productName,
          message: 'Name must be at most 200 characters long',
        });
        continue;
      }

      // b. Check duplicate (existing DB + intra-batch)
      if (existingNamesSet.has(productName.toLowerCase())) {
        if (options.skipDuplicates) {
          skipped.push({
            name: productName,
            reason: 'Product with this name already exists',
          });
        } else {
          errors.push({
            index,
            name: productName,
            message: 'Product with this name already exists',
          });
        }
        continue;
      }

      // c. Validate manufacturerId exists
      if (
        productInput.manufacturerId &&
        !manufacturerMap.has(productInput.manufacturerId)
      ) {
        errors.push({
          index,
          name: productName,
          message: `Manufacturer not found: ${productInput.manufacturerId}`,
        });
        continue;
      }

      // d. Validate each categoryId exists
      if (productInput.categoryIds) {
        const invalidCategoryId = productInput.categoryIds.find(
          (catId) => !validCategoryIdSet.has(catId),
        );
        if (invalidCategoryId) {
          errors.push({
            index,
            name: productName,
            message: `Category not found: ${invalidCategoryId}`,
          });
          continue;
        }
      }

      // f. Validate attributes against template
      try {
        assertValidAttributes(
          productInput.attributes,
          template.productAttributes,
          'product',
        );
      } catch (attributeError) {
        errors.push({
          index,
          name: productName,
          message:
            attributeError instanceof Error
              ? attributeError.message
              : 'Invalid attributes',
        });
        continue;
      }

      // g. Normalize attributes
      const normalizedAttributes = normalizeSelectAttributes(
        productInput.attributes,
        template.productAttributes,
      );

      // h. Validate status
      const finalStatus = productInput.status ?? 'ACTIVE';
      if (!validStatuses.includes(finalStatus)) {
        errors.push({
          index,
          name: productName,
          message:
            'Invalid status. Must be one of: DRAFT, ACTIVE, INACTIVE, DISCONTINUED, OUT_OF_STOCK',
        });
        continue;
      }
      const productStatus = ProductStatus.create(
        finalStatus as
          | 'DRAFT'
          | 'ACTIVE'
          | 'INACTIVE'
          | 'DISCONTINUED'
          | 'OUT_OF_STOCK',
      );

      // i. Generate codes (exactly like create-product.ts)
      const templateCode =
        template.code ?? padCode(template.sequentialCode ?? 1, 3);

      const manufacturer = productInput.manufacturerId
        ? manufacturerMap.get(productInput.manufacturerId)
        : undefined;
      const manufacturerCode = manufacturer?.code ?? '000';

      const fullCode = `${templateCode}.${manufacturerCode}.${padCode(nextSeq, 4)}`;
      const slug = Slug.createUniqueFromText(productName, nextSeq.toString());
      const barcode = generateBarcode(fullCode);
      const eanCode = generateEAN13(fullCode);
      const upcCode = generateUPC(fullCode);

      // j. Create product via repository
      try {
        const createdProduct = await this.productsRepository.create({
          tenantId,
          name: productName,
          slug,
          fullCode,
          barcode,
          eanCode,
          upcCode,
          description: productInput.description,
          status: productStatus,
          outOfLine: false,
          templateId: new UniqueEntityID(productInput.templateId),
          supplierId: productInput.supplierId
            ? new UniqueEntityID(productInput.supplierId)
            : undefined,
          manufacturerId: productInput.manufacturerId
            ? new UniqueEntityID(productInput.manufacturerId)
            : undefined,
          attributes: normalizedAttributes ?? {},
          categoryIds: productInput.categoryIds,
        });

        created.push(createdProduct);
        nextSeq++;

        // Prevent intra-batch duplicates
        existingNamesSet.add(productName.toLowerCase());
      } catch (creationError) {
        errors.push({
          index,
          name: productName,
          message:
            creationError instanceof Error
              ? creationError.message
              : 'Failed to create product',
        });
      }
    }

    return { created, skipped, errors };
  }
}
