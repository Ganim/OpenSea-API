import { PrismaMessagingAccountsRepository } from '@/repositories/messaging/prisma/prisma-messaging-accounts-repository';
import { PrismaMessagingContactsRepository } from '@/repositories/messaging/prisma/prisma-messaging-contacts-repository';
import { PrismaMessagingMessagesRepository } from '@/repositories/messaging/prisma/prisma-messaging-messages-repository';
import { makeMessagingGateway } from '@/services/messaging/messaging-gateway-factory';
import type { MessagingChannel } from '@/entities/messaging/messaging-channel.enum';
import { ReceiveWebhookUseCase } from '../receive-webhook';

export function makeReceiveWebhookUseCase(channel: MessagingChannel) {
  const messagingAccountsRepository = new PrismaMessagingAccountsRepository();
  const messagingContactsRepository = new PrismaMessagingContactsRepository();
  const messagingMessagesRepository = new PrismaMessagingMessagesRepository();

  return new ReceiveWebhookUseCase(
    messagingAccountsRepository,
    messagingContactsRepository,
    messagingMessagesRepository,
    makeMessagingGateway(channel),
  );
}
