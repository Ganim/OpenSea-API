/**
 * Messaging module event type definitions.
 *
 * Each event constant follows the `{module}.{entity}.{action}` naming convention.
 * Data interfaces define the typed payload for each event.
 */

// ─── Event Type Constants ────────────────────────────────────────────────────

export const MESSAGING_EVENTS = {
  MESSAGE_RECEIVED: 'messaging.message.received',
  MESSAGE_SENT: 'messaging.message.sent',
} as const;

export type MessagingEventType =
  (typeof MESSAGING_EVENTS)[keyof typeof MESSAGING_EVENTS];

// ─── Event Data Interfaces ───────────────────────────────────────────────────

export interface MessageReceivedData {
  messageId: string;
  channel: string;
  contactId: string;
  contactName?: string;
  text?: string;
}

export interface MessageSentData {
  messageId: string;
  channel: string;
  contactId: string;
  text?: string;
}
