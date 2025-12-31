import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import type { ItemMovementDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import { itemMovementToDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import { ItemsRepository } from '@/repositories/stock/items-repository';
import { LocationsRepository } from '@/repositories/stock/locations-repository';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

export interface RegisterItemEntryUseCaseInput {
  uniqueCode?: string; // Agora opcional - será gerado automaticamente se não fornecido
  variantId: string;
  locationId?: string; // Agora opcional
  quantity: number;
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
    private locationsRepository: LocationsRepository,
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
      const existingItem =
        await this.itemsRepository.findByUniqueCode(uniqueCode);

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
    const variant = await this.variantsRepository.findById(variantId);

    if (!variant) {
      throw new ResourceNotFoundError('Variant not found');
    }

    // Validate location exists if provided
    let locationId: UniqueEntityID | undefined;
    if (input.locationId) {
      locationId = new UniqueEntityID(input.locationId);
      const location = await this.locationsRepository.findById(locationId);

      if (!location) {
        throw new ResourceNotFoundError('Location not found');
      }
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
    if (input.attributes) {
      const product = await this.productsRepository.findById(variant.productId);

      if (product) {
        const template = await this.templatesRepository.findById(
          product.templateId,
        );

        if (template && template.itemAttributes) {
          const allowedKeys = Object.keys(template.itemAttributes);
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

    // Create item
    const item = await this.itemsRepository.create({
      uniqueCode,
      variantId,
      locationId,
      initialQuantity: input.quantity,
      currentQuantity: input.quantity,
      status: ItemStatus.create('AVAILABLE'),
      entryDate: new Date(),
      attributes: input.attributes ?? {},
      batchNumber: input.batchNumber,
      manufacturingDate: input.manufacturingDate,
      expiryDate: input.expiryDate,
    });

    // Create movement record (this is an implicit ENTRY movement - not in MovementType enum)
    // We'll use INVENTORY_ADJUSTMENT for entries
    const movement = await this.itemMovementsRepository.create({
      itemId: item.id,
      userId: new UniqueEntityID(input.userId),
      quantity: input.quantity,
      quantityBefore: 0,
      quantityAfter: input.quantity,
      movementType: MovementType.create('INVENTORY_ADJUSTMENT'),
      reasonCode: 'ENTRY',
      notes: input.notes,
      batchNumber: input.batchNumber,
    });

    return {
      item: itemToDTO(item),
      movement: itemMovementToDTO(movement),
    };
  }
}
