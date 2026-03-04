import { describe, it, expect, beforeEach } from 'vitest';
import { RemoveTeamMemberUseCase } from './remove-team-member';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { InMemoryTeamEmailAccountsRepository } from '@/repositories/core/in-memory/in-memory-team-email-accounts-repository';
import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let teamEmailAccountsRepository: InMemoryTeamEmailAccountsRepository;
let emailAccountsRepository: InMemoryEmailAccountsRepository;
let sut: RemoveTeamMemberUseCase;

describe('RemoveTeamMemberUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    teamEmailAccountsRepository = new InMemoryTeamEmailAccountsRepository();
    emailAccountsRepository = new InMemoryEmailAccountsRepository();
    sut = new RemoveTeamMemberUseCase(
      teamsRepository,
      teamMembersRepository,
      teamEmailAccountsRepository,
      emailAccountsRepository,
    );
  });

  it('should remove a member (by OWNER)', async () => {
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

    await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
      requestingUserId: 'user-1',
      memberId: member.id.toString(),
    });

    const found = await teamMembersRepository.findById(member.id);
    expect(found).toBeNull(); // leftAt is set, so findById returns null
  });

  it('should allow self-leave for non-owner', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const team = await teamsRepository.create({
      tenantId,
      name: 'Team',
      slug: 'team',
      createdBy: new UniqueEntityID('user-1'),
    });
    const member = await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-2'),
    });

    await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
      requestingUserId: 'user-2',
      memberId: member.id.toString(),
    });

    const found = await teamMembersRepository.findById(member.id);
    expect(found).toBeNull();
  });

  it('should prevent owner from self-leaving', async () => {
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
      }),
    ).rejects.toThrow('Team owner cannot leave. Transfer ownership first');
  });

  it('should reject removal by regular MEMBER', async () => {
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
    const target = await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID('user-4'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team.id.toString(),
        requestingUserId: 'user-3',
        memberId: target.id.toString(),
      }),
    ).rejects.toThrow('Only team owners and admins can remove members');
  });

  it('should prevent ADMIN from removing OWNER', async () => {
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
      }),
    ).rejects.toThrow('Admins cannot remove team owners');
  });

  it('should throw if member not found', async () => {
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
        memberId: 'non-existent',
      }),
    ).rejects.toThrow('Team member not found');
  });
});
