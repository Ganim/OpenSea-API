import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Product } from '@/entities/stock/product';
import { Template } from '@/entities/stock/template';
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
import {
  assertValidAttributes,
  normalizeSelectAttributes,
} from '@/utils/validate-template-attributes';

/**
 * Gera codigo hierarquico com padding
 * @example padCode(1, 3) => "001", padCode(42, 4) => "0042"
 */
function padCode(seq: number, digits: number): string {
  return seq.toString().padStart(digits, '0');
}

interface BulkVariantInput {
  name: string;
  productId: string;
  sku?: string;
  price?: number;
  costPrice?: number;
  profitMargin?: number;
  colorHex?: string;
  colorPantone?: string;
  secondaryColorHex?: string;
  secondaryColorPantone?: string;
  pattern?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  reference?: string;
  outOfLine?: boolean;
  isActive?: boolean;
  attributes?: Record<string, unknown>;
}

interface BulkCreateVariantsUseCaseRequest {
  tenantId: string;
  variants: BulkVariantInput[];
  options: { skipDuplicates: boolean };
}

interface BulkCreateVariantsUseCaseResponse {
  created: Variant[];
  skipped: Array<{ name: string; reason: string }>;
  errors: Array<{ index: number; name: string; message: string }>;
}

export class BulkCreateVariantsUseCase {
  constructor(
    private variantsRepository: VariantsRepository,
    private productsRepository: ProductsRepository,
    private templatesRepository: TemplatesRepository,
  ) {}

  async execute(
    request: BulkCreateVariantsUseCaseRequest,
  ): Promise<BulkCreateVariantsUseCaseResponse> {
    const { tenantId, variants, options } = request;

    const created: Variant[] = [];
    const skipped: Array<{ name: string; reason: string }> = [];
    const errors: Array<{ index: number; name: string; message: string }> = [];

    if (variants.length === 0) {
      return { created, skipped, errors };
    }

    // Pre-fetch all unique products by productId
    const uniqueProductIds = [
      ...new Set(variants.map((v) => v.productId)),
    ];
    const productMap = new Map<string, Product>();
    for (const productId of uniqueProductIds) {
      const product = await this.productsRepository.findById(
        new UniqueEntityID(productId),
        tenantId,
      );
      if (product) {
        productMap.set(productId, product);
      }
    }

    // Pre-fetch templates for each product (variants inherit template from their product)
    const uniqueTemplateIds = [
      ...new Set(
        [...productMap.values()]
          .map((product) => product.templateId.toString()),
      ),
    ];
    const templateMap = new Map<string, Template>();
    for (const templateId of uniqueTemplateIds) {
      const template = await this.templatesRepository.findById(
        new UniqueEntityID(templateId),
        tenantId,
      );
      if (template) {
        templateMap.set(templateId, template);
      }
    }

    // Pre-fetch existing variants per product for duplicate checking
    const existingVariantsByProduct = new Map<string, Set<string>>();
    for (const productId of uniqueProductIds) {
      if (productMap.has(productId)) {
        const existingVariants =
          await this.variantsRepository.findManyByProduct(
            new UniqueEntityID(productId),
            tenantId,
          );
        existingVariantsByProduct.set(
          productId,
          new Set(existingVariants.map((v) => v.name.toLowerCase())),
        );
      }
    }

    // Track next sequential code per product
    const nextSeqByProductId = new Map<string, number>();
    for (const productId of uniqueProductIds) {
      if (productMap.has(productId)) {
        const lastVariant =
          await this.variantsRepository.findLastByProductId(
            new UniqueEntityID(productId),
            tenantId,
          );
        nextSeqByProductId.set(
          productId,
          (lastVariant?.sequentialCode ?? 0) + 1,
        );
      }
    }

    // Process each variant
    for (let index = 0; index < variants.length; index++) {
      const variantInput = variants[index];
      const variantName = variantInput.name;

      // a. Validate name
      if (!variantName || variantName.trim().length === 0) {
        errors.push({
          index,
          name: variantName ?? '',
          message: 'Name is required',
        });
        continue;
      }

      if (variantName.length > 256) {
        errors.push({
          index,
          name: variantName,
          message: 'Name must not exceed 256 characters',
        });
        continue;
      }

      // b. Validate product exists
      const product = productMap.get(variantInput.productId);
      if (!product) {
        errors.push({
          index,
          name: variantName,
          message: `Product not found: ${variantInput.productId}`,
        });
        continue;
      }

      // c. Check duplicate (existing DB + intra-batch)
      const existingNamesForProduct =
        existingVariantsByProduct.get(variantInput.productId) ?? new Set();
      if (existingNamesForProduct.has(variantName.toLowerCase())) {
        if (options.skipDuplicates) {
          skipped.push({
            name: variantName,
            reason: 'Variant with this name already exists for the product',
          });
        } else {
          errors.push({
            index,
            name: variantName,
            message:
              'Variant with this name already exists for the product',
          });
        }
        continue;
      }

      // d. Validate attributes against product template
      const template = templateMap.get(product.templateId.toString());
      let normalizedAttributes = variantInput.attributes;
      if (template) {
        try {
          assertValidAttributes(
            variantInput.attributes,
            template.variantAttributes,
            'variant',
          );
        } catch (attributeError) {
          errors.push({
            index,
            name: variantName,
            message:
              attributeError instanceof Error
                ? attributeError.message
                : 'Invalid attributes',
          });
          continue;
        }
        normalizedAttributes = normalizeSelectAttributes(
          variantInput.attributes,
          template.variantAttributes,
        );
      }

      // e. Validate price
      const price = variantInput.price ?? 0;
      if (price < 0) {
        errors.push({
          index,
          name: variantName,
          message: 'Price cannot be negative',
        });
        continue;
      }

      // f. Validate costPrice
      if (
        variantInput.costPrice !== undefined &&
        variantInput.costPrice < 0
      ) {
        errors.push({
          index,
          name: variantName,
          message: 'Cost price cannot be negative',
        });
        continue;
      }

      // g. Validate profitMargin
      if (
        variantInput.profitMargin !== undefined &&
        (variantInput.profitMargin < 0 || variantInput.profitMargin > 100)
      ) {
        errors.push({
          index,
          name: variantName,
          message: 'Profit margin must be between 0 and 100',
        });
        continue;
      }

      // h. Validate stock levels
      if (
        variantInput.minStock !== undefined &&
        variantInput.maxStock !== undefined &&
        variantInput.minStock > variantInput.maxStock
      ) {
        errors.push({
          index,
          name: variantName,
          message: 'Min stock cannot be greater than max stock',
        });
        continue;
      }

      // i. Validate colorHex format
      if (
        variantInput.colorHex &&
        !/^#[0-9A-Fa-f]{6}$/.test(variantInput.colorHex)
      ) {
        errors.push({
          index,
          name: variantName,
          message: 'Color hex must be in format #RRGGBB',
        });
        continue;
      }

      // j. Generate SKU
      let sku: string;
      if (variantInput.sku && variantInput.sku.trim().length > 0) {
        sku = SKU.create(variantInput.sku).value;
      } else {
        const skuVO = await SKU.generateFromName(
          variantName,
          this.variantsRepository,
        );
        sku = skuVO.value;
      }

      if (sku.length > 64) {
        errors.push({
          index,
          name: variantName,
          message: 'SKU must not exceed 64 characters',
        });
        continue;
      }

      // k. Generate codes (sequential per product)
      const nextSeq = nextSeqByProductId.get(variantInput.productId) ?? 1;
      const fullCode = `${product.fullCode}.${padCode(nextSeq, 3)}`;
      const slug = Slug.createUniqueFromText(
        variantName,
        `${product.fullCode}-${nextSeq}`,
      );
      const barcode = generateBarcode(fullCode);
      const eanCode = generateEAN13(fullCode);
      const upcCode = generateUPC(fullCode);

      // l. Create variant via repository
      try {
        const createdVariant = await this.variantsRepository.create({
          tenantId,
          productId: new UniqueEntityID(variantInput.productId),
          slug,
          fullCode,
          sequentialCode: nextSeq,
          barcode,
          eanCode,
          upcCode,
          sku,
          name: variantName,
          price,
          attributes: normalizedAttributes ?? {},
          costPrice: variantInput.costPrice,
          profitMargin: variantInput.profitMargin,
          colorHex: variantInput.colorHex,
          colorPantone: variantInput.colorPantone,
          secondaryColorHex: variantInput.secondaryColorHex,
          secondaryColorPantone: variantInput.secondaryColorPantone,
          pattern: variantInput.pattern,
          minStock: variantInput.minStock,
          maxStock: variantInput.maxStock,
          reorderPoint: variantInput.reorderPoint,
          reorderQuantity: variantInput.reorderQuantity,
          reference: variantInput.reference,
          outOfLine: variantInput.outOfLine,
          isActive: variantInput.isActive,
        });

        created.push(createdVariant);

        // Increment sequential code for this product
        nextSeqByProductId.set(variantInput.productId, nextSeq + 1);

        // Prevent intra-batch duplicates
        existingNamesForProduct.add(variantName.toLowerCase());
      } catch (creationError) {
        errors.push({
          index,
          name: variantName,
          message:
            creationError instanceof Error
              ? creationError.message
              : 'Failed to create variant',
        });
      }
    }

    return { created, skipped, errors };
  }
}
