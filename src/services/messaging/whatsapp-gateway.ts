import type {
  MessagingGateway,
  ParsedWebhookEvent,
  SendMessageParams,
  SendMessageResult,
} from './messaging-gateway.interface';

const EVOLUTION_API_URL =
  process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

/**
 * WhatsApp gateway implementation using Evolution API (Cloud mode).
 *
 * Evolution API provides a unified REST interface for the WhatsApp Business API.
 * Endpoints follow the pattern: POST /message/sendText/{instanceName}
 */
export class WhatsAppGateway implements MessagingGateway {
  readonly channel = 'WHATSAPP';

  async sendMessage(
    instanceName: string,
    params: SendMessageParams,
  ): Promise<SendMessageResult> {
    if (params.templateName) {
      return this.sendTemplate(instanceName, params);
    }

    if (params.mediaUrl) {
      return this.sendMedia(instanceName, params);
    }

    const responseBody = await this.request(
      `/message/sendText/${instanceName}`,
      {
        number: params.to,
        text: params.text || '',
        ...(params.replyToExternalId
          ? { quoted: { key: { id: params.replyToExternalId } } }
          : {}),
      },
    );

    const messageKey = responseBody.key as Record<string, unknown> | undefined;

    return {
      externalId:
        (messageKey?.id as string) || (responseBody.messageId as string) || '',
      status: 'sent',
    };
  }

  async parseWebhook(payload: unknown): Promise<ParsedWebhookEvent[]> {
    const webhookData = payload as Record<string, unknown>;
    const parsedEvents: ParsedWebhookEvent[] = [];

    if (webhookData.event === 'messages.upsert') {
      const incomingMessage = webhookData.data as Record<string, unknown>;
      if (
        !incomingMessage ||
        (incomingMessage.key as Record<string, unknown>)?.fromMe
      ) {
        return parsedEvents;
      }

      const messageKey = incomingMessage.key as Record<string, unknown>;
      const messageContent = incomingMessage.message as
        | Record<string, unknown>
        | undefined;

      const textContent =
        (messageContent?.conversation as string) ||
        ((messageContent?.extendedTextMessage as Record<string, unknown>)
          ?.text as string) ||
        '';

      const attachmentUrl =
        (messageContent?.imageMessage as Record<string, unknown>)?.url ||
        (messageContent?.videoMessage as Record<string, unknown>)?.url ||
        (messageContent?.audioMessage as Record<string, unknown>)?.url ||
        (messageContent?.documentMessage as Record<string, unknown>)?.url;

      const attachmentType = messageContent?.imageMessage
        ? 'image'
        : messageContent?.videoMessage
          ? 'video'
          : messageContent?.audioMessage
            ? 'audio'
            : messageContent?.documentMessage
              ? 'document'
              : undefined;

      const remoteJid = (messageKey?.remoteJid as string) || '';
      const contactPhone = remoteJid.replace('@s.whatsapp.net', '');

      parsedEvents.push({
        type: 'message',
        contactExternalId: contactPhone,
        contactName: incomingMessage.pushName as string | undefined,
        messageExternalId: messageKey?.id as string | undefined,
        text: textContent || undefined,
        mediaUrl: (attachmentUrl as string) || undefined,
        mediaType: attachmentType,
        timestamp: incomingMessage.messageTimestamp
          ? new Date((incomingMessage.messageTimestamp as number) * 1000)
          : new Date(),
      });
    }

    if (webhookData.event === 'messages.update') {
      const updatePayload = webhookData.data;
      const statusUpdates = Array.isArray(updatePayload)
        ? updatePayload
        : [updatePayload];

      const deliveryStatusMap: Record<number, string> = {
        2: 'sent',
        3: 'delivered',
        4: 'read',
      };

      for (const statusUpdate of statusUpdates) {
        const updateData = statusUpdate as Record<string, unknown>;
        if (updateData.status) {
          const updateKey = updateData.key as Record<string, unknown>;
          const remoteJid = (updateKey?.remoteJid as string) || '';

          parsedEvents.push({
            type: 'status_update',
            contactExternalId: remoteJid.replace('@s.whatsapp.net', ''),
            messageExternalId: updateKey?.id as string | undefined,
            status: deliveryStatusMap[updateData.status as number] || 'unknown',
          });
        }
      }
    }

    return parsedEvents;
  }

  verifyWebhook(_payload: unknown, signature: string): boolean {
    // Evolution API uses API key header verification
    return signature === EVOLUTION_API_KEY;
  }

  private async sendMedia(
    instanceName: string,
    params: SendMessageParams,
  ): Promise<SendMessageResult> {
    const mediaEndpoint = params.mediaType?.startsWith('image/')
      ? 'sendImage'
      : params.mediaType?.startsWith('video/')
        ? 'sendVideo'
        : params.mediaType?.startsWith('audio/')
          ? 'sendAudio'
          : 'sendDocument';

    const responseBody = await this.request(
      `/message/${mediaEndpoint}/${instanceName}`,
      {
        number: params.to,
        media: params.mediaUrl,
        caption: params.text,
        fileName: params.mediaType?.includes('document')
          ? 'document'
          : undefined,
      },
    );

    const mediaMessageKey = responseBody.key as
      | Record<string, unknown>
      | undefined;

    return {
      externalId: (mediaMessageKey?.id as string) || '',
      status: 'sent',
    };
  }

  private async sendTemplate(
    instanceName: string,
    params: SendMessageParams,
  ): Promise<SendMessageResult> {
    const templateComponents = params.templateParams
      ? [
          {
            type: 'body',
            parameters: Object.values(params.templateParams).map(
              (paramValue) => ({ type: 'text', text: paramValue }),
            ),
          },
        ]
      : [];

    const responseBody = await this.request(
      `/message/sendTemplate/${instanceName}`,
      {
        number: params.to,
        name: params.templateName,
        language: 'pt_BR',
        components: templateComponents,
      },
    );

    const templateMessageKey = responseBody.key as
      | Record<string, unknown>
      | undefined;

    return {
      externalId: (templateMessageKey?.id as string) || '',
      status: 'sent',
    };
  }

  private async request(
    path: string,
    body: unknown,
  ): Promise<Record<string, unknown>> {
    const httpResponse = await fetch(`${EVOLUTION_API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!httpResponse.ok) {
      const errorBody = await httpResponse.json().catch(() => ({}));
      throw new Error(
        `Evolution API error (${httpResponse.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    return httpResponse.json() as Promise<Record<string, unknown>>;
  }
}
