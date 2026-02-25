import { describe, it, expect, beforeEach } from 'vitest';
import { BulkAddTeamMembersUseCase } from './bulk-add-team-members';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let sut: BulkAddTeamMembersUseCase;

describe('BulkAddTeamMembersUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    sut = new BulkAddTeamMembersUseCase(teamsRepository, teamMembersRepository);
  });

  it('should add multiple members at once', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-1'), role: 'OWNER' });

    const { added, skipped } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
      requestingUserId: 'user-1',
      members: [
        { userId: 'user-2' },
        { userId: 'user-3', role: 'ADMIN' },
      ],
    });

    expect(added).toHaveLength(2);
    expect(skipped).toHaveLength(0);
    expect(added[0].role).toBe('MEMBER');
    expect(added[1].role).toBe('ADMIN');
  });

  it('should skip already-existing members', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-1'), role: 'OWNER' });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-2') });

    const { added, skipped } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
      requestingUserId: 'user-1',
      members: [
        { userId: 'user-2' },
        { userId: 'user-3' },
      ],
    });

    expect(added).toHaveLength(1);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]).toBe('user-2');
  });

  it('should downgrade OWNER role to MEMBER', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-1'), role: 'OWNER' });

    const { added } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
      requestingUserId: 'user-1',
      members: [{ userId: 'user-4', role: 'OWNER' }],
    });

    expect(added[0].role).toBe('MEMBER');
  });

  it('should reject if requesting user is not OWNER/ADMIN', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({ tenantId, name: 'Team', slug: 'team', createdBy: new UniqueEntityID('user-1') });
    await teamMembersRepository.create({ tenantId, teamId: team.id, userId: new UniqueEntityID('user-5'), role: 'MEMBER' });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team.id.toString(),
        requestingUserId: 'user-5',
        members: [{ userId: 'user-6' }],
      }),
    ).rejects.toThrow('Only team owners and admins can add members');
  });
});
