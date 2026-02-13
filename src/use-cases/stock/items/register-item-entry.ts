import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import { Slug } from '@/entities/stock/value-objects/slug';
import type { ItemMovementDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import { itemMovementToDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import { BinsRepository } from '@/repositories/stock/bins-repository';
import { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import { ItemsRepository } from '@/repositories/stock/items-repository';
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
 * @example padCode(1, 5) => "00001"
 */
function padCode(seq: number, digits: number): string {
  return seq.toString().padStart(digits, '0');
}

export interface RegisterItemEntryUseCaseInput {
  tenantId: string;
  uniqueCode?: string; // Agora opcional - será gerado automaticamente se não fornecido
  variantId: string;
  binId?: string; // Referência ao bin onde o item está armazenado
  quantity: number;
  movementType?: 'PURCHASE' | 'CUSTOMER_RETURN'; // Tipo de entrada (padrão: PURCHASE)
  userId: string;
  unitCost?: number; // Custo unitário do item
  attributes?: Record<string, unknown>;
  batchNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  notes?: string;
}

export interface RegisterItemEntryUseCaseOutput {
  item: ItemDTO;
  movement: ItemMovementDTO;
}

export class RegisterItemEntryUseCase {
  constructor(
    private itemsRepository: ItemsRepository,
    private variantsRepository: VariantsRepository,
    private binsRepository: BinsRepository,
    private itemMovementsRepository: ItemMovementsRepository,
    private productsRepository: ProductsRepository,
    private templatesRepository: TemplatesRepository,
  ) {}

  async execute(
    input: RegisterItemEntryUseCaseInput,
  ): Promise<RegisterItemEntryUseCaseOutput> {
    // Validate or generate uniqueCode
    let uniqueCode = input.uniqueCode;

    if (uniqueCode) {
      if (uniqueCode.length > 128) {
        throw new BadRequestError('Unique code must not exceed 128 characters');
      }

      // Check if uniqueCode is unique
      const existingItem = await this.itemsRepository.findByUniqueCode(
        uniqueCode,
        input.tenantId,
      );

      if (existingItem) {
        throw new BadRequestError('Unique code already exists');
      }
    } else {
      // Generate unique code automatically (UUID)
      uniqueCode = new UniqueEntityID().toString();
    }

    // Validate quantity
    if (input.quantity <= 0) {
      throw new BadRequestError('Quantity must be greater than 0');
    }

    // Validate variant exists
    const variantId = new UniqueEntityID(input.variantId);
    const variant = await this.variantsRepository.findById(
      variantId,
      input.tenantId,
    );

    if (!variant) {
      throw new ResourceNotFoundError('Variant not found');
    }

    // Validate bin exists if provided
    let binId: UniqueEntityID | undefined;
    let binAddress: string | undefined;
    if (input.binId) {
      binId = new UniqueEntityID(input.binId);
      const bin = await this.binsRepository.findById(binId, input.tenantId);

      if (!bin) {
        throw new ResourceNotFoundError('Bin not found');
      }
      binAddress = bin?.address;
    }

    // Validate batchNumber length
    if (input.batchNumber && input.batchNumber.length > 64) {
      throw new BadRequestError('Batch number must not exceed 64 characters');
    }

    // Validate dates
    if (input.manufacturingDate && input.expiryDate) {
      if (input.manufacturingDate >= input.expiryDate) {
        throw new BadRequestError(
          'Manufacturing date must be before expiry date',
        );
      }
    }

    if (input.expiryDate && input.expiryDate < new Date()) {
      throw new BadRequestError('Expiry date cannot be in the past');
    }

    // Validate attributes against template
    const product = await this.productsRepository.findById(
      variant.productId,
      input.tenantId,
    );
    if (product) {
      const template = await this.templatesRepository.findById(
        product.templateId,
        input.tenantId,
      );
      if (template) {
        assertValidAttributes(
          input.attributes,
          template.itemAttributes,
          'item',
        );
      }
    }

    // Get next sequential code LOCAL to this variant
    const lastItem = await this.itemsRepository.findLastByVariantId(
      variantId,
      input.tenantId,
    );
    const nextSeq = (lastItem?.sequentialCode ?? 0) + 1;

    // Generate fullCode: VARIANT_FULLCODE-ITEM_SEQ (ex: 001.001.0001.001-00001)
    // Note: Uses DASH (-) to differentiate item level from variant level
    const fullCode = `${variant.fullCode}-${padCode(nextSeq, 5)}`;

    // Generate slug from variant name + sequential (to ensure uniqueness)
    const slug = Slug.createUniqueFromText(
      variant.name,
      `${variant.fullCode}-${nextSeq}`,
    );

    // Generate barcode codes from fullCode (IMUTÁVEIS)
    const barcode = generateBarcode(fullCode);
    const eanCode = generateEAN13(fullCode);
    const upcCode = generateUPC(fullCode);

    // Create item
    const item = await this.itemsRepository.create({
      tenantId: input.tenantId,
      uniqueCode,
      slug,
      fullCode,
      sequentialCode: nextSeq,
      barcode,
      eanCode,
      upcCode,
      variantId,
      binId,
      lastKnownAddress: binAddress,
      initialQuantity: input.quantity,
      currentQuantity: input.quantity,
      unitCost: input.unitCost,
      status: ItemStatus.create('AVAILABLE'),
      entryDate: new Date(),
      attributes: input.attributes ?? {},
      batchNumber: input.batchNumber,
      manufacturingDate: input.manufacturingDate,
      expiryDate: input.expiryDate,
    });

    const entryType = input.movementType || 'PURCHASE';

    const movement = await this.itemMovementsRepository.create({
      tenantId: input.tenantId,
      itemId: item.id,
      userId: new UniqueEntityID(input.userId),
      quantity: input.quantity,
      quantityBefore: 0,
      quantityAfter: input.quantity,
      movementType: MovementType.create(entryType),
      reasonCode: 'ENTRY',
      destinationRef: binAddress ? `Bin: ${binAddress}` : undefined,
      notes: input.notes,
      batchNumber: input.batchNumber,
    });

    return {
      item: itemToDTO(item),
      movement: itemMovementToDTO(movement),
    };
  }
}
