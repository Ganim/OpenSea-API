import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { SystemSkillDefinitionsRepository } from '@/repositories/core/system-skill-definitions-repository';
import type { TenantSubscriptionsRepository } from '@/repositories/core/tenant-subscriptions-repository';
import type { SkillDependencyService } from '@/services/core/skill-dependency-service';

interface RemoveTenantSubscriptionUseCaseRequest {
  tenantId: string;
  skillCode: string;
}

interface RemoveTenantSubscriptionUseCaseResponse {
  disabledSkills: string[];
}

export class RemoveTenantSubscriptionUseCase {
  constructor(
    private skillDefinitionsRepository: SystemSkillDefinitionsRepository,
    private tenantSubscriptionsRepository: TenantSubscriptionsRepository,
    private skillDependencyService: SkillDependencyService,
  ) {}

  async execute({
    tenantId,
    skillCode,
  }: RemoveTenantSubscriptionUseCaseRequest): Promise<RemoveTenantSubscriptionUseCaseResponse> {
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

    if (!existingSubscription) {
      throw new ResourceNotFoundError(
        `Tenant does not have a subscription for skill "${skillCode}"`,
      );
    }

    const disabledSkillCodes =
      await this.skillDependencyService.disableSkillWithDependents(
        tenantId,
        skillCode,
      );

    return { disabledSkills: disabledSkillCodes };
  }
}
