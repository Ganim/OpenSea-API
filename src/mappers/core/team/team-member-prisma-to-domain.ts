import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TeamMember, type TeamMemberRole } from '@/entities/core/team-member';
import type { TeamMember as PrismaTeamMember } from '@prisma/generated/client.js';

export function mapTeamMemberPrismaToDomain(memberDb: PrismaTeamMember) {
  return {
    id: new UniqueEntityID(memberDb.id),
    tenantId: new UniqueEntityID(memberDb.tenantId),
    teamId: new UniqueEntityID(memberDb.teamId),
    userId: new UniqueEntityID(memberDb.userId),
    role: memberDb.role as TeamMemberRole,
    joinedAt: memberDb.joinedAt,
    leftAt: memberDb.leftAt ?? undefined,
    createdAt: memberDb.createdAt,
    updatedAt: memberDb.updatedAt,
  };
}

export function teamMemberPrismaToDomain(memberDb: PrismaTeamMember): TeamMember {
  return TeamMember.create(
    mapTeamMemberPrismaToDomain(memberDb),
    new UniqueEntityID(memberDb.id),
  );
}
