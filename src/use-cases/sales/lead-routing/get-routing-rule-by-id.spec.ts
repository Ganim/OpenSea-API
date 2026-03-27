import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryLeadRoutingRulesRepository } from '@/repositories/sales/in-memory/in-memory-lead-routing-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetRoutingRuleByIdUseCase } from './get-routing-rule-by-id';

let leadRoutingRulesRepository: InMemoryLeadRoutingRulesRepository;
let sut: GetRoutingRuleByIdUseCase;

describe('Get Routing Rule By Id Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    leadRoutingRulesRepository = new InMemoryLeadRoutingRulesRepository();
    sut = new GetRoutingRuleByIdUseCase(leadRoutingRulesRepository);
  });

  it('should return a routing rule by id', async () => {
    const created = await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Test Rule',
      strategy: 'ROUND_ROBIN',
      assignToUsers: ['user-1'],
    });

    const { routingRule } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
    });

    expect(routingRule.name).toBe('Test Rule');
    expect(routingRule.strategy).toBe('ROUND_ROBIN');
  });

  it('should throw if routing rule does not exist', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
