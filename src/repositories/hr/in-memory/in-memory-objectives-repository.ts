import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Objective } from '@/entities/hr/objective';
import type {
  CreateObjectiveSchema,
  FindObjectiveFilters,
  ObjectivesRepository,
  UpdateObjectiveSchema,
} from '../objectives-repository';

export class InMemoryObjectivesRepository implements ObjectivesRepository {
  public items: Objective[] = [];

  async create(data: CreateObjectiveSchema): Promise<Objective> {
    const objective = Objective.create({
      tenantId: new UniqueEntityID(data.tenantId),
      title: data.title,
      description: data.description,
      ownerId: data.ownerId,
      parentId: data.parentId,
      level: data.level,
      status: data.status ?? 'DRAFT',
      period: data.period,
      startDate: data.startDate,
      endDate: data.endDate,
      progress: data.progress ?? 0,
    });

    this.items.push(objective);
    return objective;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Objective | null> {
    return (
      this.items.find(
        (o) => o.id.equals(id) && o.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindObjectiveFilters,
  ): Promise<{ objectives: Objective[]; total: number }> {
    let filtered = this.items.filter((o) => o.tenantId.toString() === tenantId);

    if (filters?.ownerId) {
      filtered = filtered.filter((o) => o.ownerId.equals(filters.ownerId!));
    }
    if (filters?.parentId) {
      filtered = filtered.filter(
        (o) => o.parentId !== undefined && o.parentId.equals(filters.parentId!),
      );
    }
    if (filters?.level) {
      filtered = filtered.filter((o) => o.level === filters.level);
    }
    if (filters?.status) {
      filtered = filtered.filter((o) => o.status === filters.status);
    }
    if (filters?.period) {
      filtered = filtered.filter((o) => o.period === filters.period);
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      objectives: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async update(data: UpdateObjectiveSchema): Promise<Objective | null> {
    const index = this.items.findIndex((o) => o.id.equals(data.id));
    if (index === -1) return null;

    const objective = this.items[index];
    if (data.title !== undefined) objective.props.title = data.title;
    if (data.description !== undefined)
      objective.props.description = data.description;
    if (data.ownerId !== undefined) objective.props.ownerId = data.ownerId;
    if (data.parentId !== undefined) objective.props.parentId = data.parentId;
    if (data.level !== undefined) objective.props.level = data.level;
    if (data.status !== undefined) objective.props.status = data.status;
    if (data.period !== undefined) objective.props.period = data.period;
    if (data.startDate !== undefined)
      objective.props.startDate = data.startDate;
    if (data.endDate !== undefined) objective.props.endDate = data.endDate;
    if (data.progress !== undefined) objective.props.progress = data.progress;
    objective.props.updatedAt = new Date();

    return objective;
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex((o) => o.id.equals(id));
    if (index >= 0) this.items.splice(index, 1);
  }
}
