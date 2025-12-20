import { InMemoryEnterprisesRepository } from '@/repositories/hr/in-memory/in-memory-enterprises-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetEnterpriseByIdUseCase } from './get-enterprise-by-id';
import { CreateEnterpriseUseCase } from './create-enterprise';

let enterprisesRepository: InMemoryEnterprisesRepository;
let getEnterpriseUseCase: GetEnterpriseByIdUseCase;
let createEnterpriseUseCase: CreateEnterpriseUseCase;

describe('Get Enterprise By ID Use Case', () => {
  beforeEach(() => {
    enterprisesRepository = new InMemoryEnterprisesRepository();
    getEnterpriseUseCase = new GetEnterpriseByIdUseCase(enterprisesRepository);
    createEnterpriseUseCase = new CreateEnterpriseUseCase(
      enterprisesRepository,
    );
  });

  it('should get enterprise by ID', async () => {
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await getEnterpriseUseCase.execute({
      id: created.enterprise.id.toString(),
    });

    expect(result.enterprise).toBeDefined();
    expect(result.enterprise?.legalName).toBe('Tech Solutions LTDA');
    expect(result.enterprise?.cnpj).toBe('12345678000100');
  });

  it('should return null when enterprise not found', async () => {
    const result = await getEnterpriseUseCase.execute({
      id: 'non-existent-id',
    });

    expect(result.enterprise).toBeNull();
  });

  it('should not return deleted enterprise', async () => {
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const enterprise = created.enterprise;
    enterprise.delete();
    await enterprisesRepository.save(enterprise);

    const result = await getEnterpriseUseCase.execute({
      id: enterprise.id.toString(),
    });

    expect(result.enterprise).toBeNull();
  });
});
