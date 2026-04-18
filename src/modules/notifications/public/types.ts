/**
 * Public types for the notifications module.
 *
 * This file is part of the module's PUBLIC API surface. Other modules
 * import from `@/modules/notifications/public` and must not reach into
 * internal folders (`application`, `infrastructure`, `dispatcher`, etc.).
 */

export enum NotificationType {
  INFORMATIONAL = 'INFORMATIONAL',
  LINK = 'LINK',
  ACTIONABLE = 'ACTIONABLE',
  APPROVAL = 'APPROVAL',
  FORM = 'FORM',
  PROGRESS = 'PROGRESS',
  SYSTEM_BANNER = 'SYSTEM_BANNER',
  IMAGE_BANNER = 'IMAGE_BANNER',
  REPORT = 'REPORT',
  EMAIL_PREVIEW = 'EMAIL_PREVIEW',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export enum NotificationState {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  EXPIRED = 'EXPIRED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationCallbackStatus {
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export enum NotificationFrequency {
  INSTANT = 'INSTANT',
  HOURLY_DIGEST = 'HOURLY_DIGEST',
  DAILY_DIGEST = 'DAILY_DIGEST',
  WEEKLY_DIGEST = 'WEEKLY_DIGEST',
  DISABLED = 'DISABLED',
}

export type RecipientSelector =
  | { userIds: string[] }
  | { permission: string }
  | { role: string }
  | {
      entity: {
        type: string;
        id: string;
        relation: 'supervisor' | 'owner' | 'creator' | 'assignee' | 'watchers';
      };
    };

export interface NotificationActionDefinition {
  key: string;
  label: string;
  style?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  icon?: string;
  requiresReason?: boolean;
  formSchema?: NotificationFormField[];
}

export interface NotificationFormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'boolean';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
}

export interface NotificationEntityRef {
  type: string;
  id: string;
}

export interface ModuleNotificationCategory {
  code: string;
  name: string;
  description?: string;
  defaultType: NotificationType;
  defaultChannels: NotificationChannel[];
  defaultPriority: NotificationPriority;
  digestSupported?: boolean;
  mandatory?: boolean;
}

export interface ModuleNotificationManifest {
  module: string;
  displayName: string;
  icon?: string;
  order?: number;
  categories: ModuleNotificationCategory[];
}
