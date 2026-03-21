import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import type { SkillPricingRepository } from '@/repositories/core/skill-pricing-repository';
import type { SystemSkillDefinitionsRepository } from '@/repositories/core/system-skill-definitions-repository';
import type { TenantSubscriptionsRepository } from '@/repositories/core/tenant-subscriptions-repository';
import type { SkillDependencyService } from '@/services/core/skill-dependency-service';

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
  enabledSkills: string[];
}

export class AddTenantSubscriptionUseCase {
  constructor(
    private skillDefinitionsRepository: SystemSkillDefinitionsRepository,
    private tenantSubscriptionsRepository: TenantSubscriptionsRepository,
    private skillPricingRepository: SkillPricingRepository,
    private skillDependencyService: SkillDependencyService,
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

    const enabledSkillCodes =
      await this.skillDependencyService.enableSkillWithDependencies(
        tenantId,
        skillCode,
      );

    // Apply custom pricing/discount/notes to the primary subscription
    if (
      quantity !== undefined ||
      customPrice !== undefined ||
      discountPercent !== undefined ||
      notes !== undefined ||
      grantedBy !== undefined
    ) {
      const primarySubscription =
        await this.tenantSubscriptionsRepository.findByTenantAndSkill(
          tenantId,
          skillCode,
        );

      if (primarySubscription) {
        if (quantity !== undefined) primarySubscription.quantity = quantity;
        if (customPrice !== undefined)
          primarySubscription.customPrice = customPrice;
        if (discountPercent !== undefined)
          primarySubscription.discountPercent = discountPercent;
        if (notes !== undefined) primarySubscription.notes = notes;
        if (grantedBy !== undefined) {
          primarySubscription.metadata = {
            ...primarySubscription.metadata,
            grantedBy,
          };
        }

        await this.tenantSubscriptionsRepository.save(primarySubscription);
      }
    }

    return { enabledSkills: enabledSkillCodes };
  }
}
