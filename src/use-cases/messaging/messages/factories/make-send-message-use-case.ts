import { InMemoryMessagingAccountsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-accounts-repository';
import { InMemoryMessagingContactsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-contacts-repository';
import { InMemoryMessagingMessagesRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-messages-repository';
import { WhatsAppGateway } from '@/services/messaging/whatsapp-gateway';
import { SendMessageUseCase } from '../send-message';

// TODO: Replace with Prisma repositories and proper gateway once Prisma schema migration is applied
export function makeSendMessageUseCase() {
  return new SendMessageUseCase(
    new InMemoryMessagingAccountsRepository(),
    new InMemoryMessagingContactsRepository(),
    new InMemoryMessagingMessagesRepository(),
    new WhatsAppGateway(),
  );
}
