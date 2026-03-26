import { PrismaCashierSessionsRepository } from '@/repositories/sales/prisma/prisma-cashier-sessions-repository';
import { ReconcileSessionUseCase } from '../reconcile-session';

export function makeReconcileSessionUseCase() {
  return new ReconcileSessionUseCase(new PrismaCashierSessionsRepository());
}
