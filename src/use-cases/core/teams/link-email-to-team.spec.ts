import { describe, it, expect, beforeEach } from 'vitest';
import { LinkEmailToTeamUseCase } from './link-email-to-team';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { InMemoryTeamEmailAccountsRepository } from '@/repositories/core/in-memory/in-memory-team-email-accounts-repository';
import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let teamEmailAccountsRepository: InMemoryTeamEmailAccountsRepository;
let emailAccountsRepository: InMemoryEmailAccountsRepository;
let sut: LinkEmailToTeamUseCase;

const TENANT_ID = 'tenant-1';

describe('LinkEmailToTeamUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    teamEmailAccountsRepository = new InMemoryTeamEmailAccountsRepository();
    emailAccountsRepository = new InMemoryEmailAccountsRepository();
    sut = new LinkEmailToTeamUseCase(
      teamsRepository,
      teamMembersRepository,
      teamEmailAccountsRepository,
      emailAccountsRepository,
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

  async function createEmailAccount(ownerId = 'user-1') {
    return emailAccountsRepository.create({
      tenantId: TENANT_ID,
      ownerUserId: ownerId,
      address: 'team@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'team@example.com',
      encryptedSecret: 'encrypted',
    });
  }

  it('should link an email account to a team', async () => {
    const team = await createTeamWithOwner();
    const account = await createEmailAccount();

    const { teamEmail } = await sut.execute({
      tenantId: TENANT_ID,
      teamId: team.id.toString(),
      accountId: account.id.toString(),
      requestingUserId: 'user-1',
    });

    expect(teamEmail.teamId).toBe(team.id.toString());
    expect(teamEmail.accountId).toBe(account.id.toString());
    expect(teamEmail.ownerCanRead).toBe(true);
    expect(teamEmail.ownerCanManage).toBe(true);
    expect(teamEmail.memberCanSend).toBe(false);
  });

  it('should grant EmailAccountAccess to all existing members', async () => {
    const team = await createTeamWithOwner();
    const account = await createEmailAccount();

    // Add a regular member
    await teamMembersRepository.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      teamId: team.id,
      userId: new UniqueEntityID('user-2'),
      role: 'MEMBER',
    });

    await sut.execute({
      tenantId: TENANT_ID,
      teamId: team.id.toString(),
      accountId: account.id.toString(),
      requestingUserId: 'user-1',
    });

    // Owner should have full access
    const ownerAccess = await emailAccountsRepository.findAccess(
      account.id.toString(),
      'user-1',
    );
    expect(ownerAccess?.canRead).toBe(true);
    expect(ownerAccess?.canSend).toBe(true);
    expect(ownerAccess?.canManage).toBe(true);

    // Member should have read-only by default
    const memberAccess = await emailAccountsRepository.findAccess(
      account.id.toString(),
      'user-2',
    );
    expect(memberAccess?.canRead).toBe(true);
    expect(memberAccess?.canSend).toBe(false);
    expect(memberAccess?.canManage).toBe(false);
  });

  it('should apply custom permission config', async () => {
    const team = await createTeamWithOwner();
    const account = await createEmailAccount();

    await teamMembersRepository.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      teamId: team.id,
      userId: new UniqueEntityID('user-2'),
      role: 'MEMBER',
    });

    await sut.execute({
      tenantId: TENANT_ID,
      teamId: team.id.toString(),
      accountId: account.id.toString(),
      requestingUserId: 'user-1',
      memberCanSend: true,
    });

    const memberAccess = await emailAccountsRepository.findAccess(
      account.id.toString(),
      'user-2',
    );
    expect(memberAccess?.canSend).toBe(true);
  });

  it('should reject if team not found', async () => {
    const account = await createEmailAccount();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        teamId: 'non-existent',
        accountId: account.id.toString(),
        requestingUserId: 'user-1',
      }),
    ).rejects.toThrow('Time não encontrado');
  });

  it('should reject if email account not found', async () => {
    const team = await createTeamWithOwner();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        teamId: team.id.toString(),
        accountId: 'non-existent',
        requestingUserId: 'user-1',
      }),
    ).rejects.toThrow('Conta de email não encontrada');
  });

  it('should reject if already linked', async () => {
    const team = await createTeamWithOwner();
    const account = await createEmailAccount();

    await sut.execute({
      tenantId: TENANT_ID,
      teamId: team.id.toString(),
      accountId: account.id.toString(),
      requestingUserId: 'user-1',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        teamId: team.id.toString(),
        accountId: account.id.toString(),
        requestingUserId: 'user-1',
      }),
    ).rejects.toThrow('já está vinculada');
  });

  it('should reject if user is not OWNER or ADMIN', async () => {
    const team = await createTeamWithOwner();
    const account = await createEmailAccount();

    await teamMembersRepository.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      teamId: team.id,
      userId: new UniqueEntityID('user-3'),
      role: 'MEMBER',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        teamId: team.id.toString(),
        accountId: account.id.toString(),
        requestingUserId: 'user-3',
      }),
    ).rejects.toThrow('proprietários e administradores');
  });
});
