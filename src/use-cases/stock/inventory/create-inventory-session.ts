import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  InventorySession,
  InventorySessionMode,
} from '@/entities/stock/inventory-session';
import type { InventorySessionItem } from '@/entities/stock/inventory-session-item';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { InventorySessionItemsRepository } from '@/repositories/stock/inventory-session-items-repository';
import type { InventorySessionsRepository } from '@/repositories/stock/inventory-sessions-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

interface CreateInventorySessionUseCaseRequest {
  tenantId: string;
  userId: string;
  mode: InventorySessionMode;
  binId?: string;
  zoneId?: string;
  productId?: string;
  variantId?: string;
  notes?: string;
}

interface CreateInventorySessionUseCaseResponse {
  session: InventorySession;
  items: InventorySessionItem[];
}

export class CreateInventorySessionUseCase {
  constructor(
    private inventorySessionsRepository: InventorySessionsRepository,
    private inventorySessionItemsRepository: InventorySessionItemsRepository,
    private itemsRepository: ItemsRepository,
    private binsRepository: BinsRepository,
    private zonesRepository: ZonesRepository,
  ) {}

  async execute(
    input: CreateInventorySessionUseCaseRequest,
  ): Promise<CreateInventorySessionUseCaseResponse> {
    const { tenantId, mode } = input;

    // Validate scope ID is provided
    const scopeId = this.getScopeId(input);
    if (!scopeId) {
      throw new BadRequestError(
        `A scope identifier is required for mode ${mode}.`,
      );
    }

    // Check no active session exists for the same scope
    const existing = await this.inventorySessionsRepository.findActiveByScope(
      tenantId,
      mode,
      new UniqueEntityID(scopeId),
    );
    if (existing) {
      throw new BadRequestError(
        'An active inventory session already exists for this scope.',
      );
    }

    // Validate scope entity exists and load items
    const itemsToTrack = await this.loadItemsForScope(input);

    // Create session
    const session = await this.inventorySessionsRepository.create({
      tenantId,
      userId: new UniqueEntityID(input.userId),
      mode,
      binId: input.binId ? new UniqueEntityID(input.binId) : undefined,
      zoneId: input.zoneId ? new UniqueEntityID(input.zoneId) : undefined,
      productId: input.productId
        ? new UniqueEntityID(input.productId)
        : undefined,
      variantId: input.variantId
        ? new UniqueEntityID(input.variantId)
        : undefined,
      totalItems: itemsToTrack.length,
      notes: input.notes,
    });

    // Create session items
    const sessionItems = await this.inventorySessionItemsRepository.createMany(
      itemsToTrack.map((item) => ({
        sessionId: session.id,
        itemId: item.id,
        expectedBinId: item.binId,
        status: 'PENDING' as const,
      })),
    );

    // Update totalItems on session
    session.totalItems = sessionItems.length;
    await this.inventorySessionsRepository.save(session);

    return { session, items: sessionItems };
  }

  private getScopeId(
    input: CreateInventorySessionUseCaseRequest,
  ): string | undefined {
    switch (input.mode) {
      case 'BIN':
        return input.binId;
      case 'ZONE':
        return input.zoneId;
      case 'PRODUCT':
        return input.variantId ?? input.productId;
      default:
        return undefined;
    }
  }

  private async loadItemsForScope(input: CreateInventorySessionUseCaseRequest) {
    const { tenantId, mode } = input;

    switch (mode) {
      case 'BIN': {
        if (!input.binId) {
          throw new BadRequestError('binId is required for BIN mode.');
        }
        const binId = new UniqueEntityID(input.binId);
        const bin = await this.binsRepository.findById(binId, tenantId);
        if (!bin) {
          throw new ResourceNotFoundError('Bin not found.');
        }
        return this.itemsRepository.findManyByBin(binId, tenantId);
      }

      case 'ZONE': {
        if (!input.zoneId) {
          throw new BadRequestError('zoneId is required for ZONE mode.');
        }
        const zoneId = new UniqueEntityID(input.zoneId);
        const zone = await this.zonesRepository.findById(zoneId, tenantId);
        if (!zone) {
          throw new ResourceNotFoundError('Zone not found.');
        }
        const bins = await this.binsRepository.findManyByZone(zoneId, tenantId);
        const allItems = [];
        for (const bin of bins) {
          const items = await this.itemsRepository.findManyByBin(
            bin.binId,
            tenantId,
          );
          allItems.push(...items);
        }
        return allItems;
      }

      case 'PRODUCT': {
        if (!input.productId && !input.variantId) {
          throw new BadRequestError(
            'productId or variantId is required for PRODUCT mode.',
          );
        }
        if (input.variantId) {
          return this.itemsRepository.findManyByVariant(
            new UniqueEntityID(input.variantId),
            tenantId,
          );
        }
        return this.itemsRepository.findManyByProduct(
          new UniqueEntityID(input.productId!),
          tenantId,
        );
      }

      default:
        throw new BadRequestError(`Invalid mode: ${mode}`);
    }
  }
}
