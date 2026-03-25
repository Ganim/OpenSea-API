import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MessagingContact } from '@/entities/messaging/messaging-contact';
import { MessagingMessage } from '@/entities/messaging/messaging-message';
import type { MessagingChannel } from '@/entities/messaging/messaging-channel.enum';
import type { MessagingAccountsRepository } from '@/repositories/messaging/messaging-accounts-repository';
import type { MessagingContactsRepository } from '@/repositories/messaging/messaging-contacts-repository';
import type { MessagingMessagesRepository } from '@/repositories/messaging/messaging-messages-repository';
import type { MessagingGateway } from '@/services/messaging/messaging-gateway.interface';

interface ReceiveWebhookRequest {
  channel: MessagingChannel;
  accountId: string;
  rawPayload: unknown;
  signature: string;
}

interface ReceiveWebhookResponse {
  processedEventCount: number;
}

export class ReceiveWebhookUseCase {
  constructor(
    private messagingAccountsRepository: MessagingAccountsRepository,
    private messagingContactsRepository: MessagingContactsRepository,
    private messagingMessagesRepository: MessagingMessagesRepository,
    private messagingGateway: MessagingGateway,
  ) {}

  async execute(
    request: ReceiveWebhookRequest,
  ): Promise<ReceiveWebhookResponse> {
    const messagingAccount = await this.messagingAccountsRepository.findById(
      request.accountId,
    );

    if (!messagingAccount) {
      throw new BadRequestError('Unknown messaging account for webhook');
    }

    const isSignatureValid = this.messagingGateway.verifyWebhook(
      request.rawPayload,
      request.signature,
    );

    if (!isSignatureValid) {
      throw new BadRequestError('Invalid webhook signature');
    }

    const parsedEvents = await this.messagingGateway.parseWebhook(
      request.rawPayload,
    );

    let processedEventCount = 0;

    for (const webhookEvent of parsedEvents) {
      if (webhookEvent.type === 'message') {
        const messagingContact = await this.upsertContact(
          messagingAccount.tenantId.toString(),
          messagingAccount.id.toString(),
          request.channel,
          webhookEvent.contactExternalId,
          webhookEvent.contactName ?? null,
        );

        // Avoid duplicates: skip if message with same externalId already exists
        if (webhookEvent.messageExternalId) {
          const existingMessage =
            await this.messagingMessagesRepository.findByExternalId(
              webhookEvent.messageExternalId,
            );

          if (existingMessage) {
            processedEventCount++;
            continue;
          }
        }

        const inboundMessage = MessagingMessage.create({
          tenantId: messagingAccount.tenantId,
          accountId: messagingAccount.id,
          contactId: messagingContact.id,
          channel: request.channel,
          direction: 'INBOUND',
          type: webhookEvent.mediaType ? 'IMAGE' : 'TEXT',
          status: 'DELIVERED',
          text: webhookEvent.text,
          mediaUrl: webhookEvent.mediaUrl,
          mediaType: webhookEvent.mediaType,
          externalId: webhookEvent.messageExternalId,
          createdAt: webhookEvent.timestamp ?? new Date(),
        });

        await this.messagingMessagesRepository.create(inboundMessage);

        // Update contact's last message timestamp and unread count
        messagingContact.lastMessageAt = inboundMessage.createdAt;
        messagingContact.unreadCount = messagingContact.unreadCount + 1;
        await this.messagingContactsRepository.save(messagingContact);

        processedEventCount++;
      } else if (webhookEvent.type === 'status_update') {
        if (webhookEvent.messageExternalId) {
          const existingMessage =
            await this.messagingMessagesRepository.findByExternalId(
              webhookEvent.messageExternalId,
            );

          if (existingMessage) {
            if (
              webhookEvent.status === 'DELIVERED' ||
              webhookEvent.status === 'delivered'
            ) {
              existingMessage.status = 'DELIVERED';
              existingMessage.deliveredAt =
                webhookEvent.timestamp ?? new Date();
            } else if (
              webhookEvent.status === 'READ' ||
              webhookEvent.status === 'read'
            ) {
              existingMessage.status = 'READ';
              existingMessage.readAt = webhookEvent.timestamp ?? new Date();
            } else if (
              webhookEvent.status === 'FAILED' ||
              webhookEvent.status === 'failed'
            ) {
              existingMessage.status = 'FAILED';
            }

            await this.messagingMessagesRepository.save(existingMessage);
          }
        }

        processedEventCount++;
      }
    }

    return { processedEventCount };
  }

  private async upsertContact(
    tenantId: string,
    accountId: string,
    channel: MessagingChannel,
    externalId: string,
    contactName: string | null,
  ): Promise<MessagingContact> {
    const existingContact =
      await this.messagingContactsRepository.findByAccountAndExternalId(
        accountId,
        externalId,
      );

    if (existingContact) {
      if (contactName && existingContact.name !== contactName) {
        existingContact.name = contactName;
        await this.messagingContactsRepository.save(existingContact);
      }
      return existingContact;
    }

    const newContact = MessagingContact.create({
      tenantId: new UniqueEntityID(tenantId),
      accountId: new UniqueEntityID(accountId),
      channel,
      externalId,
      name: contactName,
    });

    await this.messagingContactsRepository.create(newContact);
    return newContact;
  }
}
