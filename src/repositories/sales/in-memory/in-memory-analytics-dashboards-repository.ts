import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AnalyticsDashboard } from '@/entities/sales/analytics-dashboard';
import type {
  AnalyticsDashboardsRepository,
  CreateAnalyticsDashboardSchema,
} from '../analytics-dashboards-repository';

export class InMemoryAnalyticsDashboardsRepository implements AnalyticsDashboardsRepository {
  public items: AnalyticsDashboard[] = [];

  async create(data: CreateAnalyticsDashboardSchema): Promise<AnalyticsDashboard> {
    const dashboard = AnalyticsDashboard.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      description: data.description,
      isDefault: data.isDefault,
      isSystem: data.isSystem,
      role: data.role,
      visibility: data.visibility,
      layout: data.layout,
      createdByUserId: data.createdByUserId,
    });

    this.items.push(dashboard);
    return dashboard;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<AnalyticsDashboard | null> {
    return (
      this.items.find(
        (d) => d.id.toString() === id.toString() && d.tenantId.toString() === tenantId && !d.deletedAt,
      ) ?? null
    );
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { role?: string; visibility?: string },
  ): Promise<AnalyticsDashboard[]> {
    let filtered = this.items.filter((d) => d.tenantId.toString() === tenantId && !d.deletedAt);

    if (filters?.role) filtered = filtered.filter((d) => d.role === filters.role);
    if (filters?.visibility) filtered = filtered.filter((d) => d.visibility === filters.visibility);

    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }

  async countMany(
    tenantId: string,
    filters?: { role?: string; visibility?: string },
  ): Promise<number> {
    let filtered = this.items.filter((d) => d.tenantId.toString() === tenantId && !d.deletedAt);

    if (filters?.role) filtered = filtered.filter((d) => d.role === filters.role);
    if (filters?.visibility) filtered = filtered.filter((d) => d.visibility === filters.visibility);

    return filtered.length;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const dashboard = this.items.find(
      (d) => d.id.toString() === id.toString() && d.tenantId.toString() === tenantId,
    );
    if (dashboard) dashboard.delete();
  }
}
