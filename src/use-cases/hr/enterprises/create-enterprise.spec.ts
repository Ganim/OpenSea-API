import { InMemoryEnterprisesRepository } from '@/repositories/hr/in-memory/in-memory-enterprises-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateEnterpriseUseCase } from './create-enterprise';

let enterprisesRepository: InMemoryEnterprisesRepository;
let sut: CreateEnterpriseUseCase;

describe('Create Enterprise Use Case', () => {
  beforeEach(() => {
    enterprisesRepository = new InMemoryEnterprisesRepository();
    sut = new CreateEnterpriseUseCase(enterprisesRepository);
  });

  it('should create an enterprise successfully', async () => {
    const result = await sut.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      taxRegime: 'Lucro Real',
      phone: '1133334444',
    });

    expect(result.enterprise).toBeDefined();
    expect(result.enterprise.legalName).toBe('Tech Solutions LTDA');
    expect(result.enterprise.cnpj).toBe('12345678000100');
    expect(result.enterprise.taxRegime).toBe('Lucro Real');
    expect(result.enterprise.phone).toBe('1133334444');
    expect(result.enterprise.isActive()).toBe(true);
  });

  it('should create enterprise with complete address', async () => {
    const result = await sut.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      address: 'Rua das Flores',
      addressNumber: '123',
      complement: 'Apto 101',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310100',
      country: 'Brasil',
    });

    expect(result.enterprise.hasCompleteAddress()).toBe(true);
    expect(result.enterprise.address).toBe('Rua das Flores');
    expect(result.enterprise.city).toBe('São Paulo');
  });

  it('should not create enterprise with existing CNPJ', async () => {
    await sut.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await expect(
      sut.execute({
        legalName: 'Different Name',
        cnpj: '12345678000100',
      }),
    ).rejects.toThrow('Enterprise with this CNPJ already exists');
  });

  it('should create enterprise with default country', async () => {
    const result = await sut.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    expect(result.enterprise.country).toBe('Brasil');
  });

  it('should create enterprise with optional fields', async () => {
    const result = await sut.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      taxRegime: 'Simples Nacional',
      phone: '1144445555',
      logoUrl: 'https://example.com/logo.png',
    });

    expect(result.enterprise.logoUrl).toBe('https://example.com/logo.png');
  });
});
