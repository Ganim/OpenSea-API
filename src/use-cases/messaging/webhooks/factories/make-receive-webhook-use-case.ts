import { InMemoryMessagingAccountsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-accounts-repository';
import { InMemoryMessagingContactsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-contacts-repository';
import { InMemoryMessagingMessagesRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-messages-repository';
import { makeMessagingGateway } from '@/services/messaging/messaging-gateway-factory';
import type { MessagingChannel } from '@/entities/messaging/messaging-channel.enum';
import { ReceiveWebhookUseCase } from '../receive-webhook';

// TODO: Replace with Prisma repositories once Prisma schema migration is applied
export function makeReceiveWebhookUseCase(channel: MessagingChannel) {
  return new ReceiveWebhookUseCase(
    new InMemoryMessagingAccountsRepository(),
    new InMemoryMessagingContactsRepository(),
    new InMemoryMessagingMessagesRepository(),
    makeMessagingGateway(channel),
  );
}
