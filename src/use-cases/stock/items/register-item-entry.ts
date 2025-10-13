import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import { ItemsRepository } from '@/repositories/stock/items-repository';
import { LocationsRepository } from '@/repositories/stock/locations-repository';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

export interface RegisterItemEntryUseCaseInput {
  uniqueCode: string;
  variantId: string;
  locationId: string;
  quantity: number;
  userId: string;
  attributes?: Record<string, unknown>;
  batchNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  notes?: string;
}

export interface RegisterItemEntryUseCaseOutput {
  item: {
    id: string;
    uniqueCode: string;
    variantId: string;
    locationId: string;
    initialQuantity: number;
    currentQuantity: number;
    status: string;
    entryDate: Date;
    attributes: Record<string, unknown>;
    batchNumber?: string;
    manufacturingDate?: Date;
    expiryDate?: Date;
    createdAt: Date;
  };
  movement: {
    id: string;
    itemId: string;
    userId: string;
    quantity: number;
    movementType: string;
    createdAt: Date;
  };
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
    // Validate uniqueCode
    if (!input.uniqueCode || input.uniqueCode.trim().length === 0) {
      throw new BadRequestError('Unique code is required');
    }

    if (input.uniqueCode.length > 128) {
      throw new BadRequestError('Unique code must not exceed 128 characters');
    }

    // Check if uniqueCode is unique
    const existingItem = await this.itemsRepository.findByUniqueCode(
      input.uniqueCode,
    );

    if (existingItem) {
      throw new BadRequestError('Unique code already exists');
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

    // Validate location exists
    const locationId = new UniqueEntityID(input.locationId);
    const location = await this.locationsRepository.findById(locationId);

    if (!location) {
      throw new ResourceNotFoundError('Location not found');
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
      uniqueCode: input.uniqueCode,
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
      item: {
        id: item.id.toString(),
        uniqueCode: item.uniqueCode,
        variantId: item.variantId.toString(),
        locationId: item.locationId.toString(),
        initialQuantity: item.initialQuantity,
        currentQuantity: item.currentQuantity,
        status: item.status.value,
        entryDate: item.entryDate,
        attributes: item.attributes,
        batchNumber: item.batchNumber,
        manufacturingDate: item.manufacturingDate,
        expiryDate: item.expiryDate,
        createdAt: item.createdAt,
      },
      movement: {
        id: movement.id.toString(),
        itemId: movement.itemId.toString(),
        userId: movement.userId.toString(),
        quantity: movement.quantity,
        movementType: movement.movementType.value,
        createdAt: movement.createdAt,
      },
    };
  }
}
