import type { MessagingAccount } from '@/entities/messaging/messaging-account';
import type { MessagingContact } from '@/entities/messaging/messaging-contact';
import type { MessagingMessage } from '@/entities/messaging/messaging-message';

export function presentMessagingAccount(account: MessagingAccount) {
  return {
    id: account.id.toString(),
    tenantId: account.tenantId.toString(),
    channel: account.channel,
    name: account.name,
    status: account.status,
    phoneNumber: account.phoneNumber,
    wabaId: account.wabaId,
    igAccountId: account.igAccountId,
    tgBotUsername: account.tgBotUsername,
    webhookUrl: account.webhookUrl,
    settings: account.settings,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

export function presentMessagingContact(contact: MessagingContact) {
  return {
    id: contact.id.toString(),
    tenantId: contact.tenantId.toString(),
    accountId: contact.accountId.toString(),
    channel: contact.channel,
    externalId: contact.externalId,
    name: contact.name,
    username: contact.username,
    avatarUrl: contact.avatarUrl,
    customerId: contact.customerId?.toString() ?? null,
    lastMessageAt: contact.lastMessageAt,
    unreadCount: contact.unreadCount,
    isBlocked: contact.isBlocked,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

export function presentMessagingMessage(message: MessagingMessage) {
  return {
    id: message.id.toString(),
    tenantId: message.tenantId.toString(),
    accountId: message.accountId.toString(),
    contactId: message.contactId.toString(),
    channel: message.channel,
    direction: message.direction,
    type: message.type,
    status: message.status,
    text: message.text,
    mediaUrl: message.mediaUrl,
    mediaType: message.mediaType,
    fileName: message.fileName,
    templateName: message.templateName,
    templateParams: message.templateParams,
    externalId: message.externalId,
    replyToMessageId: message.replyToMessageId?.toString() ?? null,
    errorCode: message.errorCode,
    errorMessage: message.errorMessage,
    sentAt: message.sentAt,
    deliveredAt: message.deliveredAt,
    readAt: message.readAt,
    createdAt: message.createdAt,
  };
}
