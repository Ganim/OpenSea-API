import { NotificationTemplate } from '@/entities/notifications/notification-template';
import type {
    CreateTemplateSchema,
    NotificationTemplatesRepository,
} from '../notification-templates-repository';

export class InMemoryNotificationTemplatesRepository
  implements NotificationTemplatesRepository
{
  public items: NotificationTemplate[] = [];

  async create(data: CreateTemplateSchema): Promise<NotificationTemplate> {
    const template = NotificationTemplate.create({
      code: data.code,
      name: data.name,
      titleTemplate: data.titleTemplate,
      messageTemplate: data.messageTemplate,
      defaultChannel: data.defaultChannel,
      defaultPriority: data.defaultPriority ?? 'NORMAL',
      isActive: true,
    });

    this.items.push(template);
    return template;
  }

  async findByCode(code: string): Promise<NotificationTemplate | null> {
    const found = this.items.find((t) => t.code === code);
    return found ?? null;
  }

  async findById(id: string): Promise<NotificationTemplate | null> {
    const found = this.items.find((t) => t.id.toString() === id);
    return found ?? null;
  }

  async listActive(): Promise<NotificationTemplate[]> {
    return this.items.filter((t) => t.isActive && !t.deletedAt);
  }

  async save(template: NotificationTemplate): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(template.id));
    if (index >= 0) this.items[index] = template;
    else this.items.push(template);
  }
}
