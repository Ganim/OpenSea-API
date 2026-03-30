import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ApprovalDelegation } from '@/entities/hr/approval-delegation';
import { InMemoryApprovalDelegationsRepository } from '@/repositories/hr/in-memory/in-memory-approval-delegations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListMyDelegationsUseCase } from './list-my-delegations';

let approvalDelegationsRepository: InMemoryApprovalDelegationsRepository;
let listMyDelegationsUseCase: ListMyDelegationsUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const DELEGATOR_ID = new UniqueEntityID();

describe('ListMyDelegationsUseCase', () => {
  beforeEach(() => {
    approvalDelegationsRepository =
      new InMemoryApprovalDelegationsRepository();
    listMyDelegationsUseCase = new ListMyDelegationsUseCase(
      approvalDelegationsRepository,
    );
  });

  it('should list delegations created by the delegator', async () => {
    const delegateIdA = new UniqueEntityID();
    const delegateIdB = new UniqueEntityID();

    approvalDelegationsRepository.items.push(
      ApprovalDelegation.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        delegatorId: DELEGATOR_ID,
        delegateId: delegateIdA,
        scope: 'ALL',
        startDate: new Date('2026-04-01'),
      }),
    );

    approvalDelegationsRepository.items.push(
      ApprovalDelegation.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        delegatorId: DELEGATOR_ID,
        delegateId: delegateIdB,
        scope: 'ABSENCES',
        startDate: new Date('2026-04-01'),
      }),
    );

    const { delegations, total } = await listMyDelegationsUseCase.execute({
      tenantId: TENANT_ID,
      delegatorId: DELEGATOR_ID.toString(),
      page: 1,
      limit: 20,
    });

    expect(delegations).toHaveLength(2);
    expect(total).toBe(2);
  });

  it('should return empty when no delegations exist', async () => {
    const { delegations, total } = await listMyDelegationsUseCase.execute({
      tenantId: TENANT_ID,
      delegatorId: DELEGATOR_ID.toString(),
      page: 1,
      limit: 20,
    });

    expect(delegations).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('should paginate results correctly', async () => {
    for (let i = 0; i < 5; i++) {
      approvalDelegationsRepository.items.push(
        ApprovalDelegation.create({
          tenantId: new UniqueEntityID(TENANT_ID),
          delegatorId: DELEGATOR_ID,
          delegateId: new UniqueEntityID(),
          scope: 'ALL',
          startDate: new Date(`2026-04-0${i + 1}`),
        }),
      );
    }

    const { delegations, total } = await listMyDelegationsUseCase.execute({
      tenantId: TENANT_ID,
      delegatorId: DELEGATOR_ID.toString(),
      page: 2,
      limit: 2,
    });

    expect(delegations).toHaveLength(2);
    expect(total).toBe(5);
  });
});
