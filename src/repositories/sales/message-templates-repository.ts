import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  MessageTemplate,
  type MessageChannelType,
} from '@/entities/sales/message-template';

export interface CreateMessageTemplateSchema {
  tenantId: string;
  name: string;
  channel: MessageChannelType;
  subject?: string;
  body: string;
  variables?: string[];
  isActive?: boolean;
  createdBy: string;
}

export interface MessageTemplatesRepository {
  create(data: CreateMessageTemplateSchema): Promise<MessageTemplate>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MessageTemplate | null>;
  findByName(name: string, tenantId: string): Promise<MessageTemplate | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MessageTemplate[]>;
  countByTenant(tenantId: string): Promise<number>;
  save(template: MessageTemplate): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
