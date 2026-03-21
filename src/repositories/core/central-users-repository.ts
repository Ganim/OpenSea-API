import type { CentralUser } from '@/entities/core/central-user';

export interface CentralUsersRepository {
  findByUserId(userId: string): Promise<CentralUser | null>;
  findAll(): Promise<CentralUser[]>;
  findByRole(role: string): Promise<CentralUser[]>;
  create(entity: CentralUser): Promise<void>;
  save(entity: CentralUser): Promise<void>;
  delete(id: string): Promise<void>;
}
