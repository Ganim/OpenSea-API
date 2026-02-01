import { TenantPlan } from '@/entities/core/tenant-plan';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CreateTenantPlanSchema,
  TenantPlansRepository,
} from '../tenant-plans-repository';

export class InMemoryTenantPlansRepository implements TenantPlansRepository {
  public items: TenantPlan[] = [];

  async create(data: CreateTenantPlanSchema): Promise<TenantPlan> {
    const tenantPlan = TenantPlan.create({
      tenantId: data.tenantId,
      planId: data.planId,
      startsAt: data.startsAt,
      expiresAt: data.expiresAt ?? null,
    });

    this.items.push(tenantPlan);

    return tenantPlan;
  }

  async findByTenantId(tenantId: UniqueEntityID): Promise<TenantPlan | null> {
    const tenantPlan = this.items.find((item) =>
      item.tenantId.equals(tenantId),
    );

    return tenantPlan ?? null;
  }

  async updatePlan(
    tenantId: UniqueEntityID,
    planId: UniqueEntityID,
  ): Promise<TenantPlan | null> {
    const tenantPlan = this.items.find((item) =>
      item.tenantId.equals(tenantId),
    );
    if (!tenantPlan) return null;

    tenantPlan.planId = planId;
    tenantPlan.startsAt = new Date();

    return tenantPlan;
  }
}
