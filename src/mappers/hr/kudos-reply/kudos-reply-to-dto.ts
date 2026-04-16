import type { KudosReply } from '@/entities/hr/kudos-reply';

export interface KudosReplyDTO {
  id: string;
  kudosId: string;
  employeeId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export function kudosReplyToDTO(reply: KudosReply): KudosReplyDTO {
  return {
    id: reply.id.toString(),
    kudosId: reply.kudosId.toString(),
    employeeId: reply.employeeId.toString(),
    content: reply.content,
    createdAt: reply.createdAt,
    updatedAt: reply.updatedAt,
  };
}
