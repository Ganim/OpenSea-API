import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Integration } from '@/entities/sales/integration';

export interface IntegrationsRepository {
  findAll(): Promise<Integration[]>;
  findById(id: UniqueEntityID): Promise<Integration | null>;
  findBySlug(slug: string): Promise<Integration | null>;
}
