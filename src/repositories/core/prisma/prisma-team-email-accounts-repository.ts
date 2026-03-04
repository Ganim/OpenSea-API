import { prisma } from '@/lib/prisma';

import type {
  CreateTeamEmailAccountSchema,
  TeamEmailAccountItem,
  TeamEmailAccountsRepository,
  UpdateTeamEmailAccountSchema,
} from '../team-email-accounts-repository';

const accountSelect = {
  select: { address: true, displayName: true },
} as const;

function toItem(
  raw: Record<string, unknown>,
  account?: { address: string; displayName: string | null },
): TeamEmailAccountItem {
  return {
    id: raw.id as string,
    tenantId: raw.tenantId as string,
    teamId: raw.teamId as string,
    accountId: raw.accountId as string,
    ownerCanRead: raw.ownerCanRead as boolean,
    ownerCanSend: raw.ownerCanSend as boolean,
    ownerCanManage: raw.ownerCanManage as boolean,
    adminCanRead: raw.adminCanRead as boolean,
    adminCanSend: raw.adminCanSend as boolean,
    adminCanManage: raw.adminCanManage as boolean,
    memberCanRead: raw.memberCanRead as boolean,
    memberCanSend: raw.memberCanSend as boolean,
    memberCanManage: raw.memberCanManage as boolean,
    linkedBy: raw.linkedBy as string,
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
    accountAddress: account?.address,
    accountDisplayName: account?.displayName,
  };
}

export class PrismaTeamEmailAccountsRepository
  implements TeamEmailAccountsRepository
{
  async create(
    data: CreateTeamEmailAccountSchema,
  ): Promise<TeamEmailAccountItem> {
    const record = await prisma.teamEmailAccount.create({
      data: {
        tenantId: data.tenantId,
        teamId: data.teamId,
        accountId: data.accountId,
        linkedBy: data.linkedBy,
        ownerCanRead: data.ownerCanRead,
        ownerCanSend: data.ownerCanSend,
        ownerCanManage: data.ownerCanManage,
        adminCanRead: data.adminCanRead,
        adminCanSend: data.adminCanSend,
        adminCanManage: data.adminCanManage,
        memberCanRead: data.memberCanRead,
        memberCanSend: data.memberCanSend,
        memberCanManage: data.memberCanManage,
      },
      include: { account: accountSelect },
    });

    return toItem(record, record.account);
  }

  async findById(id: string): Promise<TeamEmailAccountItem | null> {
    const record = await prisma.teamEmailAccount.findUnique({
      where: { id },
      include: { account: accountSelect },
    });

    if (!record) return null;
    return toItem(record, record.account);
  }

  async findByTeamAndAccount(
    teamId: string,
    accountId: string,
  ): Promise<TeamEmailAccountItem | null> {
    const record = await prisma.teamEmailAccount.findUnique({
      where: { teamId_accountId: { teamId, accountId } },
      include: { account: accountSelect },
    });

    if (!record) return null;
    return toItem(record, record.account);
  }

  async findByTeam(teamId: string): Promise<TeamEmailAccountItem[]> {
    const records = await prisma.teamEmailAccount.findMany({
      where: { teamId },
      include: { account: accountSelect },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((r) => toItem(r, r.account));
  }

  async findByAccount(accountId: string): Promise<TeamEmailAccountItem[]> {
    const records = await prisma.teamEmailAccount.findMany({
      where: { accountId },
      include: { account: accountSelect },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((r) => toItem(r, r.account));
  }

  async update(
    data: UpdateTeamEmailAccountSchema,
  ): Promise<TeamEmailAccountItem> {
    const record = await prisma.teamEmailAccount.update({
      where: { id: data.id },
      data: {
        ownerCanRead: data.ownerCanRead,
        ownerCanSend: data.ownerCanSend,
        ownerCanManage: data.ownerCanManage,
        adminCanRead: data.adminCanRead,
        adminCanSend: data.adminCanSend,
        adminCanManage: data.adminCanManage,
        memberCanRead: data.memberCanRead,
        memberCanSend: data.memberCanSend,
        memberCanManage: data.memberCanManage,
      },
      include: { account: accountSelect },
    });

    return toItem(record, record.account);
  }

  async delete(id: string): Promise<void> {
    await prisma.teamEmailAccount.delete({ where: { id } });
  }

  async deleteByTeamAndAccount(
    teamId: string,
    accountId: string,
  ): Promise<void> {
    await prisma.teamEmailAccount.delete({
      where: { teamId_accountId: { teamId, accountId } },
    });
  }
}
