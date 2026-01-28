import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SKU } from '@/entities/stock/value-objects/sku';
import { Slug } from '@/entities/stock/value-objects/slug';
import { Variant } from '@/entities/stock/variant';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';
import { VariantsRepository } from '@/repositories/stock/variants-repository';
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

export interface CreateVariantUseCaseInput {
  productId: string;
  sku?: string;
  name: string;
  price?: number;
  imageUrl?: string;
  attributes?: Record<string, unknown>;
  costPrice?: number;
  profitMargin?: number;
  qrCode?: string; // QR Code é o único campo editável
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

export class CreateVariantUseCase {
  constructor(
    private variantsRepository: VariantsRepository,
    private productsRepository: ProductsRepository,
    private templatesRepository: TemplatesRepository,
  ) {}

  async execute(input: CreateVariantUseCaseInput): Promise<Variant> {
    // Validate name
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Name is required');
    }

    if (input.name.length > 256) {
      throw new BadRequestError('Name must not exceed 256 characters');
    }

    // Generate SKU if not provided
    let sku: string;
    if (input.sku && input.sku.trim().length > 0) {
      sku = SKU.create(input.sku).value;
    } else {
      const skuVO = await SKU.generateFromName(
        input.name,
        this.variantsRepository,
      );
      sku = skuVO.value;
    }

    // Validate SKU length
    if (sku.length > 64) {
      throw new BadRequestError('SKU must not exceed 64 characters');
    }

    // Set default price if not provided
    const price = input.price ?? 0;

    // Validate price
    if (price < 0) {
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

    // Validate qrCode length
    if (input.qrCode && input.qrCode.length > 512) {
      throw new BadRequestError('QR code must not exceed 512 characters');
    }

    // Validate colorHex format
    if (input.colorHex && !/^#[0-9A-Fa-f]{6}$/.test(input.colorHex)) {
      throw new BadRequestError('Color hex must be in format #RRGGBB');
    }

    // Validate colorPantone length
    if (input.colorPantone && input.colorPantone.length > 32) {
      throw new BadRequestError('Color Pantone must not exceed 32 characters');
    }

    // Check if product exists
    const productId = new UniqueEntityID(input.productId);
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new ResourceNotFoundError('Product not found');
    }

    // Check if SKU is unique (only if it was provided by user)
    if (input.sku) {
      const existingVariantBySKU = await this.variantsRepository.findBySKU(sku);

      if (existingVariantBySKU) {
        throw new BadRequestError('SKU already exists');
      }
    }

    // Validate attributes against product template
    const template = await this.templatesRepository.findById(
      product.templateId,
    );
    if (template) {
      assertValidAttributes(
        input.attributes,
        template.variantAttributes,
        'variant',
      );
    }

    // Get next sequential code LOCAL to this product
    const lastVariant = await this.variantsRepository.findLastByProductId(productId);
    const nextSeq = (lastVariant?.sequentialCode ?? 0) + 1;

    // Generate fullCode: PRODUCT_FULLCODE.VARIANT_SEQ (ex: 001.001.0001.001)
    const fullCode = `${product.fullCode}.${padCode(nextSeq, 3)}`;

    // Generate slug from name (with nextSeq as suffix to ensure uniqueness)
    const slug = Slug.createUniqueFromText(input.name, `${product.fullCode}-${nextSeq}`);

    // Generate barcode codes from fullCode (IMUTÁVEIS)
    const barcode = generateBarcode(fullCode);
    const eanCode = generateEAN13(fullCode);
    const upcCode = generateUPC(fullCode);

    // Create variant
    const variant = await this.variantsRepository.create({
      productId,
      slug,
      fullCode,
      sequentialCode: nextSeq,
      barcode,
      eanCode,
      upcCode,
      sku,
      name: input.name,
      price,
      imageUrl: input.imageUrl,
      attributes: input.attributes ?? {},
      costPrice: input.costPrice,
      profitMargin: input.profitMargin,
      qrCode: input.qrCode,
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

    return variant;
  }
}
