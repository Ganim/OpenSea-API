import { Plan } from '@/entities/core/plan';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CreatePlanSchema,
  PlansRepository,
  UpdatePlanSchema,
} from '../plans-repository';

export class InMemoryPlansRepository implements PlansRepository {
  public items: Plan[] = [];

  async create(data: CreatePlanSchema): Promise<Plan> {
    const plan = Plan.create({
      name: data.name,
      tier: data.tier as
        | 'FREE'
        | 'STARTER'
        | 'PROFESSIONAL'
        | 'ENTERPRISE'
        | undefined,
      description: data.description ?? null,
      price: data.price,
      isActive: data.isActive,
      maxUsers: data.maxUsers,
      maxWarehouses: data.maxWarehouses,
      maxProducts: data.maxProducts,
    });

    this.items.push(plan);

    return plan;
  }

  async update(data: UpdatePlanSchema): Promise<Plan | null> {
    const plan = this.items.find((item) => item.id.equals(data.id));
    if (!plan) return null;

    if (data.name !== undefined) plan.name = data.name;
    if (data.tier !== undefined)
      plan.tier = data.tier as
        | 'FREE'
        | 'STARTER'
        | 'PROFESSIONAL'
        | 'ENTERPRISE';
    if (data.description !== undefined) plan.description = data.description;
    if (data.price !== undefined) plan.price = data.price;
    if (data.isActive !== undefined) plan.isActive = data.isActive;
    if (data.maxUsers !== undefined) plan.maxUsers = data.maxUsers;
    if (data.maxWarehouses !== undefined)
      plan.maxWarehouses = data.maxWarehouses;
    if (data.maxProducts !== undefined) plan.maxProducts = data.maxProducts;

    return plan;
  }

  async findById(id: UniqueEntityID): Promise<Plan | null> {
    const plan = this.items.find((item) => item.id.equals(id));

    return plan ?? null;
  }

  async findByName(name: string): Promise<Plan | null> {
    const plan = this.items.find((item) => item.name === name);

    return plan ?? null;
  }

  async findMany(): Promise<Plan[]> {
    return [...this.items];
  }
}
