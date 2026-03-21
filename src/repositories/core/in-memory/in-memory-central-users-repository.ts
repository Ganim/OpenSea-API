import type { CentralUser } from '@/entities/core/central-user';
import type { CentralUsersRepository } from '../central-users-repository';

export class InMemoryCentralUsersRepository implements CentralUsersRepository {
  public items: CentralUser[] = [];

  async findByUserId(userId: string): Promise<CentralUser | null> {
    const centralUser = this.items.find((item) => item.userId === userId);

    return centralUser ?? null;
  }

  async findAll(): Promise<CentralUser[]> {
    return [...this.items];
  }

  async findByRole(role: string): Promise<CentralUser[]> {
    return this.items.filter((item) => item.role === role);
  }

  async create(entity: CentralUser): Promise<void> {
    this.items.push(entity);
  }

  async save(entity: CentralUser): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(entity.id));

    if (index !== -1) {
      this.items[index] = entity;
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === id);

    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
