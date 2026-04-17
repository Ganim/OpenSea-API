import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkplaceRisk } from '@/entities/hr/workplace-risk';
import type {
  CreateWorkplaceRiskSchema,
  FindWorkplaceRiskFilters,
  UpdateWorkplaceRiskSchema,
  WorkplaceRisksRepository,
} from '../workplace-risks-repository';

export class InMemoryWorkplaceRisksRepository
  implements WorkplaceRisksRepository
{
  private items: WorkplaceRisk[] = [];

  async create(data: CreateWorkplaceRiskSchema): Promise<WorkplaceRisk> {
    const id = new UniqueEntityID();
    const workplaceRisk = WorkplaceRisk.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        safetyProgramId: data.safetyProgramId,
        name: data.name,
        category: data.category as WorkplaceRisk['category'],
        severity: data.severity as WorkplaceRisk['severity'],
        source: data.source,
        affectedArea: data.affectedArea,
        controlMeasures: data.controlMeasures,
        epiRequired: data.epiRequired,
        isActive: data.isActive ?? true,
      },
      id,
    );

    this.items.push(workplaceRisk);
    return workplaceRisk;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<WorkplaceRisk | null> {
    const workplaceRisk = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return workplaceRisk || null;
  }

  async findMany(
    tenantId: string,
    filters?: FindWorkplaceRiskFilters,
  ): Promise<WorkplaceRisk[]> {
    let filteredItems = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.safetyProgramId) {
      filteredItems = filteredItems.filter((item) =>
        item.safetyProgramId.equals(filters.safetyProgramId!),
      );
    }

    if (filters?.category) {
      filteredItems = filteredItems.filter(
        (item) => item.category === filters.category,
      );
    }

    if (filters?.severity) {
      filteredItems = filteredItems.filter(
        (item) => item.severity === filters.severity,
      );
    }

    if (filters?.isActive !== undefined) {
      filteredItems = filteredItems.filter(
        (item) => item.isActive === filters.isActive,
      );
    }

    const page = filters?.page ?? 1;
    const perPage = filters?.perPage ?? 20;
    const start = (page - 1) * perPage;

    return filteredItems.slice(start, start + perPage);
  }

  async update(data: UpdateWorkplaceRiskSchema): Promise<WorkplaceRisk | null> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(data.id) &&
        (!data.tenantId || item.tenantId.toString() === data.tenantId),
    );

    if (index === -1) return null;

    const existing = this.items[index];

    const updatedWorkplaceRisk = WorkplaceRisk.create(
      {
        tenantId: existing.tenantId,
        safetyProgramId: existing.safetyProgramId,
        name: data.name ?? existing.name,
        category: (data.category ??
          existing.category) as WorkplaceRisk['category'],
        severity: (data.severity ??
          existing.severity) as WorkplaceRisk['severity'],
        source: data.source ?? existing.source,
        affectedArea: data.affectedArea ?? existing.affectedArea,
        controlMeasures: data.controlMeasures ?? existing.controlMeasures,
        epiRequired: data.epiRequired ?? existing.epiRequired,
        isActive: data.isActive ?? existing.isActive,
        createdAt: existing.createdAt,
      },
      existing.id,
    );

    this.items[index] = updatedWorkplaceRisk;
    return updatedWorkplaceRisk;
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(id) &&
        (!tenantId || item.tenantId.toString() === tenantId),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  clear(): void {
    this.items = [];
  }
}
