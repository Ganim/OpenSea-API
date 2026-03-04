import { describe, it, expect, beforeEach } from 'vitest';
import { AddTeamMemberUseCase } from './add-team-member';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { InMemoryTeamEmailAccountsRepository } from '@/repositories/core/in-memory/in-memory-team-email-accounts-repository';
import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let teamEmailAccountsRepository: InMemoryTeamEmailAccountsRepository;
let emailAccountsRepository: InMemoryEmailAccountsRepository;
let sut: AddTeamMemberUseCase;

describe('AddTeamMemberUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    teamEmailAccountsRepository = new InMemoryTeamEmailAccountsRepository();
    emailAccountsRepository = new InMemoryEmailAccountsRepository();
    sut = new AddTeamMemberUseCase(
      teamsRepository,
      teamMembersRepository,
      teamEmailAccountsRepository,
      emailAccountsRepository,
    );
  });

  it('should add a member to a team', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({
      tenantId,
      name: 'Team',
      slug: 'team',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-1'),
      role: 'OWNER',
    });

    const { member } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
      requestingUserId: 'user-1',
      userId: 'user-2',
    });

    expect(member.userId).toBe('user-2');
    expect(member.role).toBe('MEMBER');
  });

  it('should add a member with ADMIN role', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({
      tenantId,
      name: 'Team',
      slug: 'team',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-1'),
      role: 'OWNER',
    });

    const { member } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
      requestingUserId: 'user-1',
      userId: 'user-2',
      role: 'ADMIN',
    });

    expect(member.role).toBe('ADMIN');
  });

  it('should reject if requesting user is not OWNER/ADMIN', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({
      tenantId,
      name: 'Team',
      slug: 'team',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-3'),
      role: 'MEMBER',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team.id.toString(),
        requestingUserId: 'user-3',
        userId: 'user-4',
      }),
    ).rejects.toThrow('Only team owners and admins can add members');
  });

  it('should reject adding existing member', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({
      tenantId,
      name: 'Team',
      slug: 'team',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-1'),
      role: 'OWNER',
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-2'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team.id.toString(),
        requestingUserId: 'user-1',
        userId: 'user-2',
      }),
    ).rejects.toThrow('User is already a member of this team');
  });

  it('should reject OWNER role assignment', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({
      tenantId,
      name: 'Team',
      slug: 'team',
      createdBy: new UniqueEntityID('user-1'),
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-1'),
      role: 'OWNER',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team.id.toString(),
        requestingUserId: 'user-1',
        userId: 'user-5',
        role: 'OWNER',
      }),
    ).rejects.toThrow('Cannot assign OWNER role directly');
  });

  it('should throw if team not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: 'non-existent',
        requestingUserId: 'user-1',
        userId: 'user-2',
      }),
    ).rejects.toThrow('Team not found');
  });
});
