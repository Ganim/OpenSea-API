/**
 * Finance module event type definitions.
 *
 * Each event constant follows the `{module}.{entity}.{action}` naming convention.
 * Data interfaces define the typed payload for each event.
 */

// ─── Event Type Constants ────────────────────────────────────────────────────

export const FINANCE_EVENTS = {
  ENTRY_CREATED: 'finance.entry.created',
  ENTRY_PAID: 'finance.entry.paid',
  ENTRY_OVERDUE: 'finance.entry.overdue',
  PIX_PAYMENT_RECEIVED: 'finance.pix.received',
} as const;

export type FinanceEventType =
  (typeof FINANCE_EVENTS)[keyof typeof FINANCE_EVENTS];

// ─── Event Data Interfaces ───────────────────────────────────────────────────

export interface EntryCreatedData {
  entryId: string;
  type: string;
  amount: number;
  description: string;
}

export interface EntryPaidData {
  entryId: string;
  amount: number;
  paymentDate: string;
}

export interface EntryOverdueData {
  entryId: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
}

export interface PixPaymentReceivedData {
  pixChargeId: string;
  txId: string;
  amount: number;
  payerName?: string;
  orderId?: string;
}
