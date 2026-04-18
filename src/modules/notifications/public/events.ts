/**
 * Dispatch payloads for the notifications module.
 *
 * The discriminated union `DispatchNotificationInput` is the single contract
 * between producers (any module) and the notification dispatcher. All fields
 * required per notification type are enforced at compile time.
 */

import type {
  NotificationActionDefinition,
  NotificationChannel,
  NotificationEntityRef,
  NotificationPriority,
  NotificationType,
  RecipientSelector,
} from './types';

interface BaseDispatchInput {
  tenantId: string;
  category: string;
  recipients: RecipientSelector;
  title: string;
  body: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  entity?: NotificationEntityRef;
  metadata?: Record<string, unknown>;
  groupKey?: string;
  idempotencyKey: string;
  scheduledFor?: Date;
  expiresAt?: Date;
  templateCode?: string;
  templateVars?: Record<string, unknown>;
}

export interface InformationalDispatchInput extends BaseDispatchInput {
  type: NotificationType.INFORMATIONAL;
}

export interface LinkDispatchInput extends BaseDispatchInput {
  type: NotificationType.LINK;
  actionUrl: string;
  fallbackUrl?: string;
  actionText?: string;
}

export interface ActionableDispatchInput extends BaseDispatchInput {
  type: NotificationType.ACTIONABLE;
  actions: NotificationActionDefinition[];
  callbackUrl: string;
}

export interface ApprovalDispatchInput extends BaseDispatchInput {
  type: NotificationType.APPROVAL;
  callbackUrl: string;
  approveAction?: NotificationActionDefinition;
  rejectAction?: NotificationActionDefinition;
  requireReasonOnReject?: boolean;
}

export interface FormDispatchInput extends BaseDispatchInput {
  type: NotificationType.FORM;
  fields: NotificationActionDefinition['formSchema'];
  submitLabel?: string;
  cancelLabel?: string;
  callbackUrl: string;
}

export interface ProgressDispatchInput extends BaseDispatchInput {
  type: NotificationType.PROGRESS;
  initialProgress?: number;
  totalSteps?: number;
}

export interface SystemBannerDispatchInput extends BaseDispatchInput {
  type: NotificationType.SYSTEM_BANNER;
  dismissible?: boolean;
  bannerStyle?: 'info' | 'warning' | 'error' | 'success';
}

export type DispatchNotificationInput =
  | InformationalDispatchInput
  | LinkDispatchInput
  | ActionableDispatchInput
  | ApprovalDispatchInput
  | FormDispatchInput
  | ProgressDispatchInput
  | SystemBannerDispatchInput;

export interface DispatchResult {
  notificationIds: string[];
  recipientCount: number;
  deduplicated: boolean;
  suppressedByPreference: number;
}

export interface ResolveNotificationInput {
  notificationId: string;
  userId: string;
  actionKey: string;
  payload?: Record<string, unknown>;
  reason?: string;
}

export interface ResolveNotificationResult {
  notificationId: string;
  state: 'RESOLVED' | 'DECLINED';
  callbackQueued: boolean;
}

export interface ProgressUpdateInput {
  notificationId: string;
  progress: number;
  message?: string;
  completed?: boolean;
}

export interface NotificationCallbackPayload {
  notificationId: string;
  category: string;
  entity?: NotificationEntityRef;
  action: string;
  userId: string;
  tenantId: string;
  reason?: string;
  formPayload?: Record<string, unknown>;
  resolvedAt: string;
}
