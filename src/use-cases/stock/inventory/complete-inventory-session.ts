import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InventorySession } from '@/entities/stock/inventory-session';
import type { InventorySessionItemsRepository } from '@/repositories/stock/inventory-session-items-repository';
import type { InventorySessionsRepository } from '@/repositories/stock/inventory-sessions-repository';

interface CompleteInventorySessionUseCaseRequest {
  tenantId: string;
  sessionId: string;
}

interface CompleteInventorySessionUseCaseResponse {
  session: InventorySession;
}

export class CompleteInventorySessionUseCase {
  constructor(
    private inventorySessionsRepository: InventorySessionsRepository,
    private inventorySessionItemsRepository: InventorySessionItemsRepository,
  ) {}

  async execute(
    input: CompleteInventorySessionUseCaseRequest,
  ): Promise<CompleteInventorySessionUseCaseResponse> {
    const session = await this.inventorySessionsRepository.findById(
      new UniqueEntityID(input.sessionId),
      input.tenantId,
    );
    if (!session) {
      throw new ResourceNotFoundError('Inventory session not found.');
    }

    // Mark any remaining PENDING items as MISSING
    const sessionItems =
      await this.inventorySessionItemsRepository.findManyBySession(session.id);
    for (const item of sessionItems) {
      if (item.status === 'PENDING') {
        item.markMissing();
        await this.inventorySessionItemsRepository.save(item);
        session.divergentItems = session.divergentItems + 1;
      }
    }

    session.complete();
    await this.inventorySessionsRepository.save(session);

    return { session };
  }
}
