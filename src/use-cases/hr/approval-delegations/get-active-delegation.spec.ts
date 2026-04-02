import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ApprovalDelegation } from '@/entities/hr/approval-delegation';
import { InMemoryApprovalDelegationsRepository } from '@/repositories/hr/in-memory/in-memory-approval-delegations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetActiveDelegationUseCase } from './get-active-delegation';

let approvalDelegationsRepository: InMemoryApprovalDelegationsRepository;
let getActiveDelegationUseCase: GetActiveDelegationUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const DELEGATOR_ID = new UniqueEntityID();
const DELEGATE_ID = new UniqueEntityID();

describe('GetActiveDelegationUseCase', () => {
  beforeEach(() => {
    approvalDelegationsRepository = new InMemoryApprovalDelegationsRepository();
    getActiveDelegationUseCase = new GetActiveDelegationUseCase(
      approvalDelegationsRepository,
    );
  });

  it('should return active effective delegations', async () => {
    const activeDelegation = ApprovalDelegation.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      delegatorId: DELEGATOR_ID,
      delegateId: DELEGATE_ID,
      scope: 'ALL',
      startDate: new Date('2020-01-01'), // past start
      endDate: new Date('2030-12-31'), // future end
    });
    approvalDelegationsRepository.items.push(activeDelegation);

    const { delegations } = await getActiveDelegationUseCase.execute({
      tenantId: TENANT_ID,
      delegatorId: DELEGATOR_ID.toString(),
    });

    expect(delegations).toHaveLength(1);
    expect(delegations[0].delegateId.equals(DELEGATE_ID)).toBe(true);
  });

  it('should exclude expired delegations', async () => {
    const expiredDelegation = ApprovalDelegation.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      delegatorId: DELEGATOR_ID,
      delegateId: DELEGATE_ID,
      scope: 'ALL',
      startDate: new Date('2020-01-01'),
      endDate: new Date('2020-12-31'), // already expired
    });
    approvalDelegationsRepository.items.push(expiredDelegation);

    const { delegations } = await getActiveDelegationUseCase.execute({
      tenantId: TENANT_ID,
      delegatorId: DELEGATOR_ID.toString(),
    });

    expect(delegations).toHaveLength(0);
  });

  it('should exclude not-yet-started delegations', async () => {
    const futureDelegation = ApprovalDelegation.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      delegatorId: DELEGATOR_ID,
      delegateId: DELEGATE_ID,
      scope: 'ALL',
      startDate: new Date('2099-01-01'), // far future
    });
    approvalDelegationsRepository.items.push(futureDelegation);

    const { delegations } = await getActiveDelegationUseCase.execute({
      tenantId: TENANT_ID,
      delegatorId: DELEGATOR_ID.toString(),
    });

    expect(delegations).toHaveLength(0);
  });

  it('should filter by scope when provided', async () => {
    approvalDelegationsRepository.items.push(
      ApprovalDelegation.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        delegatorId: DELEGATOR_ID,
        delegateId: DELEGATE_ID,
        scope: 'ABSENCES',
        startDate: new Date('2020-01-01'),
      }),
    );

    approvalDelegationsRepository.items.push(
      ApprovalDelegation.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        delegatorId: DELEGATOR_ID,
        delegateId: new UniqueEntityID(),
        scope: 'OVERTIME',
        startDate: new Date('2020-01-01'),
      }),
    );

    const { delegations } = await getActiveDelegationUseCase.execute({
      tenantId: TENANT_ID,
      delegatorId: DELEGATOR_ID.toString(),
      scope: 'ABSENCES',
    });

    expect(delegations).toHaveLength(1);
    expect(delegations[0].scope).toBe('ABSENCES');
  });

  it('should return ALL-scope delegations when filtering by specific scope', async () => {
    approvalDelegationsRepository.items.push(
      ApprovalDelegation.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        delegatorId: DELEGATOR_ID,
        delegateId: DELEGATE_ID,
        scope: 'ALL',
        startDate: new Date('2020-01-01'),
      }),
    );

    const { delegations } = await getActiveDelegationUseCase.execute({
      tenantId: TENANT_ID,
      delegatorId: DELEGATOR_ID.toString(),
      scope: 'VACATIONS',
    });

    expect(delegations).toHaveLength(1);
  });
});
