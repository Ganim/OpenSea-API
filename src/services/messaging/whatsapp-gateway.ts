import type {
  MessagingGateway,
  ParsedWebhookEvent,
  SendMessageParams,
  SendMessageResult,
} from './messaging-gateway.interface';

/**
 * WhatsApp gateway implementation using Evolution API (Cloud mode).
 *
 * Evolution API provides a unified REST interface for the WhatsApp Business API.
 * Endpoints follow the pattern: POST /message/sendText/{instanceName}
 */
export class WhatsAppGateway implements MessagingGateway {
  readonly channel = 'WHATSAPP';

  async sendMessage(
    _accountId: string,
    _params: SendMessageParams,
  ): Promise<SendMessageResult> {
    // TODO: Implement Evolution API Cloud mode integration
    // 1. Fetch MessagingAccount to get instance name + API key
    // 2. POST to Evolution API: /message/sendText/{instanceName}
    // 3. For media: /message/sendMedia/{instanceName}
    // 4. For templates: /message/sendTemplate/{instanceName}
    throw new Error('WhatsApp gateway not yet configured');
  }

  async parseWebhook(_payload: unknown): Promise<ParsedWebhookEvent[]> {
    // TODO: Parse Evolution API webhook payload
    // Evolution API sends webhooks for: messages.upsert, messages.update, connection.update
    // Extract: sender phone, message content, status updates
    return [];
  }

  verifyWebhook(_payload: unknown, _signature: string): boolean {
    // TODO: Verify Evolution API webhook signature
    // Compare HMAC-SHA256 of payload body against webhook secret
    return false;
  }
}
