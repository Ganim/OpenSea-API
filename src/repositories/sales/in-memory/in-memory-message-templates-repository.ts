import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MessageTemplate } from '@/entities/sales/message-template';
import type {
  CreateMessageTemplateSchema,
  MessageTemplatesRepository,
} from '../message-templates-repository';

export class InMemoryMessageTemplatesRepository
  implements MessageTemplatesRepository
{
  public items: MessageTemplate[] = [];

  async create(data: CreateMessageTemplateSchema): Promise<MessageTemplate> {
    const template = MessageTemplate.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      channel: data.channel,
      subject: data.subject,
      body: data.body,
      variables: data.variables,
      isActive: data.isActive ?? true,
      createdBy: data.createdBy,
    });

    this.items.push(template);
    return template;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MessageTemplate | null> {
    const template = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return template ?? null;
  }

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<MessageTemplate | null> {
    const template = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.name === name &&
        item.tenantId.toString() === tenantId,
    );
    return template ?? null;
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MessageTemplate[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + perPage);
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    ).length;
  }

  async save(template: MessageTemplate): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(template.id));
    if (index >= 0) {
      this.items[index] = template;
    } else {
      this.items.push(template);
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const template = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    if (template) {
      template.delete();
    }
  }
}
