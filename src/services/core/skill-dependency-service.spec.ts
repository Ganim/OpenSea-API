import { describe, it, expect, beforeEach } from 'vitest';

import { SystemSkillDefinition } from '@/entities/core/system-skill-definition';
import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { InMemorySystemSkillDefinitionsRepository } from '@/repositories/core/in-memory/in-memory-system-skill-definitions-repository';
import { InMemoryTenantSubscriptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-subscriptions-repository';

import { SkillDependencyService } from './skill-dependency-service';

let skillDefinitionsRepository: InMemorySystemSkillDefinitionsRepository;
let tenantSubscriptionsRepository: InMemoryTenantSubscriptionsRepository;
let sut: SkillDependencyService;

const TEST_TENANT_ID = 'tenant-001';

function createSkillDefinition(
  code: string,
  name: string,
  category: string,
  parentSkillCode?: string,
): SystemSkillDefinition {
  return SystemSkillDefinition.create({
    code,
    name,
    category,
    parentSkillCode: parentSkillCode ?? null,
  });
}

async function seedSkillTree(
  repository: InMemorySystemSkillDefinitionsRepository,
): Promise<void> {
  const skills = [
    createSkillDefinition('sales.crm', 'CRM', 'sales'),
    createSkillDefinition('sales.inbox', 'Inbox', 'sales', 'sales.crm'),
    createSkillDefinition(
      'sales.inbox.whatsapp',
      'WhatsApp',
      'sales',
      'sales.inbox',
    ),
    createSkillDefinition(
      'sales.inbox.instagram',
      'Instagram',
      'sales',
      'sales.inbox',
    ),
    createSkillDefinition('sales.inbox.email', 'Email', 'sales', 'sales.inbox'),
    createSkillDefinition(
      'sales.automations',
      'Automations',
      'sales',
      'sales.crm',
    ),
    createSkillDefinition(
      'sales.automations.ai',
      'AI Automations',
      'sales',
      'sales.automations',
    ),
    createSkillDefinition('sales.ai', 'AI', 'sales', 'sales.crm'),
    createSkillDefinition('stock.warehouses', 'Warehouses', 'stock'),
  ];

  for (const skill of skills) {
    await repository.create(skill);
  }
}

describe('SkillDependencyService', () => {
  beforeEach(async () => {
    skillDefinitionsRepository = new InMemorySystemSkillDefinitionsRepository();
    tenantSubscriptionsRepository = new InMemoryTenantSubscriptionsRepository();
    sut = new SkillDependencyService(
      skillDefinitionsRepository,
      tenantSubscriptionsRepository,
    );

    await seedSkillTree(skillDefinitionsRepository);
  });

  describe('getRequiredParents', () => {
    it('should return all parent codes for a deeply nested skill', async () => {
      const parentCodes = await sut.getRequiredParents('sales.inbox.whatsapp');

      expect(parentCodes).toEqual(['sales.inbox', 'sales.crm']);
    });

    it('should return empty array for a root skill with no parent', async () => {
      const parentCodes = await sut.getRequiredParents('sales.crm');

      expect(parentCodes).toEqual([]);
    });

    it('should return single parent for a first-level child', async () => {
      const parentCodes = await sut.getRequiredParents('sales.inbox');

      expect(parentCodes).toEqual(['sales.crm']);
    });

    it('should return empty array for a standalone skill', async () => {
      const parentCodes = await sut.getRequiredParents('stock.warehouses');

      expect(parentCodes).toEqual([]);
    });
  });

  describe('getAffectedSkillsOnDisable', () => {
    it('should return all direct children of a skill', async () => {
      const affectedCodes = await sut.getAffectedSkillsOnDisable('sales.inbox');

      expect(affectedCodes).toEqual(
        expect.arrayContaining([
          'sales.inbox.whatsapp',
          'sales.inbox.instagram',
          'sales.inbox.email',
        ]),
      );
      expect(affectedCodes).toHaveLength(3);
    });

    it('should return all descendants recursively when disabling a root skill', async () => {
      const affectedCodes = await sut.getAffectedSkillsOnDisable('sales.crm');

      expect(affectedCodes).toEqual(
        expect.arrayContaining([
          'sales.inbox',
          'sales.inbox.whatsapp',
          'sales.inbox.instagram',
          'sales.inbox.email',
          'sales.automations',
          'sales.automations.ai',
          'sales.ai',
        ]),
      );
      expect(affectedCodes).toHaveLength(7);
    });

    it('should return empty array for a leaf skill with no children', async () => {
      const affectedCodes =
        await sut.getAffectedSkillsOnDisable('stock.warehouses');

      expect(affectedCodes).toEqual([]);
    });

    it('should return empty array for a leaf skill in the sales tree', async () => {
      const affectedCodes = await sut.getAffectedSkillsOnDisable(
        'sales.inbox.whatsapp',
      );

      expect(affectedCodes).toEqual([]);
    });
  });

  describe('enableSkillWithDependencies', () => {
    it('should create subscriptions for the skill and all required parents', async () => {
      const enabledCodes = await sut.enableSkillWithDependencies(
        TEST_TENANT_ID,
        'sales.inbox.whatsapp',
      );

      expect(enabledCodes).toEqual(
        expect.arrayContaining([
          'sales.inbox.whatsapp',
          'sales.inbox',
          'sales.crm',
        ]),
      );
      expect(enabledCodes).toHaveLength(3);

      const whatsappSubscription =
        await tenantSubscriptionsRepository.findByTenantAndSkill(
          TEST_TENANT_ID,
          'sales.inbox.whatsapp',
        );
      const inboxSubscription =
        await tenantSubscriptionsRepository.findByTenantAndSkill(
          TEST_TENANT_ID,
          'sales.inbox',
        );
      const crmSubscription =
        await tenantSubscriptionsRepository.findByTenantAndSkill(
          TEST_TENANT_ID,
          'sales.crm',
        );

      expect(whatsappSubscription).not.toBeNull();
      expect(inboxSubscription).not.toBeNull();
      expect(crmSubscription).not.toBeNull();
    });

    it('should not create duplicate subscriptions for already-enabled parents', async () => {
      // Pre-enable sales.crm and sales.inbox
      const crmSubscription = TenantSubscription.create({
        tenantId: TEST_TENANT_ID,
        skillCode: 'sales.crm',
      });
      await tenantSubscriptionsRepository.create(crmSubscription);

      const inboxSubscription = TenantSubscription.create({
        tenantId: TEST_TENANT_ID,
        skillCode: 'sales.inbox',
      });
      await tenantSubscriptionsRepository.create(inboxSubscription);

      const enabledCodes = await sut.enableSkillWithDependencies(
        TEST_TENANT_ID,
        'sales.inbox.whatsapp',
      );

      // Only whatsapp should be newly enabled
      expect(enabledCodes).toEqual(['sales.inbox.whatsapp']);

      // Total subscriptions should be 3 (crm + inbox + whatsapp)
      const allSubscriptions =
        await tenantSubscriptionsRepository.findByTenantId(TEST_TENANT_ID);
      expect(allSubscriptions).toHaveLength(3);
    });

    it('should enable a standalone skill without creating parent subscriptions', async () => {
      const enabledCodes = await sut.enableSkillWithDependencies(
        TEST_TENANT_ID,
        'stock.warehouses',
      );

      expect(enabledCodes).toEqual(['stock.warehouses']);

      const allSubscriptions =
        await tenantSubscriptionsRepository.findByTenantId(TEST_TENANT_ID);
      expect(allSubscriptions).toHaveLength(1);
    });
  });

  describe('disableSkillWithDependents', () => {
    it('should remove subscriptions for the skill and all dependent children', async () => {
      // Pre-enable the full inbox branch
      for (const code of [
        'sales.crm',
        'sales.inbox',
        'sales.inbox.whatsapp',
        'sales.inbox.instagram',
        'sales.inbox.email',
        'sales.automations',
      ]) {
        await tenantSubscriptionsRepository.create(
          TenantSubscription.create({
            tenantId: TEST_TENANT_ID,
            skillCode: code,
          }),
        );
      }

      const disabledCodes = await sut.disableSkillWithDependents(
        TEST_TENANT_ID,
        'sales.inbox',
      );

      expect(disabledCodes).toEqual(
        expect.arrayContaining([
          'sales.inbox',
          'sales.inbox.whatsapp',
          'sales.inbox.instagram',
          'sales.inbox.email',
        ]),
      );
      expect(disabledCodes).toHaveLength(4);

      // Verify subscriptions were actually removed
      const inboxSubscription =
        await tenantSubscriptionsRepository.findByTenantAndSkill(
          TEST_TENANT_ID,
          'sales.inbox',
        );
      expect(inboxSubscription).toBeNull();

      const whatsappSubscription =
        await tenantSubscriptionsRepository.findByTenantAndSkill(
          TEST_TENANT_ID,
          'sales.inbox.whatsapp',
        );
      expect(whatsappSubscription).toBeNull();
    });

    it('should not touch unrelated subscriptions when disabling a skill', async () => {
      // Pre-enable inbox branch + automations
      for (const code of [
        'sales.crm',
        'sales.inbox',
        'sales.inbox.whatsapp',
        'sales.automations',
      ]) {
        await tenantSubscriptionsRepository.create(
          TenantSubscription.create({
            tenantId: TEST_TENANT_ID,
            skillCode: code,
          }),
        );
      }

      await sut.disableSkillWithDependents(TEST_TENANT_ID, 'sales.inbox');

      // sales.crm and sales.automations should remain
      const crmSubscription =
        await tenantSubscriptionsRepository.findByTenantAndSkill(
          TEST_TENANT_ID,
          'sales.crm',
        );
      expect(crmSubscription).not.toBeNull();

      const automationsSubscription =
        await tenantSubscriptionsRepository.findByTenantAndSkill(
          TEST_TENANT_ID,
          'sales.automations',
        );
      expect(automationsSubscription).not.toBeNull();

      // Only crm and automations should remain
      const remainingSubscriptions =
        await tenantSubscriptionsRepository.findByTenantId(TEST_TENANT_ID);
      expect(remainingSubscriptions).toHaveLength(2);
    });

    it('should handle disabling a leaf skill with no children', async () => {
      await tenantSubscriptionsRepository.create(
        TenantSubscription.create({
          tenantId: TEST_TENANT_ID,
          skillCode: 'stock.warehouses',
        }),
      );

      const disabledCodes = await sut.disableSkillWithDependents(
        TEST_TENANT_ID,
        'stock.warehouses',
      );

      expect(disabledCodes).toEqual(['stock.warehouses']);

      const allSubscriptions =
        await tenantSubscriptionsRepository.findByTenantId(TEST_TENANT_ID);
      expect(allSubscriptions).toHaveLength(0);
    });

    it('should return empty array when disabling a skill with no subscription', async () => {
      const disabledCodes = await sut.disableSkillWithDependents(
        TEST_TENANT_ID,
        'sales.crm',
      );

      expect(disabledCodes).toEqual([]);
    });
  });
});
