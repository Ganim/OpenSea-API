import { describe, it, expect, beforeEach } from 'vitest';
import { ListTeamsUseCase } from './list-teams';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let sut: ListTeamsUseCase;

describe('ListTeamsUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    sut = new ListTeamsUseCase(teamsRepository, teamMembersRepository);
  });

  it('should list teams for a tenant', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    await teamsRepository.create({
      tenantId,
      name: 'Team A',
      slug: 'team-a',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamsRepository.create({
      tenantId,
      name: 'Team B',
      slug: 'team-b',
      createdBy: new UniqueEntityID('user-1'),
    });

    const { teams, total } = await sut.execute({ tenantId: 'tenant-1' });

    expect(teams).toHaveLength(2);
    expect(total).toBe(2);
  });

  it('should filter by search', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    await teamsRepository.create({
      tenantId,
      name: 'Engineering',
      slug: 'engineering',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamsRepository.create({
      tenantId,
      name: 'Marketing',
      slug: 'marketing',
      createdBy: new UniqueEntityID('user-1'),
    });

    const { teams } = await sut.execute({
      tenantId: 'tenant-1',
      search: 'engi',
    });

    expect(teams).toHaveLength(1);
    expect(teams[0].name).toBe('Engineering');
  });

  it('should filter by isActive', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    await teamsRepository.create({
      tenantId,
      name: 'Active Team',
      slug: 'active',
      createdBy: new UniqueEntityID('user-1'),
    });
    const inactive = await teamsRepository.create({
      tenantId,
      name: 'Inactive Team',
      slug: 'inactive',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamsRepository.update({
      id: inactive.id,
      tenantId,
      isActive: false,
    });

    const { teams } = await sut.execute({
      tenantId: 'tenant-1',
      isActive: true,
    });

    expect(teams).toHaveLength(1);
    expect(teams[0].name).toBe('Active Team');
  });

  it('should paginate results', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    for (let i = 1; i <= 5; i++) {
      await teamsRepository.create({
        tenantId,
        name: `Team ${i}`,
        slug: `team-${i}`,
        createdBy: new UniqueEntityID('user-1'),
      });
    }

    const { teams, total } = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 2,
    });

    expect(teams).toHaveLength(2);
    expect(total).toBe(5);
  });

  it('should not include other tenant teams', async () => {
    await teamsRepository.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Team A',
      slug: 'team-a',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamsRepository.create({
      tenantId: new UniqueEntityID('tenant-2'),
      name: 'Team B',
      slug: 'team-b',
      createdBy: new UniqueEntityID('user-2'),
    });

    const { teams } = await sut.execute({ tenantId: 'tenant-1' });

    expect(teams).toHaveLength(1);
    expect(teams[0].name).toBe('Team A');
  });

  it('should not include deleted teams', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    await teamsRepository.create({
      tenantId,
      name: 'Active',
      slug: 'active',
      createdBy: new UniqueEntityID('user-1'),
    });
    const deleted = await teamsRepository.create({
      tenantId,
      name: 'Deleted',
      slug: 'deleted',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamsRepository.softDelete(tenantId, deleted.id);

    const { teams } = await sut.execute({ tenantId: 'tenant-1' });

    expect(teams).toHaveLength(1);
    expect(teams[0].name).toBe('Active');
  });
});
