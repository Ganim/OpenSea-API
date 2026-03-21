import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SystemSkillDefinitionsRepository } from '@/repositories/core/system-skill-definitions-repository';
import type { TenantSubscriptionsRepository } from '@/repositories/core/tenant-subscriptions-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface AddTenantSubscriptionUseCaseRequest {
  tenantId: string;
  skillCode: string;
  quantity?: number;
  customPrice?: number;
  discountPercent?: number;
  notes?: string;
  grantedBy?: string;
}

interface AddTenantSubscriptionUseCaseResponse {
  subscription: TenantSubscription;
}

export class AddTenantSubscriptionUseCase {
  constructor(
    private tenantSubscriptionsRepository: TenantSubscriptionsRepository,
    private tenantsRepository: TenantsRepository,
    private skillDefinitionsRepository: SystemSkillDefinitionsRepository,
  ) {}

  async execute({
    tenantId,
    skillCode,
    quantity,
    customPrice,
    discountPercent,
    notes,
    grantedBy,
  }: AddTenantSubscriptionUseCaseRequest): Promise<AddTenantSubscriptionUseCaseResponse> {
    const tenant = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    const skillDefinition =
      await this.skillDefinitionsRepository.findByCode(skillCode);

    if (!skillDefinition) {
      throw new ResourceNotFoundError(
        `Skill definition with code "${skillCode}" not found`,
      );
    }

    const existingSubscription =
      await this.tenantSubscriptionsRepository.findByTenantAndSkill(
        tenantId,
        skillCode,
      );

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      throw new ConflictError(
        `Tenant already has an active subscription for skill "${skillCode}"`,
      );
    }

    if (
      discountPercent !== undefined &&
      (discountPercent < 0 || discountPercent > 100)
    ) {
      throw new BadRequestError('Discount percent must be between 0 and 100');
    }

    const subscription = TenantSubscription.create({
      tenantId,
      skillCode,
      quantity,
      customPrice: customPrice ?? null,
      discountPercent: discountPercent ?? null,
      notes: notes ?? null,
      grantedBy: grantedBy ?? null,
    });

    await this.tenantSubscriptionsRepository.create(subscription);

    return { subscription };
  }
}
