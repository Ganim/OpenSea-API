import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BenefitPlan } from '@/entities/hr/benefit-plan';
import type {
  BenefitPlansRepository,
  CreateBenefitPlanSchema,
  FindBenefitPlanFilters,
  UpdateBenefitPlanSchema,
} from '../benefit-plans-repository';

export class InMemoryBenefitPlansRepository implements BenefitPlansRepository {
  public items: BenefitPlan[] = [];

  async create(data: CreateBenefitPlanSchema): Promise<BenefitPlan> {
    const benefitPlan = BenefitPlan.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      type: data.type,
      provider: data.provider,
      policyNumber: data.policyNumber,
      isActive: data.isActive ?? true,
      rules: data.rules,
      description: data.description,
    });

    this.items.push(benefitPlan);
    return benefitPlan;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BenefitPlan | null> {
    return (
      this.items.find(
        (plan) => plan.id.equals(id) && plan.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindBenefitPlanFilters,
  ): Promise<{ benefitPlans: BenefitPlan[]; total: number }> {
    let filtered = this.items.filter(
      (plan) => plan.tenantId.toString() === tenantId,
    );

    if (filters?.type) {
      filtered = filtered.filter((plan) => plan.type === filters.type);
    }
    if (filters?.isActive !== undefined) {
      filtered = filtered.filter((plan) => plan.isActive === filters.isActive);
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((plan) =>
        plan.name.toLowerCase().includes(searchLower),
      );
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      benefitPlans: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async update(data: UpdateBenefitPlanSchema): Promise<BenefitPlan | null> {
    const index = this.items.findIndex((plan) => plan.id.equals(data.id));
    if (index === -1) return null;

    const plan = this.items[index];

    if (data.name !== undefined) plan.updateName(data.name);
    if (data.rules !== undefined) plan.updateRules(data.rules);
    if (data.isActive === false) plan.deactivate();
    if (data.isActive === true) plan.activate();
    if (data.type !== undefined) {
      plan.props.type = data.type;
      plan.props.updatedAt = new Date();
    }
    if (data.provider !== undefined) {
      plan.props.provider = data.provider;
      plan.props.updatedAt = new Date();
    }
    if (data.policyNumber !== undefined) {
      plan.props.policyNumber = data.policyNumber;
      plan.props.updatedAt = new Date();
    }
    if (data.description !== undefined) {
      plan.props.description = data.description;
      plan.props.updatedAt = new Date();
    }

    return plan;
  }

  async delete(id: UniqueEntityID, _tenantId?: string): Promise<void> {
    const index = this.items.findIndex((plan) => plan.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
