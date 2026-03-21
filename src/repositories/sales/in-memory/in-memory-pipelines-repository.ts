import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Pipeline } from '@/entities/sales/pipeline';
import type { PipelinesRepository } from '../pipelines-repository';

export class InMemoryPipelinesRepository implements PipelinesRepository {
  public items: Pipeline[] = [];

  async create(pipeline: Pipeline): Promise<void> {
    this.items.push(pipeline);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Pipeline | null> {
    const pipeline = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return pipeline ?? null;
  }

  async findByName(name: string, tenantId: string): Promise<Pipeline | null> {
    const pipeline = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.name === name &&
        item.tenantId.toString() === tenantId,
    );
    return pipeline ?? null;
  }

  async findMany(tenantId: string): Promise<Pipeline[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );
  }

  async findDefault(tenantId: string): Promise<Pipeline | null> {
    const pipeline = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.isDefault &&
        item.tenantId.toString() === tenantId,
    );
    return pipeline ?? null;
  }

  async save(pipeline: Pipeline): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(pipeline.id));
    if (index >= 0) {
      this.items[index] = pipeline;
    } else {
      this.items.push(pipeline);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const pipeline = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    if (pipeline) {
      pipeline.delete();
    }
  }
}
