import { InMemoryEnterprisesRepository } from '@/repositories/hr/in-memory/in-memory-enterprises-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetEnterpriseByCnpjUseCase } from './get-enterprise-by-cnpj';
import { CreateEnterpriseUseCase } from './create-enterprise';

let enterprisesRepository: InMemoryEnterprisesRepository;
let getByCnpjUseCase: GetEnterpriseByCnpjUseCase;
let createEnterpriseUseCase: CreateEnterpriseUseCase;

describe('Get Enterprise By CNPJ Use Case', () => {
  beforeEach(() => {
    enterprisesRepository = new InMemoryEnterprisesRepository();
    getByCnpjUseCase = new GetEnterpriseByCnpjUseCase(enterprisesRepository);
    createEnterpriseUseCase = new CreateEnterpriseUseCase(
      enterprisesRepository,
    );
  });

  it('should find an enterprise by CNPJ', async () => {
    const cnpj = '12345678000100';
    await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj,
    });

    const result = await getByCnpjUseCase.execute({ cnpj });

    expect(result.exists).toBe(true);
    expect(result.enterpriseId).toBeDefined();
  });

  it('should return exists: false when CNPJ not found', async () => {
    const result = await getByCnpjUseCase.execute({
      cnpj: '99999999999999',
    });

    expect(result.exists).toBe(false);
    expect(result.enterpriseId).toBeUndefined();
  });

  it('should not find deleted enterprise by default', async () => {
    const cnpj = '12345678000100';
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj,
    });

    const enterprise = created.enterprise;
    enterprise.delete();
    await enterprisesRepository.save(enterprise);

    const result = await getByCnpjUseCase.execute({ cnpj });

    expect(result.exists).toBe(false);
  });

  it('should find deleted enterprise when includeDeleted is true', async () => {
    const cnpj = '12345678000100';
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj,
    });

    const enterprise = created.enterprise;
    enterprise.delete();
    await enterprisesRepository.save(enterprise);

    const result = await getByCnpjUseCase.execute({
      cnpj,
      includeDeleted: true,
    });

    expect(result.exists).toBe(true);
    expect(result.enterpriseId).toBeDefined();
  });
});
