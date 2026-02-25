import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeTeamMemberRoleUseCase } from './change-team-member-role';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let sut: ChangeTeamMemberRoleUseCase;

describe('ChangeTeamMemberRoleUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    sut = new ChangeTeamMemberRoleUseCase(teamsRepository, teamMembersRepository);
  });

  it('should change member role to ADMIN', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-1'), role: 'OWNER' });
    const member = await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-2') });

    const { member: updated } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
      requestingUserId: 'user-1',
      memberId: member.id.toString(),
      role: 'ADMIN',
    });

    expect(updated.role).toBe('ADMIN');
  });

  it('should reject role change by non-OWNER', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-2'), role: 'ADMIN' });
    const member = await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-3') });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team.id.toString(),
        requestingUserId: 'user-2',
        memberId: member.id.toString(),
        role: 'ADMIN',
      }),
    ).rejects.toThrow('Only team owners can change member roles');
  });

  it('should reject changing own role', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    const owner = await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-1'), role: 'OWNER' });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team.id.toString(),
        requestingUserId: 'user-1',
        memberId: owner.id.toString(),
        role: 'ADMIN',
      }),
    ).rejects.toThrow('Cannot change your own role');
  });

  it('should reject promoting to OWNER', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-1'), role: 'OWNER' });
    const member = await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-2') });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team.id.toString(),
        requestingUserId: 'user-1',
        memberId: member.id.toString(),
        role: 'OWNER',
      }),
    ).rejects.toThrow('Cannot assign OWNER role. Use transfer ownership instead');
  });

  it('should throw if team not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: 'non-existent',
        requestingUserId: 'user-1',
        memberId: 'member-1',
        role: 'ADMIN',
      }),
    ).rejects.toThrow('Team not found');
  });
});
