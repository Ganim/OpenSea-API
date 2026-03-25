import { PrismaMessagingAccountsRepository } from '@/repositories/messaging/prisma/prisma-messaging-accounts-repository';
import { ListMessagingAccountsUseCase } from '../list-messaging-accounts';

export function makeListMessagingAccountsUseCase() {
  const messagingAccountsRepository = new PrismaMessagingAccountsRepository();

  return new ListMessagingAccountsUseCase(messagingAccountsRepository);
}
