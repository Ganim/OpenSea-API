import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CostCenter } from '@/entities/finance/cost-center';
import type {
  CostCentersRepository,
  CreateCostCenterSchema,
  UpdateCostCenterSchema,
} from '../cost-centers-repository';

export class InMemoryCostCentersRepository implements CostCentersRepository {
  public items: CostCenter[] = [];

  async create(data: CreateCostCenterSchema): Promise<CostCenter> {
    const costCenter = CostCenter.create({
      tenantId: new UniqueEntityID(data.tenantId),
      companyId: data.companyId
        ? new UniqueEntityID(data.companyId)
        : undefined,
      code: data.code,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      monthlyBudget: data.monthlyBudget,
      annualBudget: data.annualBudget,
      parentId: data.parentId ? new UniqueEntityID(data.parentId) : undefined,
    });

    this.items.push(costCenter);
    return costCenter;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CostCenter | null> {
    const item = this.items.find(
      (i) =>
        !i.deletedAt && i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findByCode(code: string, tenantId: string): Promise<CostCenter | null> {
    const item = this.items.find(
      (i) =>
        !i.deletedAt && i.code === code && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(tenantId: string): Promise<CostCenter[]> {
    return this.items.filter(
      (i) => !i.deletedAt && i.tenantId.toString() === tenantId,
    );
  }

  async update(data: UpdateCostCenterSchema): Promise<CostCenter | null> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(data.id));
    if (!item) return null;

    if (data.code !== undefined) item.code = data.code;
    if (data.name !== undefined) item.name = data.name;
    if (data.description !== undefined) item.description = data.description;
    if (data.isActive !== undefined) item.isActive = data.isActive;
    if (data.monthlyBudget !== undefined)
      item.monthlyBudget = data.monthlyBudget;
    if (data.annualBudget !== undefined) item.annualBudget = data.annualBudget;
    if (data.parentId !== undefined)
      item.parentId = data.parentId
        ? new UniqueEntityID(data.parentId)
        : undefined;
    if (data.companyId !== undefined)
      item.companyId = data.companyId
        ? new UniqueEntityID(data.companyId)
        : undefined;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(id));
    if (item) item.delete();
  }
}
