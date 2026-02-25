import { describe, it, expect, beforeEach } from 'vitest';
import { ListTeamMembersUseCase } from './list-team-members';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let sut: ListTeamMembersUseCase;

describe('ListTeamMembersUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    sut = new ListTeamMembersUseCase(teamsRepository, teamMembersRepository);
  });

  it('should list team members', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-1'), role: 'OWNER' });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-2') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-3') });

    const { members, total } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
    });

    expect(members).toHaveLength(3);
    expect(total).toBe(3);
  });

  it('should filter by role', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-1'), role: 'OWNER' });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-2'), role: 'ADMIN' });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-3') });

    const { members } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
      role: 'ADMIN',
    });

    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('ADMIN');
  });

  it('should throw if team not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: 'non-existent',
      }),
    ).rejects.toThrow('Team not found');
  });

  it('should not include removed members', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-1'), role: 'OWNER' });
    const removed = await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-2') });
    await teamMembersRepository.remove(removed.id);

    const { members } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
    });

    expect(members).toHaveLength(1);
  });
});
