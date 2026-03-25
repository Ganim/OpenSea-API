import { createHmac } from 'crypto';

import type {
  MessagingGateway,
  ParsedWebhookEvent,
  SendMessageParams,
  SendMessageResult,
} from './messaging-gateway.interface';

const GRAPH_API_URL = 'https://graph.facebook.com/v21.0';

/**
 * Instagram gateway implementation using Meta Graph API.
 *
 * Uses the Instagram Messaging API (part of Messenger Platform).
 * Endpoint: POST https://graph.facebook.com/v21.0/me/messages
 */
export class InstagramGateway implements MessagingGateway {
  readonly channel = 'INSTAGRAM';

  async sendMessage(
    pageAccessToken: string,
    params: SendMessageParams,
  ): Promise<SendMessageResult> {
    const messagePayload: Record<string, unknown> = params.mediaUrl
      ? {
          attachment: {
            type: 'image',
            payload: { url: params.mediaUrl },
          },
        }
      : { text: params.text || '' };

    const requestBody = {
      recipient: { id: params.to },
      message: messagePayload,
    };

    const httpResponse = await fetch(
      `${GRAPH_API_URL}/me/messages?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
    );

    if (!httpResponse.ok) {
      const errorBody = await httpResponse.json().catch(() => ({}));
      throw new Error(
        `Instagram API error (${httpResponse.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    const responseData = (await httpResponse.json()) as Record<string, unknown>;

    return {
      externalId: (responseData.message_id as string) || '',
      status: 'sent',
    };
  }

  async parseWebhook(payload: unknown): Promise<ParsedWebhookEvent[]> {
    const webhookData = payload as Record<string, unknown>;
    const parsedEvents: ParsedWebhookEvent[] = [];

    const webhookEntries =
      (webhookData.entry as Record<string, unknown>[]) || [];

    for (const entry of webhookEntries) {
      const messagingEvents =
        (entry.messaging as Record<string, unknown>[]) || [];

      for (const messagingEvent of messagingEvents) {
        const senderData = messagingEvent.sender as
          | Record<string, unknown>
          | undefined;
        const messageData = messagingEvent.message as
          | Record<string, unknown>
          | undefined;
        const readData = messagingEvent.read as
          | Record<string, unknown>
          | undefined;

        if (messageData) {
          const attachments = messageData.attachments as
            | Record<string, unknown>[]
            | undefined;
          const firstAttachment = attachments?.[0];
          const attachmentPayload = firstAttachment?.payload as
            | Record<string, unknown>
            | undefined;

          parsedEvents.push({
            type: 'message',
            contactExternalId: (senderData?.id as string) || '',
            messageExternalId: messageData.mid as string | undefined,
            text: messageData.text as string | undefined,
            mediaUrl: (attachmentPayload?.url as string) || undefined,
            mediaType: (firstAttachment?.type as string) || undefined,
            timestamp: messagingEvent.timestamp
              ? new Date(messagingEvent.timestamp as number)
              : new Date(),
          });
        }

        if (readData) {
          parsedEvents.push({
            type: 'status_update',
            contactExternalId: (senderData?.id as string) || '',
            messageExternalId: readData.mid as string | undefined,
            status: 'read',
          });
        }
      }
    }

    return parsedEvents;
  }

  verifyWebhook(payload: unknown, signature: string): boolean {
    const metaAppSecret = process.env.META_APP_SECRET || '';
    if (!metaAppSecret || !signature) return false;

    const rawPayload =
      typeof payload === 'string' ? payload : JSON.stringify(payload);

    const expectedSignature = createHmac('sha256', metaAppSecret)
      .update(rawPayload)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }
}
