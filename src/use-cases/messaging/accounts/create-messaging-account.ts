import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MessagingAccount } from '@/entities/messaging/messaging-account';
import type { MessagingChannel } from '@/entities/messaging/messaging-channel.enum';
import type { MessagingAccountsRepository } from '@/repositories/messaging/messaging-accounts-repository';

interface CreateMessagingAccountRequest {
  tenantId: string;
  channel: MessagingChannel;
  name: string;
  phoneNumber?: string | null;
  wabaId?: string | null;
  igAccountId?: string | null;
  tgBotToken?: string | null;
  tgBotUsername?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
  settings?: Record<string, unknown> | null;
}

interface CreateMessagingAccountResponse {
  messagingAccount: MessagingAccount;
}

export class CreateMessagingAccountUseCase {
  constructor(
    private messagingAccountsRepository: MessagingAccountsRepository,
  ) {}

  async execute(
    request: CreateMessagingAccountRequest,
  ): Promise<CreateMessagingAccountResponse> {
    const existingAccountsForChannel =
      await this.messagingAccountsRepository.findByTenantAndChannel(
        request.tenantId,
        request.channel,
      );

    const duplicateAccountByName = existingAccountsForChannel.find(
      (account) => account.name === request.name,
    );

    if (duplicateAccountByName) {
      throw new BadRequestError(
        `A messaging account with name "${request.name}" already exists for channel ${request.channel}`,
      );
    }

    const messagingAccount = MessagingAccount.create({
      tenantId: new UniqueEntityID(request.tenantId),
      channel: request.channel,
      name: request.name,
      phoneNumber: request.phoneNumber,
      wabaId: request.wabaId,
      igAccountId: request.igAccountId,
      tgBotToken: request.tgBotToken,
      tgBotUsername: request.tgBotUsername,
      accessToken: request.accessToken,
      refreshToken: request.refreshToken,
      tokenExpiresAt: request.tokenExpiresAt,
      webhookUrl: request.webhookUrl,
      webhookSecret: request.webhookSecret,
      settings: request.settings,
    });

    await this.messagingAccountsRepository.create(messagingAccount);

    return { messagingAccount };
  }
}
