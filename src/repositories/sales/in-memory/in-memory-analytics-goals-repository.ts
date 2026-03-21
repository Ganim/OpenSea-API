import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AnalyticsGoal } from '@/entities/sales/analytics-goal';
import type {
  AnalyticsGoalsRepository,
  CreateAnalyticsGoalSchema,
  UpdateAnalyticsGoalSchema,
} from '../analytics-goals-repository';

export class InMemoryAnalyticsGoalsRepository implements AnalyticsGoalsRepository {
  public items: AnalyticsGoal[] = [];

  async create(data: CreateAnalyticsGoalSchema): Promise<AnalyticsGoal> {
    const goal = AnalyticsGoal.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      type: data.type,
      targetValue: data.targetValue,
      currentValue: data.currentValue,
      unit: data.unit ?? 'BRL',
      period: data.period,
      startDate: data.startDate,
      endDate: data.endDate,
      scope: data.scope,
      userId: data.userId,
      teamId: data.teamId,
      status: data.status,
      createdByUserId: data.createdByUserId,
    });

    this.items.push(goal);
    return goal;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<AnalyticsGoal | null> {
    return (
      this.items.find(
        (g) => g.id.toString() === id.toString() && g.tenantId.toString() === tenantId && !g.deletedAt,
      ) ?? null
    );
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { status?: string; type?: string; scope?: string; userId?: string },
  ): Promise<AnalyticsGoal[]> {
    let filtered = this.items.filter((g) => g.tenantId.toString() === tenantId && !g.deletedAt);

    if (filters?.status) filtered = filtered.filter((g) => g.status === filters.status);
    if (filters?.type) filtered = filtered.filter((g) => g.type === filters.type);
    if (filters?.scope) filtered = filtered.filter((g) => g.scope === filters.scope);
    if (filters?.userId) filtered = filtered.filter((g) => g.userId === filters.userId);

    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }

  async countMany(
    tenantId: string,
    filters?: { status?: string; type?: string; scope?: string; userId?: string },
  ): Promise<number> {
    let filtered = this.items.filter((g) => g.tenantId.toString() === tenantId && !g.deletedAt);

    if (filters?.status) filtered = filtered.filter((g) => g.status === filters.status);
    if (filters?.type) filtered = filtered.filter((g) => g.type === filters.type);
    if (filters?.scope) filtered = filtered.filter((g) => g.scope === filters.scope);
    if (filters?.userId) filtered = filtered.filter((g) => g.userId === filters.userId);

    return filtered.length;
  }

  async update(data: UpdateAnalyticsGoalSchema): Promise<AnalyticsGoal | null> {
    const goal = this.items.find(
      (g) => g.id.toString() === data.id.toString() && g.tenantId.toString() === data.tenantId && !g.deletedAt,
    );

    if (!goal) return null;

    if (data.name !== undefined) goal.name = data.name;
    if (data.targetValue !== undefined) goal.targetValue = data.targetValue;
    if (data.currentValue !== undefined) goal.currentValue = data.currentValue;
    if (data.status !== undefined) goal.status = data.status;

    return goal;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const goal = this.items.find(
      (g) => g.id.toString() === id.toString() && g.tenantId.toString() === tenantId,
    );
    if (goal) goal.delete();
  }
}
