import { PrismaMessagingContactsRepository } from '@/repositories/messaging/prisma/prisma-messaging-contacts-repository';
import { PrismaMessagingMessagesRepository } from '@/repositories/messaging/prisma/prisma-messaging-messages-repository';
import { ListMessagesUseCase } from '../list-messages';

export function makeListMessagesUseCase() {
  const messagingContactsRepository = new PrismaMessagingContactsRepository();
  const messagingMessagesRepository = new PrismaMessagingMessagesRepository();

  return new ListMessagesUseCase(
    messagingContactsRepository,
    messagingMessagesRepository,
  );
}
