import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Variant } from '@/entities/stock/variant';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

export interface UpdateVariantUseCaseInput {
  tenantId: string;
  id: string;
  sku?: string;
  name?: string;
  price?: number;
  imageUrl?: string;
  attributes?: Record<string, unknown>;
  costPrice?: number;
  profitMargin?: number;
  barcode?: string;
  qrCode?: string;
  eanCode?: string;
  upcCode?: string;
  colorHex?: string;
  colorPantone?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  reference?: string;
  similars?: unknown[];
  outOfLine?: boolean;
  isActive?: boolean;
}

export class UpdateVariantUseCase {
  constructor(
    private variantsRepository: VariantsRepository,
    private productsRepository: ProductsRepository,
    private templatesRepository: TemplatesRepository,
  ) {}

  async execute(input: UpdateVariantUseCaseInput): Promise<Variant> {
    const variantId = new UniqueEntityID(input.id);
    const variant = await this.variantsRepository.findById(
      variantId,
      input.tenantId,
    );

    if (!variant) {
      throw new ResourceNotFoundError('Variant not found');
    }

    // Validate name if provided
    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        throw new BadRequestError('Name cannot be empty');
      }

      if (input.name.length > 256) {
        throw new BadRequestError('Name must not exceed 256 characters');
      }
    }

    // Validate SKU if provided
    if (input.sku !== undefined) {
      if (input.sku.trim().length === 0) {
        throw new BadRequestError('SKU cannot be empty');
      }

      if (input.sku.length > 64) {
        throw new BadRequestError('SKU must not exceed 64 characters');
      }

      // Check if SKU is unique (excluding current variant)
      const existingVariant = await this.variantsRepository.findBySKU(
        input.sku,
        input.tenantId,
      );
      if (existingVariant && !existingVariant.id.equals(variantId)) {
        throw new BadRequestError('SKU already exists');
      }
    }

    // Validate price if provided
    if (input.price !== undefined && input.price < 0) {
      throw new BadRequestError('Price cannot be negative');
    }

    // Validate profitMargin if provided
    if (
      input.profitMargin !== undefined &&
      (input.profitMargin < 0 || input.profitMargin > 100)
    ) {
      throw new BadRequestError('Profit margin must be between 0 and 100');
    }

    // Validate costPrice if provided
    if (input.costPrice !== undefined && input.costPrice < 0) {
      throw new BadRequestError('Cost price cannot be negative');
    }

    // Validate stock levels if provided
    if (input.minStock !== undefined && input.minStock < 0) {
      throw new BadRequestError('Min stock cannot be negative');
    }

    if (input.maxStock !== undefined && input.maxStock < 0) {
      throw new BadRequestError('Max stock cannot be negative');
    }

    const newMinStock = input.minStock ?? variant.minStock;
    const newMaxStock = input.maxStock ?? variant.maxStock;

    if (
      newMinStock !== undefined &&
      newMaxStock !== undefined &&
      newMinStock > newMaxStock
    ) {
      throw new BadRequestError('Min stock cannot be greater than max stock');
    }

    if (input.reorderPoint !== undefined && input.reorderPoint < 0) {
      throw new BadRequestError('Reorder point cannot be negative');
    }

    if (input.reorderQuantity !== undefined && input.reorderQuantity < 0) {
      throw new BadRequestError('Reorder quantity cannot be negative');
    }

    // Validate imageUrl length if provided
    if (input.imageUrl !== undefined && input.imageUrl.length > 512) {
      throw new BadRequestError('Image URL must not exceed 512 characters');
    }

    // Validate barcode if provided
    if (input.barcode !== undefined) {
      if (input.barcode.length > 128) {
        throw new BadRequestError('Barcode must not exceed 128 characters');
      }

      if (input.barcode) {
        const existingVariant = await this.variantsRepository.findByBarcode(
          input.barcode,
          input.tenantId,
        );
        if (existingVariant && !existingVariant.id.equals(variantId)) {
          throw new BadRequestError('Barcode already exists');
        }
      }
    }

    // Validate eanCode if provided
    if (input.eanCode !== undefined) {
      if (input.eanCode.length > 13) {
        throw new BadRequestError('EAN code must not exceed 13 characters');
      }

      if (input.eanCode) {
        const existingVariant = await this.variantsRepository.findByEANCode(
          input.eanCode,
          input.tenantId,
        );
        if (existingVariant && !existingVariant.id.equals(variantId)) {
          throw new BadRequestError('EAN code already exists');
        }
      }
    }

    // Validate upcCode if provided
    if (input.upcCode !== undefined) {
      if (input.upcCode.length > 12) {
        throw new BadRequestError('UPC code must not exceed 12 characters');
      }

      if (input.upcCode) {
        const existingVariant = await this.variantsRepository.findByUPCCode(
          input.upcCode,
          input.tenantId,
        );
        if (existingVariant && !existingVariant.id.equals(variantId)) {
          throw new BadRequestError('UPC code already exists');
        }
      }
    }

    // Validate qrCode length if provided
    if (input.qrCode !== undefined && input.qrCode.length > 512) {
      throw new BadRequestError('QR code must not exceed 512 characters');
    }

    // Validate attributes if provided
    if (input.attributes) {
      const product = await this.productsRepository.findById(
        variant.productId,
        input.tenantId,
      );

      if (product) {
        const template = await this.templatesRepository.findById(
          product.templateId,
          input.tenantId,
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
    }

    // Update variant
    const updatedVariant = await this.variantsRepository.update({
      id: variantId,
      sku: input.sku,
      name: input.name,
      price: input.price,
      imageUrl: input.imageUrl,
      attributes: input.attributes,
      costPrice: input.costPrice,
      profitMargin: input.profitMargin,
      barcode: input.barcode,
      qrCode: input.qrCode,
      eanCode: input.eanCode,
      upcCode: input.upcCode,
      colorHex: input.colorHex,
      colorPantone: input.colorPantone,
      minStock: input.minStock,
      maxStock: input.maxStock,
      reorderPoint: input.reorderPoint,
      reorderQuantity: input.reorderQuantity,
      reference: input.reference,
      similars: input.similars,
      outOfLine: input.outOfLine,
      isActive: input.isActive,
    });

    if (!updatedVariant) {
      throw new ResourceNotFoundError('Variant not found');
    }

    return updatedVariant;
  }
}
