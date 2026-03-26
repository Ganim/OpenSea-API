import { PrismaCashierSessionsRepository } from '@/repositories/sales/prisma/prisma-cashier-sessions-repository';
import { ListCashierSessionsUseCase } from '../list-cashier-sessions';

export function makeListCashierSessionsUseCase() {
  return new ListCashierSessionsUseCase(new PrismaCashierSessionsRepository());
}
