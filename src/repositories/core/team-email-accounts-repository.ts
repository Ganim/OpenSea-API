export interface TeamEmailAccountItem {
  id: string;
  tenantId: string;
  teamId: string;
  accountId: string;
  ownerCanRead: boolean;
  ownerCanSend: boolean;
  ownerCanManage: boolean;
  adminCanRead: boolean;
  adminCanSend: boolean;
  adminCanManage: boolean;
  memberCanRead: boolean;
  memberCanSend: boolean;
  memberCanManage: boolean;
  linkedBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Joined data (populated by specific queries)
  accountAddress?: string;
  accountDisplayName?: string | null;
}

export interface CreateTeamEmailAccountSchema {
  tenantId: string;
  teamId: string;
  accountId: string;
  linkedBy: string;
  ownerCanRead?: boolean;
  ownerCanSend?: boolean;
  ownerCanManage?: boolean;
  adminCanRead?: boolean;
  adminCanSend?: boolean;
  adminCanManage?: boolean;
  memberCanRead?: boolean;
  memberCanSend?: boolean;
  memberCanManage?: boolean;
}

export interface UpdateTeamEmailAccountSchema {
  id: string;
  ownerCanRead?: boolean;
  ownerCanSend?: boolean;
  ownerCanManage?: boolean;
  adminCanRead?: boolean;
  adminCanSend?: boolean;
  adminCanManage?: boolean;
  memberCanRead?: boolean;
  memberCanSend?: boolean;
  memberCanManage?: boolean;
}

export interface TeamEmailAccountsRepository {
  create(data: CreateTeamEmailAccountSchema): Promise<TeamEmailAccountItem>;
  findById(id: string): Promise<TeamEmailAccountItem | null>;
  findByTeamAndAccount(
    teamId: string,
    accountId: string,
  ): Promise<TeamEmailAccountItem | null>;
  findByTeam(teamId: string): Promise<TeamEmailAccountItem[]>;
  findByAccount(accountId: string): Promise<TeamEmailAccountItem[]>;
  update(data: UpdateTeamEmailAccountSchema): Promise<TeamEmailAccountItem>;
  delete(id: string): Promise<void>;
  deleteByTeamAndAccount(teamId: string, accountId: string): Promise<void>;
}
