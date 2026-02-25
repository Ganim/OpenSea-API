import { describe, it, expect, beforeEach } from 'vitest';
import { GetTeamByIdUseCase } from './get-team-by-id';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let sut: GetTeamByIdUseCase;

describe('GetTeamByIdUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    sut = new GetTeamByIdUseCase(teamsRepository, teamMembersRepository);
  });

  it('should get a team by id', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const createdTeam = await teamsRepository.create({
      tenantId,
      name: 'Engineering',
      slug: 'engineering',
      createdBy: new UniqueEntityID('user-1'),
    });

    const { team } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: createdTeam.id.toString(),
    });

    expect(team.name).toBe('Engineering');
    expect(team.slug).toBe('engineering');
  });

  it('should return members count', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const createdTeam = await teamsRepository.create({
      tenantId,
      name: 'Engineering',
      slug: 'engineering',
      createdBy: new UniqueEntityID('user-1'),
    });

    await teamMembersRepository.create({
      tenantId,
      teamId: createdTeam.id,
      userId: new UniqueEntityID('user-1'),
      role: 'OWNER',
    });

    await teamMembersRepository.create({
      tenantId,
      teamId: createdTeam.id,
      userId: new UniqueEntityID('user-2'),
    });

    const { team } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: createdTeam.id.toString(),
    });

    expect(team.membersCount).toBe(2);
  });

  it('should throw if team not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: 'non-existent',
      }),
    ).rejects.toThrow('Team not found');
  });

  it('should enforce tenant isolation', async () => {
    const createdTeam = await teamsRepository.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Engineering',
      slug: 'engineering',
      createdBy: new UniqueEntityID('user-1'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-2',
        teamId: createdTeam.id.toString(),
      }),
    ).rejects.toThrow('Team not found');
  });

  it('should not find deleted teams', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const createdTeam = await teamsRepository.create({
      tenantId,
      name: 'Engineering',
      slug: 'engineering',
      createdBy: new UniqueEntityID('user-1'),
    });

    await teamsRepository.softDelete(tenantId, createdTeam.id);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: createdTeam.id.toString(),
      }),
    ).rejects.toThrow('Team not found');
  });
});
