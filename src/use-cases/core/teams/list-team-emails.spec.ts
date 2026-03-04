import { describe, it, expect, beforeEach } from 'vitest';
import { ListTeamEmailsUseCase } from './list-team-emails';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { InMemoryTeamEmailAccountsRepository } from '@/repositories/core/in-memory/in-memory-team-email-accounts-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let teamEmailAccountsRepository: InMemoryTeamEmailAccountsRepository;
let sut: ListTeamEmailsUseCase;

const TENANT_ID = 'tenant-1';

describe('ListTeamEmailsUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    teamEmailAccountsRepository = new InMemoryTeamEmailAccountsRepository();
    sut = new ListTeamEmailsUseCase(
      teamsRepository,
      teamMembersRepository,
      teamEmailAccountsRepository,
    );
  });

  async function createTeamWithOwner(ownerId = 'user-1') {
    const tenantId = new UniqueEntityID(TENANT_ID);
    const team = await teamsRepository.create({
      tenantId,
      name: 'Team',
      slug: 'team',
      createdBy: new UniqueEntityID(ownerId),
    });
    await teamMembersRepository.create({
      tenantId,
      teamId: team.id,
      userId: new UniqueEntityID(ownerId),
      role: 'OWNER',
    });
    return team;
  }

  it('should list team email accounts', async () => {
    const team = await createTeamWithOwner();

    await teamEmailAccountsRepository.create({
      tenantId: TENANT_ID,
      teamId: team.id.toString(),
      accountId: 'account-1',
      linkedBy: 'user-1',
    });
    await teamEmailAccountsRepository.create({
      tenantId: TENANT_ID,
      teamId: team.id.toString(),
      accountId: 'account-2',
      linkedBy: 'user-1',
    });

    const { emailAccounts } = await sut.execute({
      tenantId: TENANT_ID,
      teamId: team.id.toString(),
      requestingUserId: 'user-1',
    });

    expect(emailAccounts).toHaveLength(2);
  });

  it('should return empty if no emails linked', async () => {
    const team = await createTeamWithOwner();

    const { emailAccounts } = await sut.execute({
      tenantId: TENANT_ID,
      teamId: team.id.toString(),
      requestingUserId: 'user-1',
    });

    expect(emailAccounts).toHaveLength(0);
  });

  it('should reject if team not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        teamId: 'non-existent',
        requestingUserId: 'user-1',
      }),
    ).rejects.toThrow('Time não encontrado');
  });

  it('should reject if user is not a member', async () => {
    const team = await createTeamWithOwner();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        teamId: team.id.toString(),
        requestingUserId: 'user-99',
      }),
    ).rejects.toThrow('Apenas membros do time');
  });
});
