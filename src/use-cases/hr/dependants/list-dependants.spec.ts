import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeDependant } from '@/entities/hr/employee-dependant';
import { InMemoryDependantsRepository } from '@/repositories/hr/in-memory/in-memory-dependants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListDependantsUseCase } from './list-dependants';

let dependantsRepository: InMemoryDependantsRepository;
let sut: ListDependantsUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();
const anotherEmployeeId = new UniqueEntityID().toString();

function createTestDependant(
  overrides: Partial<{
    tenantId: string;
    employeeId: string;
    name: string;
    relationship: string;
  }> = {},
): EmployeeDependant {
  return EmployeeDependant.create(
    {
      tenantId: new UniqueEntityID(overrides.tenantId ?? tenantId),
      employeeId: new UniqueEntityID(overrides.employeeId ?? employeeId),
      name: overrides.name ?? 'Test Dependant',
      birthDate: new Date('2010-01-01'),
      relationship:
        (overrides.relationship as EmployeeDependant['relationship']) ??
        'CHILD',
      isIrrfDependant: false,
      isSalarioFamilia: false,
      hasDisability: false,
    },
    new UniqueEntityID(),
  );
}

describe('List Dependants Use Case', () => {
  beforeEach(() => {
    dependantsRepository = new InMemoryDependantsRepository();
    sut = new ListDependantsUseCase(dependantsRepository);
  });

  it('should list dependants for a given employee', async () => {
    dependantsRepository.items.push(
      createTestDependant({ name: 'Child 1' }),
      createTestDependant({ name: 'Child 2' }),
      createTestDependant({ name: 'Spouse' }),
    );

    const result = await sut.execute({
      tenantId,
      employeeId,
    });

    expect(result.dependants).toHaveLength(3);
  });

  it('should not include dependants from other employees', async () => {
    dependantsRepository.items.push(
      createTestDependant({ name: 'My Dependant' }),
      createTestDependant({
        name: 'Other Employee Dependant',
        employeeId: anotherEmployeeId,
      }),
    );

    const result = await sut.execute({
      tenantId,
      employeeId,
    });

    expect(result.dependants).toHaveLength(1);
    expect(result.dependants[0].name).toBe('My Dependant');
  });

  it('should not include dependants from other tenants', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    dependantsRepository.items.push(
      createTestDependant({ name: 'Same Tenant' }),
      createTestDependant({ name: 'Other Tenant', tenantId: otherTenantId }),
    );

    const result = await sut.execute({
      tenantId,
      employeeId,
    });

    expect(result.dependants).toHaveLength(1);
  });

  it('should return empty list when employee has no dependants', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId,
    });

    expect(result.dependants).toHaveLength(0);
  });

  it('should paginate results when page and perPage are provided', async () => {
    for (let i = 0; i < 5; i++) {
      dependantsRepository.items.push(
        createTestDependant({ name: `Dependant ${i + 1}` }),
      );
    }

    const result = await sut.execute({
      tenantId,
      employeeId,
      page: 1,
      perPage: 2,
    });

    expect(result.dependants).toHaveLength(2);
  });

  it('should return second page correctly', async () => {
    for (let i = 0; i < 5; i++) {
      dependantsRepository.items.push(
        createTestDependant({ name: `Dependant ${i + 1}` }),
      );
    }

    const result = await sut.execute({
      tenantId,
      employeeId,
      page: 2,
      perPage: 2,
    });

    expect(result.dependants).toHaveLength(2);
  });
});
