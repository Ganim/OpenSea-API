import { PrismaMessagingAccountsRepository } from '@/repositories/messaging/prisma/prisma-messaging-accounts-repository';
import { CreateMessagingAccountUseCase } from '../create-messaging-account';

export function makeCreateMessagingAccountUseCase() {
  const messagingAccountsRepository = new PrismaMessagingAccountsRepository();

  return new CreateMessagingAccountUseCase(messagingAccountsRepository);
}
