import { InMemoryMessagingContactsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-contacts-repository';
import { ListContactsUseCase } from '../list-contacts';

// TODO: Replace with Prisma repository once Prisma schema migration is applied
export function makeListContactsUseCase() {
  return new ListContactsUseCase(new InMemoryMessagingContactsRepository());
}
