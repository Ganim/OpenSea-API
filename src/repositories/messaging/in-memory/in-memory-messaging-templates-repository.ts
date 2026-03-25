import type { MessagingTemplate } from '@/entities/messaging/messaging-template';
import type { MessagingTemplatesRepository } from '../messaging-templates-repository';

export class InMemoryMessagingTemplatesRepository
  implements MessagingTemplatesRepository
{
  public items: MessagingTemplate[] = [];

  async findByAccountId(accountId: string): Promise<MessagingTemplate[]> {
    return this.items.filter(
      (template) => template.accountId.toString() === accountId,
    );
  }

  async findByAccountAndName(
    accountId: string,
    name: string,
    language: string,
  ): Promise<MessagingTemplate | null> {
    return (
      this.items.find(
        (template) =>
          template.accountId.toString() === accountId &&
          template.name === name &&
          template.language === language,
      ) ?? null
    );
  }

  async create(template: MessagingTemplate): Promise<void> {
    this.items.push(template);
  }

  async save(template: MessagingTemplate): Promise<void> {
    const templateIndex = this.items.findIndex((existingTemplate) =>
      existingTemplate.id.equals(template.id),
    );

    if (templateIndex >= 0) {
      this.items[templateIndex] = template;
    }
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((template) => template.id.toString() !== id);
  }
}
