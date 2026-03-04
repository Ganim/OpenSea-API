import { describe, it, expect, beforeEach } from 'vitest';
import { UnlinkEmailFromTeamUseCase } from './unlink-email-from-team';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { InMemoryTeamEmailAccountsRepository } from '@/repositories/core/in-memory/in-memory-team-email-accounts-repository';
import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let teamEmailAccountsRepository: InMemoryTeamEmailAccountsRepository;
let emailAccountsRepository: InMemoryEmailAccountsRepository;
let sut: UnlinkEmailFromTeamUseCase;

const TENANT_ID = 'tenant-1';

describe('UnlinkEmailFromTeamUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    teamEmailAccountsRepository = new InMemoryTeamEmailAccountsRepository();
    emailAccountsRepository = new InMemoryEmailAccountsRepository();
    sut = new UnlinkEmailFromTeamUseCase(
      teamsRepository,
      teamMembersRepository,
      teamEmailAccountsRepository,
      emailAccountsRepository,
    );
  });

  async function setup() {
    const tenantId = new UniqueEntityID(TENANT_ID);
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
      role: 'MEMBER',
    });

    const account = await emailAccountsRepository.create({
      tenantId: TENANT_ID,
      ownerUserId: 'user-1',
      address: 'team@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'team@example.com',
      encryptedSecret: 'encrypted',
    });

    // Create link + accesses
    await teamEmailAccountsRepository.create({
      tenantId: TENANT_ID,
      teamId: team.id.toString(),
      accountId: account.id.toString(),
      linkedBy: 'user-1',
    });
    await emailAccountsRepository.upsertAccess({
      accountId: account.id.toString(),
      tenantId: TENANT_ID,
      userId: 'user-1',
      canRead: true,
      canSend: true,
      canManage: true,
    });
    await emailAccountsRepository.upsertAccess({
      accountId: account.id.toString(),
      tenantId: TENANT_ID,
      userId: 'user-2',
      canRead: true,
    });

    return { team, account };
  }

  it('should unlink an email account and remove all member accesses', async () => {
    const { team, account } = await setup();

    await sut.execute({
      tenantId: TENANT_ID,
      teamId: team.id.toString(),
      accountId: account.id.toString(),
      requestingUserId: 'user-1',
    });

    // Link should be removed
    const link = await teamEmailAccountsRepository.findByTeamAndAccount(
      team.id.toString(),
      account.id.toString(),
    );
    expect(link).toBeNull();

    // Accesses should be removed
    const ownerAccess = await emailAccountsRepository.findAccess(
      account.id.toString(),
      'user-1',
    );
    expect(ownerAccess).toBeNull();

    const memberAccess = await emailAccountsRepository.findAccess(
      account.id.toString(),
      'user-2',
    );
    expect(memberAccess).toBeNull();
  });

  it('should reject if team not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        teamId: 'non-existent',
        accountId: 'some-account',
        requestingUserId: 'user-1',
      }),
    ).rejects.toThrow('Time não encontrado');
  });

  it('should reject if user is not OWNER or ADMIN', async () => {
    const { team, account } = await setup();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        teamId: team.id.toString(),
        accountId: account.id.toString(),
        requestingUserId: 'user-2',
      }),
    ).rejects.toThrow('proprietários e administradores');
  });

  it('should reject if link does not exist', async () => {
    const { team } = await setup();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        teamId: team.id.toString(),
        accountId: 'non-existent-account',
        requestingUserId: 'user-1',
      }),
    ).rejects.toThrow('Vínculo entre email e time não encontrado');
  });
});
