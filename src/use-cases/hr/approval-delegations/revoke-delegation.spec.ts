import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ApprovalDelegation } from '@/entities/hr/approval-delegation';
import { InMemoryApprovalDelegationsRepository } from '@/repositories/hr/in-memory/in-memory-approval-delegations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RevokeDelegationUseCase } from './revoke-delegation';

let approvalDelegationsRepository: InMemoryApprovalDelegationsRepository;
let revokeDelegationUseCase: RevokeDelegationUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const DELEGATOR_ID = new UniqueEntityID();
const DELEGATE_ID = new UniqueEntityID();

describe('RevokeDelegationUseCase', () => {
  beforeEach(() => {
    approvalDelegationsRepository = new InMemoryApprovalDelegationsRepository();
    revokeDelegationUseCase = new RevokeDelegationUseCase(
      approvalDelegationsRepository,
    );
  });

  it('should revoke a delegation successfully', async () => {
    const existingDelegation = ApprovalDelegation.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      delegatorId: DELEGATOR_ID,
      delegateId: DELEGATE_ID,
      scope: 'ALL',
      startDate: new Date('2026-04-01'),
    });
    approvalDelegationsRepository.items.push(existingDelegation);

    const { delegation } = await revokeDelegationUseCase.execute({
      tenantId: TENANT_ID,
      delegationId: existingDelegation.id.toString(),
      revokedBy: DELEGATOR_ID.toString(),
    });

    expect(delegation.isActive).toBe(false);
  });

  it('should throw when delegation not found', async () => {
    await expect(
      revokeDelegationUseCase.execute({
        tenantId: TENANT_ID,
        delegationId: new UniqueEntityID().toString(),
        revokedBy: DELEGATOR_ID.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow non-delegator to revoke', async () => {
    const existingDelegation = ApprovalDelegation.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      delegatorId: DELEGATOR_ID,
      delegateId: DELEGATE_ID,
      scope: 'ALL',
      startDate: new Date('2026-04-01'),
    });
    approvalDelegationsRepository.items.push(existingDelegation);

    const otherEmployeeId = new UniqueEntityID().toString();

    await expect(
      revokeDelegationUseCase.execute({
        tenantId: TENANT_ID,
        delegationId: existingDelegation.id.toString(),
        revokedBy: otherEmployeeId,
      }),
    ).rejects.toThrow('Only the delegator can revoke their own delegation');
  });

  it('should not allow revoking an already revoked delegation', async () => {
    const existingDelegation = ApprovalDelegation.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      delegatorId: DELEGATOR_ID,
      delegateId: DELEGATE_ID,
      scope: 'ALL',
      startDate: new Date('2026-04-01'),
      isActive: false,
    });
    approvalDelegationsRepository.items.push(existingDelegation);

    await expect(
      revokeDelegationUseCase.execute({
        tenantId: TENANT_ID,
        delegationId: existingDelegation.id.toString(),
        revokedBy: DELEGATOR_ID.toString(),
      }),
    ).rejects.toThrow('Delegation is already revoked');
  });
});
