import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryLeadRoutingRulesRepository } from '@/repositories/sales/in-memory/in-memory-lead-routing-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateRoutingRuleUseCase } from './update-routing-rule';

let leadRoutingRulesRepository: InMemoryLeadRoutingRulesRepository;
let sut: UpdateRoutingRuleUseCase;

describe('Update Routing Rule Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    leadRoutingRulesRepository = new InMemoryLeadRoutingRulesRepository();
    sut = new UpdateRoutingRuleUseCase(leadRoutingRulesRepository);
  });

  it('should update a routing rule name', async () => {
    const created = await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Original Name',
      strategy: 'ROUND_ROBIN',
      assignToUsers: ['user-1'],
    });

    const { routingRule } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      name: 'Updated Name',
    });

    expect(routingRule.name).toBe('Updated Name');
  });

  it('should update strategy and config', async () => {
    const created = await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Rule',
      strategy: 'ROUND_ROBIN',
      assignToUsers: ['user-1'],
    });

    const { routingRule } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      strategy: 'TERRITORY',
      config: {
        territories: [{ userId: 'user-1', states: ['SP'] }],
      },
    });

    expect(routingRule.strategy).toBe('TERRITORY');
    expect(routingRule.config).toHaveProperty('territories');
  });

  it('should throw if routing rule does not exist', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        name: 'Updated',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should toggle isActive', async () => {
    const created = await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Active Rule',
      strategy: 'SEGMENT',
      isActive: true,
    });

    const { routingRule } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      isActive: false,
    });

    expect(routingRule.isActive).toBe(false);
  });
});
