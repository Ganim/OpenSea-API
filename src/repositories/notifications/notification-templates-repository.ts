import type { NotificationTemplate } from '@/entities/notifications/notification-template';

export interface CreateTemplateSchema {
  code: string;
  name: string;
  titleTemplate: string;
  messageTemplate: string;
  defaultChannel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  defaultPriority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface NotificationTemplatesRepository {
  create(data: CreateTemplateSchema): Promise<NotificationTemplate>;
  findByCode(code: string): Promise<NotificationTemplate | null>;
  findById(id: string): Promise<NotificationTemplate | null>;
  listActive(): Promise<NotificationTemplate[]>;
  save(template: NotificationTemplate): Promise<void>;
}
