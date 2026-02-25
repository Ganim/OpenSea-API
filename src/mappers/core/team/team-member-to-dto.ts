import type { TeamMember } from '@/entities/core/team-member';

export interface TeamMemberDTO {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  leftAt: Date | null;
  userName: string | null;
  userEmail: string | null;
  userAvatarUrl: string | null;
}

export function teamMemberToDTO(
  member: TeamMember,
  extra?: {
    userName?: string | null;
    userEmail?: string | null;
    userAvatarUrl?: string | null;
  },
): TeamMemberDTO {
  return {
    id: member.id.toString(),
    teamId: member.teamId.toString(),
    userId: member.userId.toString(),
    role: member.role,
    joinedAt: member.joinedAt,
    leftAt: member.leftAt ?? null,
    userName: extra?.userName ?? null,
    userEmail: extra?.userEmail ?? null,
    userAvatarUrl: extra?.userAvatarUrl ?? null,
  };
}
