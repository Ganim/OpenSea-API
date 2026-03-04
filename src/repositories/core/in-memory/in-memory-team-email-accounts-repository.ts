import { randomUUID } from 'node:crypto';

import type {
  CreateTeamEmailAccountSchema,
  TeamEmailAccountItem,
  TeamEmailAccountsRepository,
  UpdateTeamEmailAccountSchema,
} from '../team-email-accounts-repository';

export class InMemoryTeamEmailAccountsRepository
  implements TeamEmailAccountsRepository
{
  public items: TeamEmailAccountItem[] = [];

  async create(
    data: CreateTeamEmailAccountSchema,
  ): Promise<TeamEmailAccountItem> {
    const item: TeamEmailAccountItem = {
      id: randomUUID(),
      tenantId: data.tenantId,
      teamId: data.teamId,
      accountId: data.accountId,
      linkedBy: data.linkedBy,
      ownerCanRead: data.ownerCanRead ?? true,
      ownerCanSend: data.ownerCanSend ?? true,
      ownerCanManage: data.ownerCanManage ?? true,
      adminCanRead: data.adminCanRead ?? true,
      adminCanSend: data.adminCanSend ?? true,
      adminCanManage: data.adminCanManage ?? false,
      memberCanRead: data.memberCanRead ?? true,
      memberCanSend: data.memberCanSend ?? false,
      memberCanManage: data.memberCanManage ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.items.push(item);
    return item;
  }

  async findById(id: string): Promise<TeamEmailAccountItem | null> {
    return this.items.find((i) => i.id === id) ?? null;
  }

  async findByTeamAndAccount(
    teamId: string,
    accountId: string,
  ): Promise<TeamEmailAccountItem | null> {
    return (
      this.items.find(
        (i) => i.teamId === teamId && i.accountId === accountId,
      ) ?? null
    );
  }

  async findByTeam(teamId: string): Promise<TeamEmailAccountItem[]> {
    return this.items.filter((i) => i.teamId === teamId);
  }

  async findByAccount(accountId: string): Promise<TeamEmailAccountItem[]> {
    return this.items.filter((i) => i.accountId === accountId);
  }

  async update(
    data: UpdateTeamEmailAccountSchema,
  ): Promise<TeamEmailAccountItem> {
    const index = this.items.findIndex((i) => i.id === data.id);
    if (index === -1) throw new Error('TeamEmailAccount not found');

    const item = this.items[index];

    const updated: TeamEmailAccountItem = {
      ...item,
      ownerCanRead: data.ownerCanRead ?? item.ownerCanRead,
      ownerCanSend: data.ownerCanSend ?? item.ownerCanSend,
      ownerCanManage: data.ownerCanManage ?? item.ownerCanManage,
      adminCanRead: data.adminCanRead ?? item.adminCanRead,
      adminCanSend: data.adminCanSend ?? item.adminCanSend,
      adminCanManage: data.adminCanManage ?? item.adminCanManage,
      memberCanRead: data.memberCanRead ?? item.memberCanRead,
      memberCanSend: data.memberCanSend ?? item.memberCanSend,
      memberCanManage: data.memberCanManage ?? item.memberCanManage,
      updatedAt: new Date(),
    };

    this.items[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((i) => i.id !== id);
  }

  async deleteByTeamAndAccount(
    teamId: string,
    accountId: string,
  ): Promise<void> {
    this.items = this.items.filter(
      (i) => !(i.teamId === teamId && i.accountId === accountId),
    );
  }
}
