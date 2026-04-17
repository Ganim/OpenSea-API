import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ReviewCycle } from '@/entities/hr/review-cycle';
import type {
  CreateReviewCycleSchema,
  FindReviewCycleFilters,
  ReviewCyclesRepository,
  UpdateReviewCycleSchema,
} from '../review-cycles-repository';

export class InMemoryReviewCyclesRepository implements ReviewCyclesRepository {
  public items: ReviewCycle[] = [];

  async create(data: CreateReviewCycleSchema): Promise<ReviewCycle> {
    const reviewCycle = ReviewCycle.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      description: data.description,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status ?? 'DRAFT',
      isActive: data.isActive ?? true,
    });

    this.items.push(reviewCycle);
    return reviewCycle;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ReviewCycle | null> {
    return (
      this.items.find(
        (cycle) =>
          cycle.id.equals(id) &&
          cycle.tenantId.toString() === tenantId &&
          !cycle.deletedAt,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindReviewCycleFilters,
  ): Promise<{ reviewCycles: ReviewCycle[]; total: number }> {
    let filtered = this.items.filter(
      (cycle) => cycle.tenantId.toString() === tenantId && !cycle.deletedAt,
    );

    if (filters?.type) {
      filtered = filtered.filter((cycle) => cycle.type === filters.type);
    }
    if (filters?.status) {
      filtered = filtered.filter((cycle) => cycle.status === filters.status);
    }
    if (filters?.isActive !== undefined) {
      filtered = filtered.filter(
        (cycle) => cycle.isActive === filters.isActive,
      );
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((cycle) =>
        cycle.name.toLowerCase().includes(searchLower),
      );
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      reviewCycles: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async update(data: UpdateReviewCycleSchema): Promise<ReviewCycle | null> {
    const index = this.items.findIndex((cycle) => cycle.id.equals(data.id));
    if (index === -1) return null;

    const cycle = this.items[index];

    if (data.name !== undefined) cycle.updateName(data.name);
    if (data.isActive === false) cycle.deactivate();
    if (data.isActive === true) cycle.activate();
    if (data.status !== undefined) {
      cycle.props.status = data.status;
      cycle.props.updatedAt = new Date();
    }
    if (data.description !== undefined) {
      cycle.props.description = data.description;
      cycle.props.updatedAt = new Date();
    }
    if (data.type !== undefined) {
      cycle.props.type = data.type;
      cycle.props.updatedAt = new Date();
    }
    if (data.startDate !== undefined) {
      cycle.props.startDate = data.startDate;
      cycle.props.updatedAt = new Date();
    }
    if (data.endDate !== undefined) {
      cycle.props.endDate = data.endDate;
      cycle.props.updatedAt = new Date();
    }

    return cycle;
  }

  async delete(id: UniqueEntityID, _tenantId?: string): Promise<void> {
    const index = this.items.findIndex((cycle) => cycle.id.equals(id));
    if (index >= 0) {
      this.items[index].softDelete();
    }
  }
}
