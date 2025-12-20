import { InMemoryEnterprisesRepository } from '@/repositories/hr/in-memory/in-memory-enterprises-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateEnterpriseUseCase } from './update-enterprise';
import { CreateEnterpriseUseCase } from './create-enterprise';

let enterprisesRepository: InMemoryEnterprisesRepository;
let updateEnterpriseUseCase: UpdateEnterpriseUseCase;
let createEnterpriseUseCase: CreateEnterpriseUseCase;

describe('Update Enterprise Use Case', () => {
  beforeEach(() => {
    enterprisesRepository = new InMemoryEnterprisesRepository();
    updateEnterpriseUseCase = new UpdateEnterpriseUseCase(
      enterprisesRepository,
    );
    createEnterpriseUseCase = new CreateEnterpriseUseCase(
      enterprisesRepository,
    );
  });

  it('should update enterprise legal name', async () => {
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await updateEnterpriseUseCase.execute({
      id: created.enterprise.id.toString(),
      legalName: 'Tech Solutions Updated LTDA',
    });

    expect(result.enterprise).toBeDefined();
    expect(result.enterprise?.legalName).toBe('Tech Solutions Updated LTDA');
  });

  it('should update enterprise tax regime', async () => {
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await updateEnterpriseUseCase.execute({
      id: created.enterprise.id.toString(),
      taxRegime: 'Lucro Real',
    });

    expect(result.enterprise?.taxRegime).toBe('Lucro Real');
  });

  it('should update enterprise address', async () => {
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await updateEnterpriseUseCase.execute({
      id: created.enterprise.id.toString(),
      address: 'Rua das Flores',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310100',
    });

    expect(result.enterprise?.address).toBe('Rua das Flores');
    expect(result.enterprise?.city).toBe('São Paulo');
    expect(result.enterprise?.state).toBe('SP');
  });

  it('should return null when enterprise not found', async () => {
    const result = await updateEnterpriseUseCase.execute({
      id: 'non-existent-id',
      legalName: 'New Name',
    });

    expect(result.enterprise).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      phone: '1133334444',
    });

    const result = await updateEnterpriseUseCase.execute({
      id: created.enterprise.id.toString(),
      legalName: 'Tech Solutions Updated LTDA',
      phone: '1144445555',
      taxRegime: 'Lucro Real',
    });

    expect(result.enterprise?.legalName).toBe('Tech Solutions Updated LTDA');
    expect(result.enterprise?.phone).toBe('1144445555');
    expect(result.enterprise?.taxRegime).toBe('Lucro Real');
  });
});
