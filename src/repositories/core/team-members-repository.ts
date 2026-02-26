import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TeamMember, TeamMemberRole } from '@/entities/core/team-member';

export interface CreateTeamMemberSchema {
  tenantId: UniqueEntityID;
  teamId: UniqueEntityID;
  userId: UniqueEntityID;
  role?: TeamMemberRole;
}

export interface UpdateTeamMemberSchema {
  id: UniqueEntityID;
  role?: TeamMemberRole;
}

export interface ListTeamMembersFilters {
  teamId: UniqueEntityID;
  role?: TeamMemberRole;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TeamMemberUserData {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface ListTeamMembersResult {
  members: TeamMember[];
  total: number;
  usersMap?: Map<string, TeamMemberUserData>;
}

export interface TeamMembersRepository {
  create(data: CreateTeamMemberSchema): Promise<TeamMember>;
  findById(id: UniqueEntityID): Promise<TeamMember | null>;
  findByTeamAndUser(
    teamId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<TeamMember | null>;
  findMany(filters: ListTeamMembersFilters): Promise<ListTeamMembersResult>;
  update(data: UpdateTeamMemberSchema): Promise<TeamMember | null>;
  remove(id: UniqueEntityID): Promise<void>;
  countByTeam(teamId: UniqueEntityID): Promise<number>;
  isUserMember(
    teamId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<boolean>;
}
