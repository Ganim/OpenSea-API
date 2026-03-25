import { InMemoryMessagingContactsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-contacts-repository';
import { InMemoryMessagingMessagesRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-messages-repository';
import { ListMessagesUseCase } from '../list-messages';

// TODO: Replace with Prisma repositories once Prisma schema migration is applied
export function makeListMessagesUseCase() {
  return new ListMessagesUseCase(
    new InMemoryMessagingContactsRepository(),
    new InMemoryMessagingMessagesRepository(),
  );
}
