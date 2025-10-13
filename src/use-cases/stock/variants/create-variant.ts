import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

export interface CreateVariantUseCaseInput {
  productId: string;
  sku: string;
  name: string;
  price: number;
  imageUrl?: string;
  attributes?: Record<string, unknown>;
  costPrice?: number;
  profitMargin?: number;
  barcode?: string;
  qrCode?: string;
  eanCode?: string;
  upcCode?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
}

export interface CreateVariantUseCaseOutput {
  variant: {
    id: string;
    productId: string;
    sku: string;
    name: string;
    price: number;
    imageUrl?: string;
    attributes: Record<string, unknown>;
    costPrice?: number;
    profitMargin?: number;
    barcode?: string;
    qrCode?: string;
    eanCode?: string;
    upcCode?: string;
    minStock?: number;
    maxStock?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    createdAt: Date;
    updatedAt?: Date;
  };
}

export class CreateVariantUseCase {
  constructor(
    private variantsRepository: VariantsRepository,
    private productsRepository: ProductsRepository,
    private templatesRepository: TemplatesRepository,
  ) {}

  async execute(
    input: CreateVariantUseCaseInput,
  ): Promise<CreateVariantUseCaseOutput> {
    // Validate SKU
    if (!input.sku || input.sku.trim().length === 0) {
      throw new BadRequestError('SKU is required');
    }

    if (input.sku.length > 64) {
      throw new BadRequestError('SKU must not exceed 64 characters');
    }

    // Validate name
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Name is required');
    }

    if (input.name.length > 256) {
      throw new BadRequestError('Name must not exceed 256 characters');
    }

    // Validate price
    if (input.price < 0) {
      throw new BadRequestError('Price cannot be negative');
    }

    // Validate profitMargin
    if (
      input.profitMargin !== undefined &&
      (input.profitMargin < 0 || input.profitMargin > 100)
    ) {
      throw new BadRequestError('Profit margin must be between 0 and 100');
    }

    // Validate costPrice
    if (input.costPrice !== undefined && input.costPrice < 0) {
      throw new BadRequestError('Cost price cannot be negative');
    }

    // Validate stock levels
    if (input.minStock !== undefined && input.minStock < 0) {
      throw new BadRequestError('Min stock cannot be negative');
    }

    if (input.maxStock !== undefined && input.maxStock < 0) {
      throw new BadRequestError('Max stock cannot be negative');
    }

    if (
      input.minStock !== undefined &&
      input.maxStock !== undefined &&
      input.minStock > input.maxStock
    ) {
      throw new BadRequestError('Min stock cannot be greater than max stock');
    }

    if (input.reorderPoint !== undefined && input.reorderPoint < 0) {
      throw new BadRequestError('Reorder point cannot be negative');
    }

    if (input.reorderQuantity !== undefined && input.reorderQuantity < 0) {
      throw new BadRequestError('Reorder quantity cannot be negative');
    }

    // Validate imageUrl length
    if (input.imageUrl && input.imageUrl.length > 512) {
      throw new BadRequestError('Image URL must not exceed 512 characters');
    }

    // Validate barcode length
    if (input.barcode && input.barcode.length > 128) {
      throw new BadRequestError('Barcode must not exceed 128 characters');
    }

    // Validate eanCode length
    if (input.eanCode && input.eanCode.length > 13) {
      throw new BadRequestError('EAN code must not exceed 13 characters');
    }

    // Validate upcCode length
    if (input.upcCode && input.upcCode.length > 12) {
      throw new BadRequestError('UPC code must not exceed 12 characters');
    }

    // Validate qrCode length
    if (input.qrCode && input.qrCode.length > 512) {
      throw new BadRequestError('QR code must not exceed 512 characters');
    }

    // Check if product exists
    const productId = new UniqueEntityID(input.productId);
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new ResourceNotFoundError('Product not found');
    }

    // Check if SKU is unique
    const existingVariantBySKU = await this.variantsRepository.findBySKU(
      input.sku,
    );

    if (existingVariantBySKU) {
      throw new BadRequestError('SKU already exists');
    }

    // Check if barcode is unique (if provided)
    if (input.barcode) {
      const existingVariantByBarcode =
        await this.variantsRepository.findByBarcode(input.barcode);

      if (existingVariantByBarcode) {
        throw new BadRequestError('Barcode already exists');
      }
    }

    // Check if eanCode is unique (if provided)
    if (input.eanCode) {
      const existingVariantByEANCode =
        await this.variantsRepository.findByEANCode(input.eanCode);

      if (existingVariantByEANCode) {
        throw new BadRequestError('EAN code already exists');
      }
    }

    // Check if upcCode is unique (if provided)
    if (input.upcCode) {
      const existingVariantByUPCCode =
        await this.variantsRepository.findByUPCCode(input.upcCode);

      if (existingVariantByUPCCode) {
        throw new BadRequestError('UPC code already exists');
      }
    }

    // Validate attributes against product template
    if (input.attributes) {
      const template = await this.templatesRepository.findById(
        product.templateId,
      );

      if (template && template.variantAttributes) {
        const allowedKeys = Object.keys(template.variantAttributes);
        const providedKeys = Object.keys(input.attributes);

        const invalidKeys = providedKeys.filter(
          (key) => !allowedKeys.includes(key),
        );

        if (invalidKeys.length > 0) {
          throw new BadRequestError(
            `Invalid attribute keys: ${invalidKeys.join(', ')}. Allowed keys: ${allowedKeys.join(', ')}`,
          );
        }
      }
    }

    // Create variant
    const variant = await this.variantsRepository.create({
      productId,
      sku: input.sku,
      name: input.name,
      price: input.price,
      imageUrl: input.imageUrl,
      attributes: input.attributes ?? {},
      costPrice: input.costPrice,
      profitMargin: input.profitMargin,
      barcode: input.barcode,
      qrCode: input.qrCode,
      eanCode: input.eanCode,
      upcCode: input.upcCode,
      minStock: input.minStock,
      maxStock: input.maxStock,
      reorderPoint: input.reorderPoint,
      reorderQuantity: input.reorderQuantity,
    });

    return {
      variant: {
        id: variant.id.toString(),
        productId: variant.productId.toString(),
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        imageUrl: variant.imageUrl,
        attributes: variant.attributes,
        costPrice: variant.costPrice,
        profitMargin: variant.profitMargin,
        barcode: variant.barcode,
        qrCode: variant.qrCode,
        eanCode: variant.eanCode,
        upcCode: variant.upcCode,
        minStock: variant.minStock,
        maxStock: variant.maxStock,
        reorderPoint: variant.reorderPoint,
        reorderQuantity: variant.reorderQuantity,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      },
    };
  }
}
