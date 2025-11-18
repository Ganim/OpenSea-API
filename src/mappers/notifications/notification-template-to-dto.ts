import type { NotificationTemplate } from '@/entities/notifications/notification-template';

export interface NotificationTemplateDTO {
  id: string;
  code: string;
  name: string;
  titleTemplate: string;
  messageTemplate: string;
  defaultChannel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  defaultPriority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}

export function notificationTemplateToDTO(template: NotificationTemplate): NotificationTemplateDTO {
  return {
    id: template.id.toString(),
    code: template.code,
    name: template.name,
    titleTemplate: template.titleTemplate,
    messageTemplate: template.messageTemplate,
    defaultChannel: template.defaultChannel,
    defaultPriority: template.defaultPriority,
    isActive: template.isActive,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt ?? null,
    deletedAt: template.deletedAt ?? null,
  };
}
