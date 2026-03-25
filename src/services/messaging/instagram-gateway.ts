import type {
  MessagingGateway,
  ParsedWebhookEvent,
  SendMessageParams,
  SendMessageResult,
} from './messaging-gateway.interface';

/**
 * Instagram gateway implementation using Meta Graph API.
 *
 * Uses the Instagram Messaging API (part of Messenger Platform).
 * Endpoint: POST https://graph.facebook.com/v21.0/me/messages
 */
export class InstagramGateway implements MessagingGateway {
  readonly channel = 'INSTAGRAM';

  async sendMessage(
    _accountId: string,
    _params: SendMessageParams,
  ): Promise<SendMessageResult> {
    // TODO: Implement Meta Graph API Instagram messaging
    // 1. Fetch MessagingAccount to get page access token
    // 2. POST https://graph.facebook.com/v21.0/me/messages
    //    Body: { recipient: { id: params.to }, message: { text: params.text } }
    // 3. For media: use attachment upload API first, then send attachment
    throw new Error('Instagram gateway not yet configured');
  }

  async parseWebhook(_payload: unknown): Promise<ParsedWebhookEvent[]> {
    // TODO: Parse Meta webhook for Instagram messaging events
    // Webhook object has: entry[].messaging[].{sender, recipient, timestamp, message}
    // Handle: messages, message_reads, message_deliveries
    return [];
  }

  verifyWebhook(_payload: unknown, _signature: string): boolean {
    // TODO: Verify Meta webhook X-Hub-Signature-256
    // HMAC-SHA256 of raw request body using app secret
    return false;
  }
}
