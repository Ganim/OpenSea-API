import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeTeamMemberRoleUseCase } from './change-team-member-role';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { InMemoryTeamEmailAccountsRepository } from '@/repositories/core/in-memory/in-memory-team-email-accounts-repository';
import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let teamEmailAccountsRepository: InMemoryTeamEmailAccountsRepository;
let emailAccountsRepository: InMemoryEmailAccountsRepository;
let sut: ChangeTeamMemberRoleUseCase;

describe('ChangeTeamMemberRoleUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    teamEmailAccountsRepository = new InMemoryTeamEmailAccountsRepository();
    emailAccountsRepository = new InMemoryEmailAccountsRepository();
    sut = new ChangeTeamMemberRoleUseCase(
      teamsRepository,
      teamMembersRepository,
      teamEmailAccountsRepository,
      emailAccountsRepository,
    );
  });

  it('should allow OWNER to change member role to ADMIN', async () => {
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
    const member = await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-2'),
    });

    const { member: updated } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
      requestingUserId: 'user-1',
      memberId: member.id.toString(),
      role: 'ADMIN',
    });

    expect(updated.role).toBe('ADMIN');
  });

  it('should allow ADMIN to change MEMBER role to ADMIN', async () => {
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
      role: 'ADMIN',
    });
    const member = await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-3'),
    });

    const { member: updated } = await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
      requestingUserId: 'user-2',
      memberId: member.id.toString(),
      role: 'ADMIN',
    });

    expect(updated.role).toBe('ADMIN');
  });

  it('should reject ADMIN changing another ADMIN role', async () => {
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
    const admin2 = await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-2'),
      role: 'ADMIN',
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-3'),
      role: 'ADMIN',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team.id.toString(),
        requestingUserId: 'user-3',
        memberId: admin2.id.toString(),
        role: 'MEMBER',
      }),
    ).rejects.toThrow('Admins can only change the role of regular members');
  });

  it('should reject ADMIN changing OWNER role', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({
      tenantId,
      name: 'Team',
      slug: 'team',
      createdBy: new UniqueEntityID('user-1'),
    });
    const owner = await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-1'),
      role: 'OWNER',
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-2'),
      role: 'ADMIN',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team.id.toString(),
        requestingUserId: 'user-2',
        memberId: owner.id.toString(),
        role: 'MEMBER',
      }),
    ).rejects.toThrow('Admins can only change the role of regular members');
  });

  it('should reject role change by regular MEMBER', async () => {
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
    const member = await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-3'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team.id.toString(),
        requestingUserId: 'user-2',
        memberId: member.id.toString(),
        role: 'ADMIN',
      }),
    ).rejects.toThrow('Only team owners and admins can change member roles');
  });

  it('should reject changing own role', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({
      tenantId,
      name: 'Team',
      slug: 'team',
      createdBy: new UniqueEntityID('user-1'),
    });
    const owner = await teamMembersRepository.create({
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
        memberId: owner.id.toString(),
        role: 'ADMIN',
      }),
    ).rejects.toThrow('Cannot change your own role');
  });

  it('should reject promoting to OWNER', async () => {
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
    const member = await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-2'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team.id.toString(),
        requestingUserId: 'user-1',
        memberId: member.id.toString(),
        role: 'OWNER',
      }),
    ).rejects.toThrow(
      'Cannot assign OWNER role. Use transfer ownership instead',
    );
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
