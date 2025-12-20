import { InMemoryEnterprisesRepository } from '@/repositories/hr/in-memory/in-memory-enterprises-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListEnterprisesUseCase } from './list-enterprises';
import { CreateEnterpriseUseCase } from './create-enterprise';

let enterprisesRepository: InMemoryEnterprisesRepository;
let listEnterprisesUseCase: ListEnterprisesUseCase;
let createEnterpriseUseCase: CreateEnterpriseUseCase;

describe('List Enterprises Use Case', () => {
  beforeEach(() => {
    enterprisesRepository = new InMemoryEnterprisesRepository();
    listEnterprisesUseCase = new ListEnterprisesUseCase(enterprisesRepository);
    createEnterpriseUseCase = new CreateEnterpriseUseCase(
      enterprisesRepository,
    );
  });

  it('should list all active enterprises', async () => {
    await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await createEnterpriseUseCase.execute({
      legalName: 'Innovation Corp',
      cnpj: '98765432000100',
    });

    const result = await listEnterprisesUseCase.execute({
      page: 1,
      perPage: 20,
    });

    expect(result.enterprises).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
  });

  it('should list enterprises with pagination', async () => {
    for (let i = 0; i < 25; i++) {
      await createEnterpriseUseCase.execute({
        legalName: `Company ${i}`,
        cnpj: `${String(i).padStart(14, '0')}0100`,
      });
    }

    const result = await listEnterprisesUseCase.execute({
      page: 1,
      perPage: 10,
    });

    expect(result.enterprises).toHaveLength(10);
    expect(result.total).toBe(25);
  });

  it('should search enterprises by legal name', async () => {
    await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await createEnterpriseUseCase.execute({
      legalName: 'Innovation Corp',
      cnpj: '98765432000100',
    });

    const result = await listEnterprisesUseCase.execute({
      search: 'Tech',
    });

    expect(result.enterprises).toHaveLength(1);
    expect(result.enterprises[0].legalName).toBe('Tech Solutions LTDA');
  });

  it('should search enterprises by CNPJ', async () => {
    await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await createEnterpriseUseCase.execute({
      legalName: 'Innovation Corp',
      cnpj: '98765432000100',
    });

    const result = await listEnterprisesUseCase.execute({
      search: '12345678000100',
    });

    expect(result.enterprises).toHaveLength(1);
    expect(result.enterprises[0].cnpj).toBe('12345678000100');
  });

  it('should not list deleted enterprises by default', async () => {
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const enterprise = created.enterprise;
    enterprise.delete();
    await enterprisesRepository.save(enterprise);

    const result = await listEnterprisesUseCase.execute({});

    expect(result.enterprises).toHaveLength(0);
  });

  it('should list deleted enterprises when includeDeleted is true', async () => {
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const enterprise = created.enterprise;
    enterprise.delete();
    await enterprisesRepository.save(enterprise);

    const result = await listEnterprisesUseCase.execute({
      includeDeleted: true,
    });

    expect(result.enterprises).toHaveLength(1);
  });
});
