import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateTeamUseCase } from './update-team';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let sut: UpdateTeamUseCase;

describe('UpdateTeamUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    sut = new UpdateTeamUseCase(teamsRepository, teamMembersRepository);
  });

  it('should update a team name and slug', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const createdTeam = await teamsRepository.create({
      tenantId,
      name: 'Old Name',
      slug: 'old-name',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: createdTeam.id,
      userId: new UniqueEntityID('user-1'),
      role: 'OWNER',
    });

    const { team } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: createdTeam.id.toString(),
      userId: 'user-1',
      name: 'New Name',
    });

    expect(team.name).toBe('New Name');
    expect(team.slug).toBe('new-name');
  });

  it('should allow ADMIN to update', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const createdTeam = await teamsRepository.create({
      tenantId,
      name: 'Team',
      slug: 'team',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: createdTeam.id,
      userId: new UniqueEntityID('user-2'),
      role: 'ADMIN',
    });

    const { team } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: createdTeam.id.toString(),
      userId: 'user-2',
      description: 'Updated description',
    });

    expect(team.description).toBe('Updated description');
  });

  it('should reject update from regular MEMBER', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const createdTeam = await teamsRepository.create({
      tenantId,
      name: 'Team',
      slug: 'team',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: createdTeam.id,
      userId: new UniqueEntityID('user-3'),
      role: 'MEMBER',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: createdTeam.id.toString(),
        userId: 'user-3',
        name: 'New Name',
      }),
    ).rejects.toThrow('Only team owners and admins can update the team');
  });

  it('should reject duplicate slug', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    await teamsRepository.create({
      tenantId,
      name: 'Existing',
      slug: 'existing',
      createdBy: new UniqueEntityID('user-1'),
    });
    const team2 = await teamsRepository.create({
      tenantId,
      name: 'Other',
      slug: 'other',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: team2.id,
      userId: new UniqueEntityID('user-1'),
      role: 'OWNER',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team2.id.toString(),
        userId: 'user-1',
        name: 'Existing',
      }),
    ).rejects.toThrow('A team with this name already exists');
  });

  it('should throw if team not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: 'non-existent',
        userId: 'user-1',
        name: 'New Name',
      }),
    ).rejects.toThrow('Team not found');
  });

  it('should reject empty name', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const createdTeam = await teamsRepository.create({
      tenantId,
      name: 'Team',
      slug: 'team',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: createdTeam.id,
      userId: new UniqueEntityID('user-1'),
      role: 'OWNER',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: createdTeam.id.toString(),
        userId: 'user-1',
        name: '',
      }),
    ).rejects.toThrow('Team name cannot be empty');
  });
});
