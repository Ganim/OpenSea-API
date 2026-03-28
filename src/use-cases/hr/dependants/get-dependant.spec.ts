import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeDependant } from '@/entities/hr/employee-dependant';
import { InMemoryDependantsRepository } from '@/repositories/hr/in-memory/in-memory-dependants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetDependantUseCase } from './get-dependant';

let dependantsRepository: InMemoryDependantsRepository;
let sut: GetDependantUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();

describe('Get Dependant Use Case', () => {
  beforeEach(() => {
    dependantsRepository = new InMemoryDependantsRepository();
    sut = new GetDependantUseCase(dependantsRepository);
  });

  it('should get a dependant by id successfully', async () => {
    const dependant = EmployeeDependant.create(
      {
        tenantId: new UniqueEntityID(tenantId),
        employeeId: new UniqueEntityID(employeeId),
        name: 'João Silva',
        birthDate: new Date('2015-06-15'),
        relationship: 'CHILD',
        isIrrfDependant: true,
        isSalarioFamilia: true,
        hasDisability: false,
      },
      new UniqueEntityID(),
    );

    dependantsRepository.items.push(dependant);

    const result = await sut.execute({
      tenantId,
      dependantId: dependant.id.toString(),
    });

    expect(result.dependant).toBeDefined();
    expect(result.dependant.id.equals(dependant.id)).toBe(true);
    expect(result.dependant.name).toBe('João Silva');
    expect(result.dependant.relationship).toBe('CHILD');
    expect(result.dependant.isIrrfDependant).toBe(true);
    expect(result.dependant.isSalarioFamilia).toBe(true);
  });

  it('should throw error when dependant not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        dependantId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Dependente não encontrado');
  });

  it('should not find dependant from a different tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();
    const dependant = EmployeeDependant.create(
      {
        tenantId: new UniqueEntityID(differentTenantId),
        employeeId: new UniqueEntityID(employeeId),
        name: 'Other Tenant Dependant',
        birthDate: new Date('2010-01-01'),
        relationship: 'SPOUSE',
        isIrrfDependant: false,
        isSalarioFamilia: false,
        hasDisability: false,
      },
      new UniqueEntityID(),
    );

    dependantsRepository.items.push(dependant);

    await expect(
      sut.execute({
        tenantId, // different from the dependant's tenant
        dependantId: dependant.id.toString(),
      }),
    ).rejects.toThrow('Dependente não encontrado');
  });
});
