import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { CPF, EmployeeStatus } from '@/entities/hr/value-objects';
import { InMemoryApprovalDelegationsRepository } from '@/repositories/hr/in-memory/in-memory-approval-delegations-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDelegationUseCase } from './create-delegation';

let approvalDelegationsRepository: InMemoryApprovalDelegationsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let createDelegationUseCase: CreateDelegationUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const DELEGATOR_ID = new UniqueEntityID();
const DELEGATE_ID = new UniqueEntityID();

const VALID_CPFS = ['529.982.247-25', '123.456.789-09'];
let cpfIndex = 0;

function makeEmployee(id: UniqueEntityID): Employee {
  const cpf = VALID_CPFS[cpfIndex % VALID_CPFS.length];
  cpfIndex++;
  return Employee.create(
    {
      tenantId: new UniqueEntityID(TENANT_ID),
      registrationNumber: `REG-${id.toString().slice(0, 8)}`,
      fullName: `Employee ${id.toString().slice(0, 6)}`,
      cpf: CPF.create(cpf),
      status: EmployeeStatus.ACTIVE(),
      hireDate: new Date('2024-01-01'),
      contractType: 'CLT',
      workRegime: 'CLT',
      weeklyHours: 44,
      country: 'Brasil',
      metadata: {},
      pendingIssues: [],
    },
    id,
  );
}

describe('CreateDelegationUseCase', () => {
  beforeEach(() => {
    approvalDelegationsRepository = new InMemoryApprovalDelegationsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    createDelegationUseCase = new CreateDelegationUseCase(
      approvalDelegationsRepository,
      employeesRepository,
    );

    // Seed employees
    employeesRepository['items'].push(makeEmployee(DELEGATOR_ID));
    employeesRepository['items'].push(makeEmployee(DELEGATE_ID));
  });

  it('should create a delegation successfully', async () => {
    const { delegation } = await createDelegationUseCase.execute({
      tenantId: TENANT_ID,
      delegatorId: DELEGATOR_ID.toString(),
      delegateId: DELEGATE_ID.toString(),
      scope: 'ALL',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
      reason: 'Vacation coverage',
    });

    expect(delegation.delegatorId.toString()).toBe(DELEGATOR_ID.toString());
    expect(delegation.delegateId.toString()).toBe(DELEGATE_ID.toString());
    expect(delegation.scope).toBe('ALL');
    expect(delegation.isActive).toBe(true);
    expect(delegation.reason).toBe('Vacation coverage');
    expect(approvalDelegationsRepository.items).toHaveLength(1);
  });

  it('should not allow self-delegation', async () => {
    await expect(
      createDelegationUseCase.execute({
        tenantId: TENANT_ID,
        delegatorId: DELEGATOR_ID.toString(),
        delegateId: DELEGATOR_ID.toString(),
        scope: 'ABSENCES',
        startDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow('Cannot delegate approval authority to yourself');
  });

  it('should reject invalid scope', async () => {
    await expect(
      createDelegationUseCase.execute({
        tenantId: TENANT_ID,
        delegatorId: DELEGATOR_ID.toString(),
        delegateId: DELEGATE_ID.toString(),
        scope: 'INVALID',
        startDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow('Invalid scope');
  });

  it('should reject when end date is before start date', async () => {
    await expect(
      createDelegationUseCase.execute({
        tenantId: TENANT_ID,
        delegatorId: DELEGATOR_ID.toString(),
        delegateId: DELEGATE_ID.toString(),
        scope: 'ALL',
        startDate: new Date('2026-04-30'),
        endDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow('End date must be after start date');
  });

  it('should reject when delegator not found', async () => {
    const unknownId = new UniqueEntityID().toString();

    await expect(
      createDelegationUseCase.execute({
        tenantId: TENANT_ID,
        delegatorId: unknownId,
        delegateId: DELEGATE_ID.toString(),
        scope: 'OVERTIME',
        startDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow('Delegator employee not found');
  });

  it('should reject when delegate not found', async () => {
    const unknownId = new UniqueEntityID().toString();

    await expect(
      createDelegationUseCase.execute({
        tenantId: TENANT_ID,
        delegatorId: DELEGATOR_ID.toString(),
        delegateId: unknownId,
        scope: 'VACATIONS',
        startDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow('Delegate employee not found');
  });

  it('should reject duplicate active delegation between same pair', async () => {
    await createDelegationUseCase.execute({
      tenantId: TENANT_ID,
      delegatorId: DELEGATOR_ID.toString(),
      delegateId: DELEGATE_ID.toString(),
      scope: 'ALL',
      startDate: new Date('2026-04-01'),
    });

    await expect(
      createDelegationUseCase.execute({
        tenantId: TENANT_ID,
        delegatorId: DELEGATOR_ID.toString(),
        delegateId: DELEGATE_ID.toString(),
        scope: 'ABSENCES',
        startDate: new Date('2026-05-01'),
      }),
    ).rejects.toThrow(
      'An active delegation already exists between these employees',
    );
  });

  it('should allow creation without end date (open-ended)', async () => {
    const { delegation } = await createDelegationUseCase.execute({
      tenantId: TENANT_ID,
      delegatorId: DELEGATOR_ID.toString(),
      delegateId: DELEGATE_ID.toString(),
      scope: 'REQUESTS',
      startDate: new Date('2026-04-01'),
    });

    expect(delegation.endDate).toBeUndefined();
    expect(delegation.isActive).toBe(true);
  });
});
