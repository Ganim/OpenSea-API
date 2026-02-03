import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type TenantPlanDTO,
  tenantPlanToDTO,
} from '@/mappers/core/tenant/tenant-plan-to-dto';
import type { PlansRepository } from '@/repositories/core/plans-repository';
import type { TenantPlansRepository } from '@/repositories/core/tenant-plans-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface ChangeTenantPlanUseCaseRequest {
  tenantId: string;
  planId: string;
}

interface ChangeTenantPlanUseCaseResponse {
  tenantPlan: TenantPlanDTO;
}

export class ChangeTenantPlanUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private plansRepository: PlansRepository,
    private tenantPlansRepository: TenantPlansRepository,
  ) {}

  async execute({
    tenantId,
    planId,
  }: ChangeTenantPlanUseCaseRequest): Promise<ChangeTenantPlanUseCaseResponse> {
    const tenant = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    const plan = await this.plansRepository.findById(
      new UniqueEntityID(planId),
    );

    if (!plan) {
      throw new ResourceNotFoundError('Plan not found');
    }

    let tenantPlan = await this.tenantPlansRepository.updatePlan(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(planId),
    );

    if (!tenantPlan) {
      tenantPlan = await this.tenantPlansRepository.create({
        tenantId: new UniqueEntityID(tenantId),
        planId: new UniqueEntityID(planId),
      });
    }

    return { tenantPlan: tenantPlanToDTO(tenantPlan) };
  }
}
