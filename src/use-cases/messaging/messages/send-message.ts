import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MessagingMessage } from '@/entities/messaging/messaging-message';
import type { MessagingMessageType } from '@/entities/messaging/messaging-message-type.enum';
import type { MessagingAccountsRepository } from '@/repositories/messaging/messaging-accounts-repository';
import type { MessagingContactsRepository } from '@/repositories/messaging/messaging-contacts-repository';
import type { MessagingMessagesRepository } from '@/repositories/messaging/messaging-messages-repository';
import type { MessagingGateway } from '@/services/messaging/messaging-gateway.interface';

interface SendMessageRequest {
  tenantId: string;
  accountId: string;
  contactId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  replyToMessageId?: string;
}

interface SendMessageResponse {
  message: MessagingMessage;
}

export class SendMessageUseCase {
  constructor(
    private messagingAccountsRepository: MessagingAccountsRepository,
    private messagingContactsRepository: MessagingContactsRepository,
    private messagingMessagesRepository: MessagingMessagesRepository,
    private messagingGateway: MessagingGateway,
  ) {}

  async execute(request: SendMessageRequest): Promise<SendMessageResponse> {
    const messagingAccount = await this.messagingAccountsRepository.findById(
      request.accountId,
    );

    if (!messagingAccount) {
      throw new ResourceNotFoundError('Messaging account not found');
    }

    if (messagingAccount.tenantId.toString() !== request.tenantId) {
      throw new ResourceNotFoundError('Messaging account not found');
    }

    if (messagingAccount.status !== 'ACTIVE') {
      throw new BadRequestError('Messaging account is not active');
    }

    const messagingContact = await this.messagingContactsRepository.findById(
      request.contactId,
    );

    if (!messagingContact) {
      throw new ResourceNotFoundError('Messaging contact not found');
    }

    if (messagingContact.tenantId.toString() !== request.tenantId) {
      throw new ResourceNotFoundError('Messaging contact not found');
    }

    const messageType = this.resolveMessageType(request);

    const outboundMessage = MessagingMessage.create({
      tenantId: new UniqueEntityID(request.tenantId),
      accountId: new UniqueEntityID(request.accountId),
      contactId: new UniqueEntityID(request.contactId),
      channel: messagingAccount.channel,
      direction: 'OUTBOUND',
      type: messageType,
      text: request.text,
      mediaUrl: request.mediaUrl,
      mediaType: request.mediaType,
      fileName: request.fileName,
      templateName: request.templateName,
      templateParams: request.templateParams,
      replyToMessageId: request.replyToMessageId
        ? new UniqueEntityID(request.replyToMessageId)
        : null,
    });

    await this.messagingMessagesRepository.create(outboundMessage);

    try {
      const gatewayResponse = await this.messagingGateway.sendMessage(
        request.accountId,
        {
          to: messagingContact.externalId,
          text: request.text,
          mediaUrl: request.mediaUrl,
          mediaType: request.mediaType,
          templateName: request.templateName,
          templateParams: request.templateParams,
          replyToExternalId: undefined,
        },
      );

      outboundMessage.externalId = gatewayResponse.externalId;
      outboundMessage.status = 'SENT';
      outboundMessage.sentAt = new Date();
    } catch (gatewayError) {
      outboundMessage.status = 'FAILED';
      outboundMessage.errorMessage =
        gatewayError instanceof Error
          ? gatewayError.message
          : String(gatewayError);
    }

    await this.messagingMessagesRepository.save(outboundMessage);

    return { message: outboundMessage };
  }

  private resolveMessageType(
    request: SendMessageRequest,
  ): MessagingMessageType {
    if (request.templateName) return 'TEMPLATE';
    if (request.mediaUrl) {
      const resolvedType = request.mediaType?.split('/')[0]?.toUpperCase();
      if (resolvedType === 'IMAGE') return 'IMAGE';
      if (resolvedType === 'VIDEO') return 'VIDEO';
      if (resolvedType === 'AUDIO') return 'AUDIO';
      return 'DOCUMENT';
    }
    return 'TEXT';
  }
}
