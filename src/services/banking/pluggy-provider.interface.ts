export interface PluggyItem {
  id: string;
  status:
    | 'UPDATED'
    | 'UPDATING'
    | 'LOGIN_ERROR'
    | 'OUTDATED'
    | 'WAITING_USER_INPUT';
  executionStatus: string;
  connector: {
    id: number;
    name: string;
    institutionUrl: string;
    imageUrl: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PluggyAccount {
  id: string;
  itemId: string;
  type: 'BANK' | 'CREDIT';
  subtype: string;
  name: string;
  number: string;
  balance: number;
  currencyCode: string;
  bankData?: {
    transferNumber: string;
    closingBalance: number;
  };
}

export interface PluggyTransaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  category?: string;
  providerCode?: string;
}

export interface PluggyConnectToken {
  accessToken: string;
}

export interface BankingProvider {
  readonly providerName: string;
  createConnectToken(options?: {
    clientUserId?: string;
  }): Promise<PluggyConnectToken>;
  getItem(itemId: string): Promise<PluggyItem>;
  getAccounts(itemId: string): Promise<PluggyAccount[]>;
  getTransactions(
    accountId: string,
    from: string,
    to: string,
  ): Promise<PluggyTransaction[]>;
}
