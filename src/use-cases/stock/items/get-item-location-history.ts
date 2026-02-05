import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';

interface GetItemLocationHistoryUseCaseRequest {
  tenantId: string;
  itemId: string;
}

export interface LocationHistoryEntry {
  id: string;
  date: Date;
  type: string;
  from: string | null;
  to: string | null;
  userId: string;
  notes: string | null;
}

interface GetItemLocationHistoryUseCaseResponse {
  data: LocationHistoryEntry[];
}

const LOCATION_MOVEMENT_TYPES = new Set([
  'TRANSFER',
  'ZONE_RECONFIGURE',
  'INVENTORY_ADJUSTMENT',
]);

export class GetItemLocationHistoryUseCase {
  constructor(
    private itemsRepository: ItemsRepository,
    private itemMovementsRepository: ItemMovementsRepository,
  ) {}

  async execute({
    tenantId,
    itemId,
  }: GetItemLocationHistoryUseCaseRequest): Promise<GetItemLocationHistoryUseCaseResponse> {
    const item = await this.itemsRepository.findById(
      new UniqueEntityID(itemId),
      tenantId,
    );
    if (!item) {
      throw new ResourceNotFoundError('Item');
    }

    const movements = await this.itemMovementsRepository.findManyByItem(
      new UniqueEntityID(itemId),
      tenantId,
    );

    // Filter for location-related movements and sort by date desc
    const locationMovements = movements
      .filter((m) => LOCATION_MOVEMENT_TYPES.has(m.movementType.value))
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

    const data: LocationHistoryEntry[] = locationMovements.map((m) => ({
      id: m.id.toString(),
      date: m.createdAt,
      type: m.movementType.value,
      from: m.originRef ?? null,
      to: m.destinationRef ?? null,
      userId: m.userId.toString(),
      notes: m.notes ?? null,
    }));

    return { data };
  }
}
