import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InventorySession } from '@/entities/stock/inventory-session';
import type { InventorySessionsRepository } from '@/repositories/stock/inventory-sessions-repository';

interface CancelInventorySessionUseCaseRequest {
  tenantId: string;
  sessionId: string;
}

interface CancelInventorySessionUseCaseResponse {
  session: InventorySession;
}

export class CancelInventorySessionUseCase {
  constructor(
    private inventorySessionsRepository: InventorySessionsRepository,
  ) {}

  async execute(
    input: CancelInventorySessionUseCaseRequest,
  ): Promise<CancelInventorySessionUseCaseResponse> {
    const session = await this.inventorySessionsRepository.findById(
      new UniqueEntityID(input.sessionId),
      input.tenantId,
    );
    if (!session) {
      throw new ResourceNotFoundError('Inventory session not found.');
    }

    session.cancel();
    await this.inventorySessionsRepository.save(session);

    return { session };
  }
}
