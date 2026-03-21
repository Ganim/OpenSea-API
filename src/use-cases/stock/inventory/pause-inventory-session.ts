import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InventorySession } from '@/entities/stock/inventory-session';
import type { InventorySessionsRepository } from '@/repositories/stock/inventory-sessions-repository';

interface PauseInventorySessionUseCaseRequest {
  tenantId: string;
  sessionId: string;
}

interface PauseInventorySessionUseCaseResponse {
  session: InventorySession;
}

export class PauseInventorySessionUseCase {
  constructor(
    private inventorySessionsRepository: InventorySessionsRepository,
  ) {}

  async execute(
    input: PauseInventorySessionUseCaseRequest,
  ): Promise<PauseInventorySessionUseCaseResponse> {
    const session = await this.inventorySessionsRepository.findById(
      new UniqueEntityID(input.sessionId),
      input.tenantId,
    );
    if (!session) {
      throw new ResourceNotFoundError('Inventory session not found.');
    }

    session.pause();
    await this.inventorySessionsRepository.save(session);

    return { session };
  }
}
