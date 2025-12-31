import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryCompanyStakeholderRepository } from '@/repositories/hr/in-memory/in-memory-company-stakeholder-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyStakeholderUseCase } from './create-company-stakeholder';

let repository: InMemoryCompanyStakeholderRepository;
let useCase: CreateCompanyStakeholderUseCase;

describe('CreateCompanyStakeholderUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyStakeholderRepository();
    useCase = new CreateCompanyStakeholderUseCase(repository);
  });

  it('should create a company stakeholder successfully', async () => {
    const response = await useCase.execute({
      companyId: 'company-1',
      name: 'João da Silva',
      role: 'SOCIO',
      entryDate: new Date('2020-01-01'),
      isLegalRepresentative: true,
    });

    expect(response.stakeholder).toBeDefined();
    expect(response.stakeholder.name).toBe('João da Silva');
    expect(response.stakeholder.role).toBe('SOCIO');
    expect(response.stakeholder.pendingIssues).toHaveLength(0);
  });

  it('should add pending issue when role is not defined', async () => {
    const response = await useCase.execute({
      companyId: 'company-1',
      name: 'João da Silva',
      entryDate: new Date('2020-01-01'),
    });

    expect(response.stakeholder.pendingIssues).toContain('role_not_defined');
  });

  it('should add pending issue when entry date is not defined', async () => {
    const response = await useCase.execute({
      companyId: 'company-1',
      name: 'João da Silva',
      role: 'SOCIO',
    });

    expect(response.stakeholder.pendingIssues).toContain(
      'entry_date_not_defined',
    );
  });

  it('should throw error when entry date is in the future', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    await expect(
      useCase.execute({
        companyId: 'company-1',
        name: 'João da Silva',
        role: 'SOCIO',
        entryDate: futureDate,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error when exit date is before entry date', async () => {
    const entryDate = new Date('2021-01-01');
    const exitDate = new Date('2020-01-01');

    await expect(
      useCase.execute({
        companyId: 'company-1',
        name: 'João da Silva',
        role: 'SOCIO',
        entryDate,
        exitDate,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error when creating duplicate stakeholder', async () => {
    await useCase.execute({
      companyId: 'company-1',
      name: 'João da Silva',
      role: 'SOCIO',
    });

    await expect(
      useCase.execute({
        companyId: 'company-1',
        name: 'João da Silva',
        role: 'SOCIO',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should set default source to MANUAL', async () => {
    const response = await useCase.execute({
      companyId: 'company-1',
      name: 'João da Silva',
      role: 'SOCIO',
    });

    expect(response.stakeholder.source).toBe('MANUAL');
  });
});
