import { PrismaMessagingContactsRepository } from '@/repositories/messaging/prisma/prisma-messaging-contacts-repository';
import { ListContactsUseCase } from '../list-contacts';

export function makeListContactsUseCase() {
  const messagingContactsRepository = new PrismaMessagingContactsRepository();

  return new ListContactsUseCase(messagingContactsRepository);
}
