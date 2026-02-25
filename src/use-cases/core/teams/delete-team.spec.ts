import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteTeamUseCase } from './delete-team';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let sut: DeleteTeamUseCase;

describe('DeleteTeamUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    sut = new DeleteTeamUseCase(teamsRepository, teamMembersRepository);
  });

  it('should soft-delete a team', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-1'), role: 'OWNER' });

    await sut.execute({ tenantId: 'tenant-1', teamId: team.id.toString(), userId: 'user-1' });

    const found = await teamsRepository.findById(tenantId, team.id);
    expect(found).toBeNull();
  });

  it('should reject deletion by non-owner', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-2'), role: 'ADMIN' });

    await expect(
      sut.execute({ tenantId: 'tenant-1', teamId: team.id.toString(), userId: 'user-2' }),
    ).rejects.toThrow('Only team owners can delete the team');
  });

  it('should reject deletion by regular member', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-3'), role: 'MEMBER' });

    await expect(
      sut.execute({ tenantId: 'tenant-1', teamId: team.id.toString(), userId: 'user-3' }),
    ).rejects.toThrow('Only team owners can delete the team');
  });

  it('should throw if team not found', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', teamId: 'non-existent', userId: 'user-1' }),
    ).rejects.toThrow('Team not found');
  });

  it('should reject deletion by non-member', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });

    await expect(
      sut.execute({ tenantId: 'tenant-1', teamId: team.id.toString(), userId: 'user-5' }),
    ).rejects.toThrow('Only team owners can delete the team');
  });
});
