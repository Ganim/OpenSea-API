import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ApprovalDelegation } from '@/entities/hr/approval-delegation';
import { InMemoryApprovalDelegationsRepository } from '@/repositories/hr/in-memory/in-memory-approval-delegations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListDelegationsToMeUseCase } from './list-delegations-to-me';

let approvalDelegationsRepository: InMemoryApprovalDelegationsRepository;
let listDelegationsToMeUseCase: ListDelegationsToMeUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const DELEGATE_ID = new UniqueEntityID();

describe('ListDelegationsToMeUseCase', () => {
  beforeEach(() => {
    approvalDelegationsRepository =
      new InMemoryApprovalDelegationsRepository();
    listDelegationsToMeUseCase = new ListDelegationsToMeUseCase(
      approvalDelegationsRepository,
    );
  });

  it('should list delegations received by the delegate', async () => {
    const delegatorIdA = new UniqueEntityID();
    const delegatorIdB = new UniqueEntityID();

    approvalDelegationsRepository.items.push(
      ApprovalDelegation.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        delegatorId: delegatorIdA,
        delegateId: DELEGATE_ID,
        scope: 'ALL',
        startDate: new Date('2026-04-01'),
      }),
    );

    approvalDelegationsRepository.items.push(
      ApprovalDelegation.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        delegatorId: delegatorIdB,
        delegateId: DELEGATE_ID,
        scope: 'OVERTIME',
        startDate: new Date('2026-04-01'),
      }),
    );

    const { delegations, total } = await listDelegationsToMeUseCase.execute({
      tenantId: TENANT_ID,
      delegateId: DELEGATE_ID.toString(),
      page: 1,
      limit: 20,
    });

    expect(delegations).toHaveLength(2);
    expect(total).toBe(2);
  });

  it('should return empty when no delegations received', async () => {
    const { delegations, total } = await listDelegationsToMeUseCase.execute({
      tenantId: TENANT_ID,
      delegateId: DELEGATE_ID.toString(),
      page: 1,
      limit: 20,
    });

    expect(delegations).toHaveLength(0);
    expect(total).toBe(0);
  });
});
