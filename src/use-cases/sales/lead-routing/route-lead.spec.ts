import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Deal } from '@/entities/sales/deal';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { InMemoryLeadRoutingRulesRepository } from '@/repositories/sales/in-memory/in-memory-lead-routing-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RouteLeadUseCase } from './route-lead';

let leadRoutingRulesRepository: InMemoryLeadRoutingRulesRepository;
let customersRepository: InMemoryCustomersRepository;
let dealsRepository: InMemoryDealsRepository;
let sut: RouteLeadUseCase;

describe('Route Lead Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    leadRoutingRulesRepository = new InMemoryLeadRoutingRulesRepository();
    customersRepository = new InMemoryCustomersRepository();
    dealsRepository = new InMemoryDealsRepository();
    sut = new RouteLeadUseCase(
      leadRoutingRulesRepository,
      customersRepository,
      dealsRepository,
    );
  });

  it('should throw if customer does not exist', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        customerId: 'non-existent',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if no active routing rules exist', async () => {
    const customer = await customersRepository.create({
      tenantId: TENANT_ID,
      name: 'Test Customer',
      type: CustomerType.INDIVIDUAL(),
      state: 'SP',
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        customerId: customer.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should route via ROUND_ROBIN strategy', async () => {
    const customer = await customersRepository.create({
      tenantId: TENANT_ID,
      name: 'Test Customer',
      type: CustomerType.INDIVIDUAL(),
    });

    await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Round Robin',
      strategy: 'ROUND_ROBIN',
      assignToUsers: ['user-A', 'user-B', 'user-C'],
    });

    const firstAssignment = await sut.execute({
      tenantId: TENANT_ID,
      customerId: customer.id.toString(),
    });
    expect(firstAssignment.assignedToUserId).toBe('user-A');
    expect(firstAssignment.strategy).toBe('ROUND_ROBIN');

    const secondAssignment = await sut.execute({
      tenantId: TENANT_ID,
      customerId: customer.id.toString(),
    });
    expect(secondAssignment.assignedToUserId).toBe('user-B');

    const thirdAssignment = await sut.execute({
      tenantId: TENANT_ID,
      customerId: customer.id.toString(),
    });
    expect(thirdAssignment.assignedToUserId).toBe('user-C');

    // Wraps around
    const fourthAssignment = await sut.execute({
      tenantId: TENANT_ID,
      customerId: customer.id.toString(),
    });
    expect(fourthAssignment.assignedToUserId).toBe('user-A');
  });

  it('should route via TERRITORY strategy matching state', async () => {
    const customer = await customersRepository.create({
      tenantId: TENANT_ID,
      name: 'SP Customer',
      type: CustomerType.BUSINESS(),
      state: 'SP',
      city: 'Campinas',
    });

    await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Territory',
      strategy: 'TERRITORY',
      config: {
        territories: [
          { userId: 'user-south', states: ['RS', 'SC', 'PR'] },
          { userId: 'user-southeast', states: ['SP', 'RJ', 'MG', 'ES'] },
        ],
      },
    });

    const assignment = await sut.execute({
      tenantId: TENANT_ID,
      customerId: customer.id.toString(),
    });

    expect(assignment.assignedToUserId).toBe('user-southeast');
    expect(assignment.strategy).toBe('TERRITORY');
  });

  it('should route via SEGMENT strategy matching customer type', async () => {
    const customer = await customersRepository.create({
      tenantId: TENANT_ID,
      name: 'Enterprise Corp',
      type: CustomerType.BUSINESS(),
    });

    await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Segment',
      strategy: 'SEGMENT',
      config: {
        segments: [
          { userId: 'user-individual', customerTypes: ['INDIVIDUAL'] },
          { userId: 'user-business', customerTypes: ['BUSINESS'] },
        ],
      },
    });

    const assignment = await sut.execute({
      tenantId: TENANT_ID,
      customerId: customer.id.toString(),
    });

    expect(assignment.assignedToUserId).toBe('user-business');
    expect(assignment.strategy).toBe('SEGMENT');
  });

  it('should route via LOAD_BALANCE strategy to user with fewest deals', async () => {
    const customer = await customersRepository.create({
      tenantId: TENANT_ID,
      name: 'New Lead',
      type: CustomerType.INDIVIDUAL(),
    });

    await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Load Balance',
      strategy: 'LOAD_BALANCE',
      assignToUsers: ['user-busy', 'user-free'],
    });

    // Create 5 open deals for user-busy
    for (let i = 0; i < 5; i++) {
      await dealsRepository.create(
        Deal.create({
          tenantId: new UniqueEntityID(TENANT_ID),
          title: `Deal ${i}`,
          customerId: customer.id,
          pipelineId: new UniqueEntityID('pipeline-1'),
          stageId: new UniqueEntityID('stage-1'),
          status: 'OPEN',
          assignedToUserId: new UniqueEntityID('user-busy'),
        }),
      );
    }

    // Create 1 open deal for user-free
    await dealsRepository.create(
      Deal.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        title: 'Deal Free',
        customerId: customer.id,
        pipelineId: new UniqueEntityID('pipeline-1'),
        stageId: new UniqueEntityID('stage-1'),
        status: 'OPEN',
        assignedToUserId: new UniqueEntityID('user-free'),
      }),
    );

    const assignment = await sut.execute({
      tenantId: TENANT_ID,
      customerId: customer.id.toString(),
    });

    expect(assignment.assignedToUserId).toBe('user-free');
    expect(assignment.strategy).toBe('LOAD_BALANCE');
  });

  it('should respect maxLeadsPerUser in LOAD_BALANCE', async () => {
    const customer = await customersRepository.create({
      tenantId: TENANT_ID,
      name: 'New Lead',
      type: CustomerType.INDIVIDUAL(),
    });

    await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Limited Load Balance',
      strategy: 'LOAD_BALANCE',
      assignToUsers: ['user-full', 'user-available'],
      maxLeadsPerUser: 3,
    });

    // user-full has 3 deals (at max)
    for (let i = 0; i < 3; i++) {
      await dealsRepository.create(
        Deal.create({
          tenantId: new UniqueEntityID(TENANT_ID),
          title: `Deal ${i}`,
          customerId: customer.id,
          pipelineId: new UniqueEntityID('pipeline-1'),
          stageId: new UniqueEntityID('stage-1'),
          status: 'OPEN',
          assignedToUserId: new UniqueEntityID('user-full'),
        }),
      );
    }

    // user-available has 2 deals (below max)
    for (let i = 0; i < 2; i++) {
      await dealsRepository.create(
        Deal.create({
          tenantId: new UniqueEntityID(TENANT_ID),
          title: `Deal Available ${i}`,
          customerId: customer.id,
          pipelineId: new UniqueEntityID('pipeline-1'),
          stageId: new UniqueEntityID('stage-1'),
          status: 'OPEN',
          assignedToUserId: new UniqueEntityID('user-available'),
        }),
      );
    }

    const assignment = await sut.execute({
      tenantId: TENANT_ID,
      customerId: customer.id.toString(),
    });

    expect(assignment.assignedToUserId).toBe('user-available');
  });

  it('should skip non-matching territory rule and match the next active rule', async () => {
    const customer = await customersRepository.create({
      tenantId: TENANT_ID,
      name: 'BA Customer',
      type: CustomerType.INDIVIDUAL(),
      state: 'BA',
    });

    // First rule: territory that doesn't match BA
    await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'South Only',
      strategy: 'TERRITORY',
      config: {
        territories: [{ userId: 'user-south', states: ['RS', 'SC', 'PR'] }],
      },
    });

    // Second rule: round robin fallback
    await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Fallback Round Robin',
      strategy: 'ROUND_ROBIN',
      assignToUsers: ['user-fallback'],
    });

    const assignment = await sut.execute({
      tenantId: TENANT_ID,
      customerId: customer.id.toString(),
    });

    expect(assignment.assignedToUserId).toBe('user-fallback');
    expect(assignment.routingRuleName).toBe('Fallback Round Robin');
  });
});
