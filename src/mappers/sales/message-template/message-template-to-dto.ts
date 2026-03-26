import type { MessageTemplate } from '@/entities/sales/message-template';

export interface MessageTemplateDTO {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export function messageTemplateToDTO(template: MessageTemplate): MessageTemplateDTO {
  const dto: MessageTemplateDTO = {
    id: template.id.toString(),
    name: template.name,
    channel: template.channel,
    body: template.body,
    variables: template.variables,
    isActive: template.isActive,
    createdBy: template.createdBy,
    createdAt: template.createdAt,
  };

  if (template.subject) dto.subject = template.subject;
  if (template.updatedAt) dto.updatedAt = template.updatedAt;

  return dto;
}
