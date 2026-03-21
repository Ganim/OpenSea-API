import type { PosCashMovement } from '@/entities/sales/pos-cash-movement';
import type { PosCashMovementsRepository } from '../pos-cash-movements-repository';

export class InMemoryPosCashMovementsRepository
  implements PosCashMovementsRepository
{
  public items: PosCashMovement[] = [];

  async create(movement: PosCashMovement): Promise<void> {
    this.items.push(movement);
  }

  async findBySessionId(sessionId: string): Promise<PosCashMovement[]> {
    return this.items.filter(
      (m) => m.sessionId.toString() === sessionId,
    );
  }
}
