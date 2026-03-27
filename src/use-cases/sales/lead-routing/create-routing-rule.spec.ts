import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryLeadRoutingRulesRepository } from '@/repositories/sales/in-memory/in-memory-lead-routing-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateRoutingRuleUseCase } from './create-routing-rule';

let leadRoutingRulesRepository: InMemoryLeadRoutingRulesRepository;
let sut: CreateRoutingRuleUseCase;

describe('Create Routing Rule Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    leadRoutingRulesRepository = new InMemoryLeadRoutingRulesRepository();
    sut = new CreateRoutingRuleUseCase(leadRoutingRulesRepository);
  });

  it('should create a routing rule with ROUND_ROBIN strategy', async () => {
    const { routingRule } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Round Robin Rule',
      strategy: 'ROUND_ROBIN',
      assignToUsers: ['user-1', 'user-2', 'user-3'],
    });

    expect(routingRule.id.toString()).toEqual(expect.any(String));
    expect(routingRule.name).toBe('Round Robin Rule');
    expect(routingRule.strategy).toBe('ROUND_ROBIN');
    expect(routingRule.assignToUsers).toHaveLength(3);
    expect(routingRule.isActive).toBe(true);
  });

  it('should create a routing rule with TERRITORY strategy', async () => {
    const { routingRule } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Territory Rule',
      strategy: 'TERRITORY',
      config: {
        territories: [
          { userId: 'user-1', states: ['SP', 'RJ'] },
          { userId: 'user-2', states: ['MG', 'ES'] },
        ],
      },
    });

    expect(routingRule.strategy).toBe('TERRITORY');
    expect(routingRule.config).toHaveProperty('territories');
  });

  it('should not create a routing rule with empty name', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        name: '',
        strategy: 'ROUND_ROBIN',
        assignToUsers: ['user-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create ROUND_ROBIN rule without assignToUsers', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Invalid Round Robin',
        strategy: 'ROUND_ROBIN',
        assignToUsers: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create LOAD_BALANCE rule without assignToUsers', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Invalid Load Balance',
        strategy: 'LOAD_BALANCE',
        assignToUsers: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should create a rule with maxLeadsPerUser', async () => {
    const { routingRule } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Limited Load Balance',
      strategy: 'LOAD_BALANCE',
      assignToUsers: ['user-1', 'user-2'],
      maxLeadsPerUser: 10,
    });

    expect(routingRule.maxLeadsPerUser).toBe(10);
  });

  it('should create a rule with isActive false', async () => {
    const { routingRule } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Inactive Rule',
      strategy: 'SEGMENT',
      isActive: false,
    });

    expect(routingRule.isActive).toBe(false);
  });
});
