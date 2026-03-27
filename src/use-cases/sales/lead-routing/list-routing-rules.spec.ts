import { InMemoryLeadRoutingRulesRepository } from '@/repositories/sales/in-memory/in-memory-lead-routing-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListRoutingRulesUseCase } from './list-routing-rules';

let leadRoutingRulesRepository: InMemoryLeadRoutingRulesRepository;
let sut: ListRoutingRulesUseCase;

describe('List Routing Rules Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    leadRoutingRulesRepository = new InMemoryLeadRoutingRulesRepository();
    sut = new ListRoutingRulesUseCase(leadRoutingRulesRepository);
  });

  it('should list routing rules with pagination', async () => {
    for (let i = 0; i < 25; i++) {
      await leadRoutingRulesRepository.create({
        tenantId: TENANT_ID,
        name: `Rule ${i + 1}`,
        strategy: 'ROUND_ROBIN',
        assignToUsers: ['user-1'],
      });
    }

    const { routingRules } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 10,
    });

    expect(routingRules.data).toHaveLength(10);
    expect(routingRules.total).toBe(25);
    expect(routingRules.totalPages).toBe(3);
  });

  it('should filter by strategy', async () => {
    await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Round Robin',
      strategy: 'ROUND_ROBIN',
      assignToUsers: ['user-1'],
    });
    await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Territory',
      strategy: 'TERRITORY',
    });

    const { routingRules } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      strategy: 'ROUND_ROBIN',
    });

    expect(routingRules.data).toHaveLength(1);
    expect(routingRules.data[0].strategy).toBe('ROUND_ROBIN');
  });

  it('should filter by search term', async () => {
    await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'North Region',
      strategy: 'TERRITORY',
    });
    await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'South Region',
      strategy: 'TERRITORY',
    });

    const { routingRules } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      search: 'North',
    });

    expect(routingRules.data).toHaveLength(1);
    expect(routingRules.data[0].name).toBe('North Region');
  });

  it('should filter by isActive', async () => {
    await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Active Rule',
      strategy: 'ROUND_ROBIN',
      assignToUsers: ['user-1'],
      isActive: true,
    });
    await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Inactive Rule',
      strategy: 'ROUND_ROBIN',
      assignToUsers: ['user-1'],
      isActive: false,
    });

    const { routingRules } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      isActive: true,
    });

    expect(routingRules.data).toHaveLength(1);
    expect(routingRules.data[0].name).toBe('Active Rule');
  });
});
