import type { PosCashMovement } from '@/entities/sales/pos-cash-movement';

export interface PosCashMovementsRepository {
  create(movement: PosCashMovement): Promise<void>;
  findBySessionId(sessionId: string): Promise<PosCashMovement[]>;
}
