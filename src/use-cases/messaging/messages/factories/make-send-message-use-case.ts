import { PrismaMessagingAccountsRepository } from '@/repositories/messaging/prisma/prisma-messaging-accounts-repository';
import { PrismaMessagingContactsRepository } from '@/repositories/messaging/prisma/prisma-messaging-contacts-repository';
import { PrismaMessagingMessagesRepository } from '@/repositories/messaging/prisma/prisma-messaging-messages-repository';
import { WhatsAppGateway } from '@/services/messaging/whatsapp-gateway';
import { SendMessageUseCase } from '../send-message';

export function makeSendMessageUseCase() {
  const messagingAccountsRepository = new PrismaMessagingAccountsRepository();
  const messagingContactsRepository = new PrismaMessagingContactsRepository();
  const messagingMessagesRepository = new PrismaMessagingMessagesRepository();

  return new SendMessageUseCase(
    messagingAccountsRepository,
    messagingContactsRepository,
    messagingMessagesRepository,
    new WhatsAppGateway(),
  );
}
