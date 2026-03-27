import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Integration } from '@/entities/sales/integration';
import type { IntegrationsRepository } from '../integrations-repository';

export class InMemoryIntegrationsRepository implements IntegrationsRepository {
  public items: Integration[] = [];

  async findAll(): Promise<Integration[]> {
    return this.items.filter((integration) => integration.isAvailable);
  }

  async findById(id: UniqueEntityID): Promise<Integration | null> {
    const integration = this.items.find((item) => item.id.equals(id));
    return integration ?? null;
  }

  async findBySlug(slug: string): Promise<Integration | null> {
    const integration = this.items.find((item) => item.slug === slug);
    return integration ?? null;
  }
}
