export interface SendMessageParams {
  /** External contact identifier (phone number, chat_id, IG-scoped ID, etc.) */
  to: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  replyToExternalId?: string;
}

export interface SendMessageResult {
  externalId: string;
  status: string;
}

export interface ParsedWebhookEvent {
  type: 'message' | 'status_update' | 'other';
  contactExternalId: string;
  contactName?: string;
  messageExternalId?: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  /** For status_update events: SENT, DELIVERED, READ, FAILED */
  status?: string;
  timestamp?: Date;
}

export interface MessagingGateway {
  readonly channel: string;
  sendMessage(
    accountId: string,
    params: SendMessageParams,
  ): Promise<SendMessageResult>;
  parseWebhook(payload: unknown): Promise<ParsedWebhookEvent[]>;
  verifyWebhook(payload: unknown, signature: string): boolean;
}
