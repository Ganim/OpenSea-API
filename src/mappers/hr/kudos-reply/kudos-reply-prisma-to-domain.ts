import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { KudosReply } from '@/entities/hr/kudos-reply';

export function mapKudosReplyPrismaToDomain(
  raw: Record<string, unknown>,
): KudosReply {
  return KudosReply.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId as string),
      kudosId: new UniqueEntityID(raw.kudosId as string),
      employeeId: new UniqueEntityID(raw.employeeId as string),
      content: raw.content as string,
      createdAt: raw.createdAt as Date,
      updatedAt: raw.updatedAt as Date,
      deletedAt: (raw.deletedAt as Date | null) ?? null,
    },
    new UniqueEntityID(raw.id as string),
  );
}
