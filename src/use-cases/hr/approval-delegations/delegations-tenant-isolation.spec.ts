import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ApprovalDelegation } from '@/entities/hr/approval-delegation';
import { InMemoryApprovalDelegationsRepository } from '@/repositories/hr/in-memory/in-memory-approval-delegations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetActiveDelegationUseCase } from './get-active-delegation';
import { ListDelegationsToMeUseCase } from './list-delegations-to-me';
import { ListMyDelegationsUseCase } from './list-my-delegations';
import { RevokeDelegationUseCase } from './revoke-delegation';

/**
 * Regression tests for P0 tenant-isolation leak on ApprovalDelegation queries.
 *
 * A caller authenticated in tenant B MUST NOT be able to read, list or mutate
 * delegations that live in tenant A, even when providing the correct record ID.
 */
describe('Approval Delegations — tenant isolation (P0 regression)', () => {
  let approvalDelegationsRepository: InMemoryApprovalDelegationsRepository;

  const TENANT_A = new UniqueEntityID().toString();
  const TENANT_B = new UniqueEntityID().toString();
  const DELEGATOR_ID = new UniqueEntityID();
  const DELEGATE_ID = new UniqueEntityID();

  beforeEach(() => {
    approvalDelegationsRepository = new InMemoryApprovalDelegationsRepository();
  });

  it('findById must return null when caller belongs to a different tenant', async () => {
    const delegationInTenantA = ApprovalDelegation.create({
      tenantId: new UniqueEntityID(TENANT_A),
      delegatorId: DELEGATOR_ID,
      delegateId: DELEGATE_ID,
      scope: 'ALL',
      startDate: new Date('2026-04-01'),
    });
    approvalDelegationsRepository.items.push(delegationInTenantA);

    const foundAsTenantA = await approvalDelegationsRepository.findById(
      delegationInTenantA.id,
      TENANT_A,
    );
    const foundAsTenantB = await approvalDelegationsRepository.findById(
      delegationInTenantA.id,
      TENANT_B,
    );

    expect(foundAsTenantA).not.toBeNull();
    expect(foundAsTenantB).toBeNull();
  });

  it('GetActiveDelegationUseCase must not surface delegations from another tenant', async () => {
    approvalDelegationsRepository.items.push(
      ApprovalDelegation.create({
        tenantId: new UniqueEntityID(TENANT_A),
        delegatorId: DELEGATOR_ID,
        delegateId: DELEGATE_ID,
        scope: 'ALL',
        startDate: new Date('2020-01-01'),
      }),
    );

    const useCase = new GetActiveDelegationUseCase(
      approvalDelegationsRepository,
    );

    const { delegations: crossTenantDelegations } = await useCase.execute({
      tenantId: TENANT_B,
      delegatorId: DELEGATOR_ID.toString(),
    });

    expect(crossTenantDelegations).toHaveLength(0);
  });

  it('ListMyDelegationsUseCase must not leak delegations from another tenant', async () => {
    approvalDelegationsRepository.items.push(
      ApprovalDelegation.create({
        tenantId: new UniqueEntityID(TENANT_A),
        delegatorId: DELEGATOR_ID,
        delegateId: DELEGATE_ID,
        scope: 'ALL',
        startDate: new Date('2026-04-01'),
      }),
    );

    const useCase = new ListMyDelegationsUseCase(approvalDelegationsRepository);

    const { delegations, total } = await useCase.execute({
      tenantId: TENANT_B,
      delegatorId: DELEGATOR_ID.toString(),
      page: 1,
      limit: 20,
    });

    expect(delegations).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('ListDelegationsToMeUseCase must not leak delegations from another tenant', async () => {
    approvalDelegationsRepository.items.push(
      ApprovalDelegation.create({
        tenantId: new UniqueEntityID(TENANT_A),
        delegatorId: DELEGATOR_ID,
        delegateId: DELEGATE_ID,
        scope: 'ALL',
        startDate: new Date('2026-04-01'),
      }),
    );

    const useCase = new ListDelegationsToMeUseCase(
      approvalDelegationsRepository,
    );

    const { delegations, total } = await useCase.execute({
      tenantId: TENANT_B,
      delegateId: DELEGATE_ID.toString(),
      page: 1,
      limit: 20,
    });

    expect(delegations).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('RevokeDelegationUseCase must return 404 (ResourceNotFoundError) for cross-tenant revoke attempts', async () => {
    const delegationInTenantA = ApprovalDelegation.create({
      tenantId: new UniqueEntityID(TENANT_A),
      delegatorId: DELEGATOR_ID,
      delegateId: DELEGATE_ID,
      scope: 'ALL',
      startDate: new Date('2026-04-01'),
    });
    approvalDelegationsRepository.items.push(delegationInTenantA);

    const useCase = new RevokeDelegationUseCase(approvalDelegationsRepository);

    await expect(
      useCase.execute({
        tenantId: TENANT_B,
        delegationId: delegationInTenantA.id.toString(),
        revokedBy: DELEGATOR_ID.toString(),
      }),
    ).rejects.toThrow(/not found/i);

    // The delegation in tenant A must stay untouched
    const untouched = await approvalDelegationsRepository.findById(
      delegationInTenantA.id,
      TENANT_A,
    );
    expect(untouched?.isActive).toBe(true);
  });

  it('findActiveDelegation must not return a match across tenants', async () => {
    const delegationInTenantA = ApprovalDelegation.create({
      tenantId: new UniqueEntityID(TENANT_A),
      delegatorId: DELEGATOR_ID,
      delegateId: DELEGATE_ID,
      scope: 'ALL',
      startDate: new Date('2020-01-01'),
    });
    approvalDelegationsRepository.items.push(delegationInTenantA);

    const crossTenantMatch =
      await approvalDelegationsRepository.findActiveDelegation(
        DELEGATOR_ID,
        DELEGATE_ID,
        TENANT_B,
      );

    expect(crossTenantMatch).toBeNull();
  });

  it('save must not overwrite a record belonging to another tenant', async () => {
    const delegationInTenantA = ApprovalDelegation.create({
      tenantId: new UniqueEntityID(TENANT_A),
      delegatorId: DELEGATOR_ID,
      delegateId: DELEGATE_ID,
      scope: 'ALL',
      startDate: new Date('2026-04-01'),
    });
    approvalDelegationsRepository.items.push(delegationInTenantA);

    // Craft a mutated twin that claims the same record ID but for tenant B.
    const impostorFromTenantB = ApprovalDelegation.create(
      {
        tenantId: new UniqueEntityID(TENANT_B),
        delegatorId: DELEGATOR_ID,
        delegateId: DELEGATE_ID,
        scope: 'OVERTIME',
        startDate: new Date('2026-04-01'),
        isActive: false,
      },
      delegationInTenantA.id,
    );

    await approvalDelegationsRepository.save(impostorFromTenantB);

    const stillOriginal = await approvalDelegationsRepository.findById(
      delegationInTenantA.id,
      TENANT_A,
    );
    expect(stillOriginal?.scope).toBe('ALL');
    expect(stillOriginal?.isActive).toBe(true);
  });
});
