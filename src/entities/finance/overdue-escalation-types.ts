export type EscalationChannel =
  | 'EMAIL'
  | 'WHATSAPP'
  | 'INTERNAL_NOTE'
  | 'SYSTEM_ALERT';

export type EscalationTemplateType =
  | 'FRIENDLY_REMINDER'
  | 'FORMAL_NOTICE'
  | 'URGENT_NOTICE'
  | 'FINAL_NOTICE';

export type EscalationActionStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
