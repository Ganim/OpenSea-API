import type { SystemSkillDefinitionsRepository } from '@/repositories/core/system-skill-definitions-repository';
import type { TenantSubscriptionsRepository } from '@/repositories/core/tenant-subscriptions-repository';
import { TenantSubscription } from '@/entities/core/tenant-subscription';

export class SkillDependencyService {
  constructor(
    private skillDefinitionsRepository: SystemSkillDefinitionsRepository,
    private tenantSubscriptionsRepository: TenantSubscriptionsRepository,
  ) {}

  /**
   * When enabling a skill, find and return all parent skills that must also be enabled.
   * Returns parent codes ordered from immediate parent to root ancestor.
   */
  async getRequiredParents(skillCode: string): Promise<string[]> {
    const parentCodes: string[] = [];
    let currentCode = skillCode;

    while (true) {
      const skillDefinition =
        await this.skillDefinitionsRepository.findByCode(currentCode);

      if (!skillDefinition || !skillDefinition.parentSkillCode) {
        break;
      }

      parentCodes.push(skillDefinition.parentSkillCode);
      currentCode = skillDefinition.parentSkillCode;
    }

    return parentCodes;
  }

  /**
   * When disabling a skill, find and return all child skills that would be disabled.
   * Returns all descendant codes recursively (does NOT include the skill itself).
   */
  async getAffectedSkillsOnDisable(skillCode: string): Promise<string[]> {
    const affectedCodes: string[] = [];

    const collectChildren = async (parentCode: string): Promise<void> => {
      const childSkills =
        await this.skillDefinitionsRepository.findByParentSkillCode(parentCode);

      for (const child of childSkills) {
        affectedCodes.push(child.code);
        await collectChildren(child.code);
      }
    };

    await collectChildren(skillCode);

    return affectedCodes;
  }

  /**
   * Enable a skill and auto-enable all required parent skills for a tenant.
   * Skips creating subscriptions for skills already enabled.
   * Returns the list of all skill codes that were actually enabled (new subscriptions only).
   */
  async enableSkillWithDependencies(
    tenantId: string,
    skillCode: string,
  ): Promise<string[]> {
    const parentCodes = await this.getRequiredParents(skillCode);
    const allSkillCodes = [skillCode, ...parentCodes];

    const enabledSkillCodes: string[] = [];

    for (const code of allSkillCodes) {
      const existingSubscription =
        await this.tenantSubscriptionsRepository.findByTenantAndSkill(
          tenantId,
          code,
        );

      if (existingSubscription) {
        continue;
      }

      const subscription = TenantSubscription.create({
        tenantId,
        skillCode: code,
      });

      await this.tenantSubscriptionsRepository.create(subscription);
      enabledSkillCodes.push(code);
    }

    return enabledSkillCodes;
  }

  /**
   * Disable a skill and auto-disable all dependent child skills for a tenant.
   * Returns the list of all skill codes that were actually disabled (subscriptions removed).
   */
  async disableSkillWithDependents(
    tenantId: string,
    skillCode: string,
  ): Promise<string[]> {
    const childCodes = await this.getAffectedSkillsOnDisable(skillCode);
    const allSkillCodes = [skillCode, ...childCodes];

    const disabledSkillCodes: string[] = [];

    for (const code of allSkillCodes) {
      const subscription =
        await this.tenantSubscriptionsRepository.findByTenantAndSkill(
          tenantId,
          code,
        );

      if (!subscription) {
        continue;
      }

      await this.tenantSubscriptionsRepository.delete(
        subscription.id.toString(),
      );
      disabledSkillCodes.push(code);
    }

    return disabledSkillCodes;
  }
}
