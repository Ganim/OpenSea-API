import { InMemoryMessagingAccountsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-accounts-repository';
import { CreateMessagingAccountUseCase } from '../create-messaging-account';

// TODO: Replace with Prisma repository once Prisma schema migration is applied
export function makeCreateMessagingAccountUseCase() {
  return new CreateMessagingAccountUseCase(
    new InMemoryMessagingAccountsRepository(),
  );
}
