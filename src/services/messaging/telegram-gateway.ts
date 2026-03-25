import type {
  MessagingGateway,
  ParsedWebhookEvent,
  SendMessageParams,
  SendMessageResult,
} from './messaging-gateway.interface';

/**
 * Telegram gateway implementation using grammY Bot API.
 *
 * Uses the Telegram Bot API via grammY library.
 * Bot token is stored in MessagingAccount.tgBotToken.
 */
export class TelegramGateway implements MessagingGateway {
  readonly channel = 'TELEGRAM';

  async sendMessage(
    _accountId: string,
    _params: SendMessageParams,
  ): Promise<SendMessageResult> {
    // TODO: Implement grammY bot.api.sendMessage
    // 1. Fetch MessagingAccount to get bot token
    // 2. Create Bot instance: new Bot(botToken)
    // 3. bot.api.sendMessage(chatId, text, { reply_to_message_id })
    // 4. For media: bot.api.sendPhoto / sendDocument / sendVideo / sendAudio
    throw new Error('Telegram gateway not yet configured');
  }

  async parseWebhook(_payload: unknown): Promise<ParsedWebhookEvent[]> {
    // TODO: Parse Telegram Update object
    // Update has: message.from, message.text, message.chat.id
    // Also handle: edited_message, channel_post, callback_query
    return [];
  }

  verifyWebhook(_payload: unknown, _signature: string): boolean {
    // TODO: Verify Telegram webhook secret_token header
    // Compare X-Telegram-Bot-Api-Secret-Token header with stored webhook secret
    return false;
  }
}
