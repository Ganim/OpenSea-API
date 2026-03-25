import { InMemoryMessagingAccountsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-accounts-repository';
import { ListMessagingAccountsUseCase } from '../list-messaging-accounts';

// TODO: Replace with Prisma repository once Prisma schema migration is applied
export function makeListMessagingAccountsUseCase() {
  return new ListMessagingAccountsUseCase(
    new InMemoryMessagingAccountsRepository(),
  );
}
