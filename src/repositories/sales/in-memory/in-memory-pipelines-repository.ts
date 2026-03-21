import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Pipeline } from '@/entities/sales/pipeline';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';

export class InMemoryPipelinesRepository implements PipelinesRepository {
  public items: Pipeline[] = [];

  async create(pipeline: Pipeline): Promise<void> {
    this.items.push(pipeline);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Pipeline | null> {
    return (
      this.items.find(
        (p) =>
          p.id.toString() === id.toString() &&
          p.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByName(name: string, tenantId: string): Promise<Pipeline | null> {
    return (
      this.items.find(
        (p) => p.name === name && p.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(tenantId: string): Promise<Pipeline[]> {
    return this.items.filter(
      (p) => p.tenantId.toString() === tenantId && !p.isDeleted,
    );
  }

  async save(pipeline: Pipeline): Promise<void> {
    const index = this.items.findIndex(
      (p) => p.id.toString() === pipeline.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = pipeline;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex(
      (p) => p.id.toString() === id.toString(),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
