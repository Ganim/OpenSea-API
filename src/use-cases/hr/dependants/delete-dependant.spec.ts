import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeDependant } from '@/entities/hr/employee-dependant';
import { InMemoryDependantsRepository } from '@/repositories/hr/in-memory/in-memory-dependants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteDependantUseCase } from './delete-dependant';

let dependantsRepository: InMemoryDependantsRepository;
let sut: DeleteDependantUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();

let existingDependant: EmployeeDependant;

describe('Delete Dependant Use Case', () => {
  beforeEach(() => {
    dependantsRepository = new InMemoryDependantsRepository();
    sut = new DeleteDependantUseCase(dependantsRepository);

    existingDependant = EmployeeDependant.create(
      {
        tenantId: new UniqueEntityID(tenantId),
        employeeId: new UniqueEntityID(employeeId),
        name: 'João Silva',
        birthDate: new Date('2015-06-15'),
        relationship: 'CHILD',
        isIrrfDependant: false,
        isSalarioFamilia: false,
        hasDisability: false,
      },
      new UniqueEntityID(),
    );

    dependantsRepository.items.push(existingDependant);
  });

  it('should delete a dependant successfully', async () => {
    const result = await sut.execute({
      tenantId,
      dependantId: existingDependant.id.toString(),
    });

    expect(result.dependant).toBeDefined();
    expect(result.dependant.id.equals(existingDependant.id)).toBe(true);
    expect(dependantsRepository.items).toHaveLength(0);
  });

  it('should return the deleted dependant details', async () => {
    const result = await sut.execute({
      tenantId,
      dependantId: existingDependant.id.toString(),
    });

    expect(result.dependant.name).toBe('João Silva');
    expect(result.dependant.relationship).toBe('CHILD');
  });

  it('should throw error when dependant not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        dependantId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Dependente não encontrado');
  });

  it('should throw error when dependant belongs to a different tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: differentTenantId,
        dependantId: existingDependant.id.toString(),
      }),
    ).rejects.toThrow('Dependente não encontrado');
  });

  it('should not affect other dependants when deleting one', async () => {
    const secondDependant = EmployeeDependant.create(
      {
        tenantId: new UniqueEntityID(tenantId),
        employeeId: new UniqueEntityID(employeeId),
        name: 'Ana Silva',
        birthDate: new Date('2018-03-20'),
        relationship: 'CHILD',
        isIrrfDependant: false,
        isSalarioFamilia: false,
        hasDisability: false,
      },
      new UniqueEntityID(),
    );

    dependantsRepository.items.push(secondDependant);
    expect(dependantsRepository.items).toHaveLength(2);

    await sut.execute({
      tenantId,
      dependantId: existingDependant.id.toString(),
    });

    expect(dependantsRepository.items).toHaveLength(1);
    expect(dependantsRepository.items[0].id.equals(secondDependant.id)).toBe(
      true,
    );
  });
});
