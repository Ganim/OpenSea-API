import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProcessBlueprint } from '@/entities/sales/process-blueprint';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyBlueprintsPaginatedParams,
  ProcessBlueprintsRepository,
} from '@/repositories/sales/process-blueprints-repository';

export class InMemoryProcessBlueprintsRepository
  implements ProcessBlueprintsRepository
{
  public items: ProcessBlueprint[] = [];

  async create(blueprint: ProcessBlueprint): Promise<void> {
    this.items.push(blueprint);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProcessBlueprint | null> {
    return (
      this.items.find(
        (b) =>
          b.id.toString() === id.toString() &&
          b.tenantId.toString() === tenantId &&
          !b.isDeleted,
      ) ?? null
    );
  }

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<ProcessBlueprint | null> {
    return (
      this.items.find(
        (b) =>
          b.name === name && b.tenantId.toString() === tenantId && !b.isDeleted,
      ) ?? null
    );
  }

  async findActiveByPipelineId(
    pipelineId: string,
    tenantId: string,
  ): Promise<ProcessBlueprint | null> {
    return (
      this.items.find(
        (b) =>
          b.pipelineId.toString() === pipelineId &&
          b.tenantId.toString() === tenantId &&
          b.isActive &&
          !b.isDeleted,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyBlueprintsPaginatedParams,
  ): Promise<PaginatedResult<ProcessBlueprint>> {
    let filtered = this.items.filter(
      (b) => b.tenantId.toString() === params.tenantId && !b.isDeleted,
    );

    if (params.pipelineId) {
      filtered = filtered.filter(
        (b) => b.pipelineId.toString() === params.pipelineId,
      );
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter((b) =>
        b.name.toLowerCase().includes(searchLower),
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / params.limit);
    const start = (params.page - 1) * params.limit;
    const paginatedBlueprints = filtered.slice(start, start + params.limit);

    return {
      data: paginatedBlueprints,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
    };
  }

  async save(blueprint: ProcessBlueprint): Promise<void> {
    const index = this.items.findIndex(
      (b) => b.id.toString() === blueprint.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = blueprint;
    }
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const blueprint = this.items.find(
      (b) =>
        b.id.toString() === id.toString() && b.tenantId.toString() === tenantId,
    );
    if (blueprint) {
      blueprint.delete();
    }
  }
}
