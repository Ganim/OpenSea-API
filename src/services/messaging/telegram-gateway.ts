import type {
  MessagingGateway,
  ParsedWebhookEvent,
  SendMessageParams,
  SendMessageResult,
} from './messaging-gateway.interface';

const TELEGRAM_BOT_API_BASE = 'https://api.telegram.org';

/**
 * Telegram gateway implementation using the Telegram Bot API directly via fetch().
 *
 * Bot token is stored in MessagingAccount.tgBotToken and passed as accountId.
 * No external dependencies (grammY or others) are used.
 */
export class TelegramGateway implements MessagingGateway {
  readonly channel = 'TELEGRAM';

  async sendMessage(
    botToken: string,
    params: SendMessageParams,
  ): Promise<SendMessageResult> {
    const chatId = params.to;

    if (params.mediaUrl) {
      return this.sendMedia(botToken, chatId, params);
    }

    const inlineKeyboard = params.templateParams?.buttons
      ? { inline_keyboard: JSON.parse(params.templateParams.buttons) }
      : undefined;

    const requestBody: Record<string, unknown> = {
      chat_id: chatId,
      text: params.text || '',
      parse_mode: 'HTML',
    };

    if (inlineKeyboard) {
      requestBody.reply_markup = inlineKeyboard;
    }

    if (params.replyToExternalId) {
      requestBody.reply_to_message_id = Number(params.replyToExternalId);
    }

    const telegramResponse = await this.request(
      botToken,
      'sendMessage',
      requestBody,
    );

    const sendResult = telegramResponse.result as
      | Record<string, unknown>
      | undefined;

    return {
      externalId: String(sendResult?.message_id || ''),
      status: 'sent',
    };
  }

  async parseWebhook(payload: unknown): Promise<ParsedWebhookEvent[]> {
    const telegramUpdate = payload as Record<string, unknown>;
    const parsedEvents: ParsedWebhookEvent[] = [];

    const incomingMessage =
      (telegramUpdate.message as Record<string, unknown>) ||
      (telegramUpdate.edited_message as Record<string, unknown>);

    if (incomingMessage) {
      const senderInfo = incomingMessage.from as
        | Record<string, unknown>
        | undefined;
      const chatInfo = incomingMessage.chat as
        | Record<string, unknown>
        | undefined;
      const photoArray = incomingMessage.photo as
        | Record<string, unknown>[]
        | undefined;

      const fileId = photoArray
        ? `photo_${(photoArray[photoArray.length - 1] as Record<string, unknown>)?.file_id}`
        : (incomingMessage.video as Record<string, unknown>)?.file_id
          ? `video_${(incomingMessage.video as Record<string, unknown>).file_id}`
          : (incomingMessage.document as Record<string, unknown>)?.file_id
            ? `doc_${(incomingMessage.document as Record<string, unknown>).file_id}`
            : undefined;

      const attachmentType = photoArray
        ? 'image'
        : incomingMessage.video
          ? 'video'
          : incomingMessage.document
            ? 'document'
            : incomingMessage.audio
              ? 'audio'
              : undefined;

      const senderName =
        [senderInfo?.first_name, senderInfo?.last_name]
          .filter(Boolean)
          .join(' ') || (senderInfo?.username as string | undefined);

      parsedEvents.push({
        type: 'message',
        contactExternalId: String(senderInfo?.id || chatInfo?.id),
        contactName: senderName,
        messageExternalId: String(incomingMessage.message_id),
        text:
          (incomingMessage.text as string) ||
          (incomingMessage.caption as string) ||
          undefined,
        mediaUrl: fileId,
        mediaType: attachmentType,
        timestamp: incomingMessage.date
          ? new Date((incomingMessage.date as number) * 1000)
          : new Date(),
      });
    }

    // Handle callback query (inline keyboard button clicks)
    const callbackQuery = telegramUpdate.callback_query as
      | Record<string, unknown>
      | undefined;
    if (callbackQuery) {
      const callbackSender = callbackQuery.from as
        | Record<string, unknown>
        | undefined;

      parsedEvents.push({
        type: 'other',
        contactExternalId: String(callbackSender?.id),
        contactName: callbackSender?.first_name as string | undefined,
        messageExternalId: String(callbackQuery.id),
        text: callbackQuery.data as string | undefined,
      });
    }

    return parsedEvents;
  }

  verifyWebhook(_payload: unknown, secretToken: string): boolean {
    // Telegram verifies via X-Telegram-Bot-Api-Secret-Token header
    const configuredWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || '';
    return secretToken === configuredWebhookSecret;
  }

  private async sendMedia(
    botToken: string,
    chatId: string,
    params: SendMessageParams,
  ): Promise<SendMessageResult> {
    const apiMethod = params.mediaType?.startsWith('image/')
      ? 'sendPhoto'
      : params.mediaType?.startsWith('video/')
        ? 'sendVideo'
        : params.mediaType?.startsWith('audio/')
          ? 'sendAudio'
          : 'sendDocument';

    const mediaFieldName =
      apiMethod === 'sendPhoto'
        ? 'photo'
        : apiMethod === 'sendVideo'
          ? 'video'
          : apiMethod === 'sendAudio'
            ? 'audio'
            : 'document';

    const requestBody: Record<string, unknown> = {
      chat_id: chatId,
      [mediaFieldName]: params.mediaUrl,
      caption: params.text,
    };

    const telegramMediaResponse = await this.request(
      botToken,
      apiMethod,
      requestBody,
    );

    const mediaResult = telegramMediaResponse.result as
      | Record<string, unknown>
      | undefined;

    return {
      externalId: String(mediaResult?.message_id || ''),
      status: 'sent',
    };
  }

  private async request(
    botToken: string,
    method: string,
    body: unknown,
  ): Promise<Record<string, unknown>> {
    const httpResponse = await fetch(
      `${TELEGRAM_BOT_API_BASE}/bot${botToken}/${method}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!httpResponse.ok) {
      const errorBody = await httpResponse.json().catch(() => ({}));
      throw new Error(
        `Telegram Bot API error (${httpResponse.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    return httpResponse.json() as Promise<Record<string, unknown>>;
  }
}
