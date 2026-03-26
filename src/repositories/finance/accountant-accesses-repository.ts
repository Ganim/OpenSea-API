export interface CreateAccountantAccessSchema {
  tenantId: string;
  email: string;
  name: string;
  cpfCnpj?: string;
  crc?: string;
  accessToken: string;
  expiresAt?: Date;
}

export interface AccountantAccessRecord {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  cpfCnpj: string | null;
  crc: string | null;
  accessToken: string;
  isActive: boolean;
  lastAccessAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountantAccessesRepository {
  create(data: CreateAccountantAccessSchema): Promise<AccountantAccessRecord>;
  findById(id: string, tenantId: string): Promise<AccountantAccessRecord | null>;
  findByToken(token: string): Promise<AccountantAccessRecord | null>;
  findByEmail(
    tenantId: string,
    email: string,
  ): Promise<AccountantAccessRecord | null>;
  findMany(tenantId: string): Promise<AccountantAccessRecord[]>;
  deactivate(id: string, tenantId: string): Promise<void>;
  updateLastAccess(id: string): Promise<void>;
}
