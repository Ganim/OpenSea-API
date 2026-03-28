import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeDependant } from '@/entities/hr/employee-dependant';
import { InMemoryDependantsRepository } from '@/repositories/hr/in-memory/in-memory-dependants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateDependantUseCase } from './update-dependant';

let dependantsRepository: InMemoryDependantsRepository;
let sut: UpdateDependantUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();

let existingDependant: EmployeeDependant;

describe('Update Dependant Use Case', () => {
  beforeEach(() => {
    dependantsRepository = new InMemoryDependantsRepository();
    sut = new UpdateDependantUseCase(dependantsRepository);

    existingDependant = EmployeeDependant.create(
      {
        tenantId: new UniqueEntityID(tenantId),
        employeeId: new UniqueEntityID(employeeId),
        name: 'João Silva',
        cpf: '123.456.789-09',
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

  it('should update a dependant name successfully', async () => {
    const result = await sut.execute({
      tenantId,
      dependantId: existingDependant.id.toString(),
      name: 'João da Silva Santos',
    });

    expect(result.dependant.name).toBe('João da Silva Santos');
  });

  it('should update dependant relationship', async () => {
    const result = await sut.execute({
      tenantId,
      dependantId: existingDependant.id.toString(),
      relationship: 'STEPCHILD',
    });

    expect(result.dependant.relationship).toBe('STEPCHILD');
  });

  it('should update dependant birth date', async () => {
    const newBirthDate = new Date('2016-01-01');

    const result = await sut.execute({
      tenantId,
      dependantId: existingDependant.id.toString(),
      birthDate: newBirthDate,
    });

    expect(result.dependant.birthDate).toEqual(newBirthDate);
  });

  it('should update boolean flags', async () => {
    const result = await sut.execute({
      tenantId,
      dependantId: existingDependant.id.toString(),
      isIrrfDependant: true,
      isSalarioFamilia: true,
      hasDisability: true,
    });

    expect(result.dependant.isIrrfDependant).toBe(true);
    expect(result.dependant.isSalarioFamilia).toBe(true);
    expect(result.dependant.hasDisability).toBe(true);
  });

  it('should update CPF', async () => {
    const result = await sut.execute({
      tenantId,
      dependantId: existingDependant.id.toString(),
      cpf: '987.654.321-00',
    });

    expect(result.dependant.cpf).toBe('987.654.321-00');
  });

  it('should trim updated name', async () => {
    const result = await sut.execute({
      tenantId,
      dependantId: existingDependant.id.toString(),
      name: '  Updated Name  ',
    });

    expect(result.dependant.name).toBe('Updated Name');
  });

  it('should keep unchanged fields intact', async () => {
    const result = await sut.execute({
      tenantId,
      dependantId: existingDependant.id.toString(),
      isIrrfDependant: true,
    });

    expect(result.dependant.name).toBe('João Silva');
    expect(result.dependant.relationship).toBe('CHILD');
    expect(result.dependant.cpf).toBe('123.456.789-09');
    expect(result.dependant.isIrrfDependant).toBe(true);
  });

  it('should throw error when dependant not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        dependantId: new UniqueEntityID().toString(),
        name: 'Does Not Exist',
      }),
    ).rejects.toThrow('Dependente não encontrado');
  });

  it('should throw error when dependant belongs to a different tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: differentTenantId,
        dependantId: existingDependant.id.toString(),
        name: 'Cross Tenant Update',
      }),
    ).rejects.toThrow('Dependente não encontrado');
  });
});
