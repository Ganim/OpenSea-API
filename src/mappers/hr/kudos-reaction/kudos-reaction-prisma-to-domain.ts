import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { KudosReaction } from '@/entities/hr/kudos-reaction';

export function mapKudosReactionPrismaToDomain(
  raw: Record<string, unknown>,
): KudosReaction {
  return KudosReaction.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId as string),
      kudosId: new UniqueEntityID(raw.kudosId as string),
      employeeId: new UniqueEntityID(raw.employeeId as string),
      emoji: raw.emoji as string,
      createdAt: raw.createdAt as Date,
    },
    new UniqueEntityID(raw.id as string),
  );
}
