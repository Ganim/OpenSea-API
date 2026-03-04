import { describe, it, expect, beforeEach } from 'vitest';
import { TransferTeamOwnershipUseCase } from './transfer-team-ownership';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { InMemoryTeamEmailAccountsRepository } from '@/repositories/core/in-memory/in-memory-team-email-accounts-repository';
import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let teamEmailAccountsRepository: InMemoryTeamEmailAccountsRepository;
let emailAccountsRepository: InMemoryEmailAccountsRepository;
let sut: TransferTeamOwnershipUseCase;

describe('TransferTeamOwnershipUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    teamEmailAccountsRepository = new InMemoryTeamEmailAccountsRepository();
    emailAccountsRepository = new InMemoryEmailAccountsRepository();
    sut = new TransferTeamOwnershipUseCase(
      teamsRepository,
      teamMembersRepository,
      teamEmailAccountsRepository,
      emailAccountsRepository,
    );
  });

  it('should transfer ownership', async () => {
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

    await sut.execute({
      tenantId: 'tenant-1',
      teamId: team.id.toString(),
      requestingUserId: 'user-1',
      newOwnerUserId: 'user-2',
    });

    const oldOwner = await teamMembersRepository.findByTeamAndUser(
      team.id,
      new UniqueEntityID('user-1'),
    );
    const newOwner = await teamMembersRepository.findByTeamAndUser(
      team.id,
      new UniqueEntityID('user-2'),
    );

    expect(oldOwner!.role).toBe('ADMIN');
    expect(newOwner!.role).toBe('OWNER');
  });

  it('should reject transfer to self', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: 'team-1',
        requestingUserId: 'user-1',
        newOwnerUserId: 'user-1',
      }),
    ).rejects.toThrow('Cannot transfer ownership to yourself');
  });

  it('should reject transfer by non-OWNER', async () => {
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
      userId: new UniqueEntityID('user-2'),
      role: 'ADMIN',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        teamId: team.id.toString(),
        requestingUserId: 'user-2',
        newOwnerUserId: 'user-3',
      }),
    ).rejects.toThrow('Only team owners can transfer ownership');
  });

  it('should reject transfer to non-member', async () => {
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
        newOwnerUserId: 'non-member',
      }),
    ).rejects.toThrow('New owner must be a current member of the team');
  });
});
