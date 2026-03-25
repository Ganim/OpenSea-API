import type { MessagingTemplate } from '@/entities/messaging/messaging-template';

export interface MessagingTemplatesRepository {
  findByAccountId(accountId: string): Promise<MessagingTemplate[]>;
  findByAccountAndName(
    accountId: string,
    name: string,
    language: string,
  ): Promise<MessagingTemplate | null>;
  create(template: MessagingTemplate): Promise<void>;
  save(template: MessagingTemplate): Promise<void>;
  delete(id: string): Promise<void>;
}
