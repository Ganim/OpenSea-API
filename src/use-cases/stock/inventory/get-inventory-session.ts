import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InventorySession } from '@/entities/stock/inventory-session';
import type { InventorySessionItem } from '@/entities/stock/inventory-session-item';
import type { InventorySessionItemsRepository } from '@/repositories/stock/inventory-session-items-repository';
import type { InventorySessionsRepository } from '@/repositories/stock/inventory-sessions-repository';

interface GetInventorySessionUseCaseRequest {
  tenantId: string;
  sessionId: string;
}

interface GetInventorySessionUseCaseResponse {
  session: InventorySession;
  items: InventorySessionItem[];
}

export class GetInventorySessionUseCase {
  constructor(
    private inventorySessionsRepository: InventorySessionsRepository,
    private inventorySessionItemsRepository: InventorySessionItemsRepository,
  ) {}

  async execute(
    input: GetInventorySessionUseCaseRequest,
  ): Promise<GetInventorySessionUseCaseResponse> {
    const session = await this.inventorySessionsRepository.findById(
      new UniqueEntityID(input.sessionId),
      input.tenantId,
    );
    if (!session) {
      throw new ResourceNotFoundError('Inventory session not found.');
    }

    const items = await this.inventorySessionItemsRepository.findManyBySession(
      session.id,
    );

    return { session, items };
  }
}
