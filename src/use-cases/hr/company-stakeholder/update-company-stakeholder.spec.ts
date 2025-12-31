import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCompanyStakeholderRepository } from '@/repositories/hr/in-memory/in-memory-company-stakeholder-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeCompanyStakeholder } from './factories/make-company-stakeholder';
import { UpdateCompanyStakeholderUseCase } from './update-company-stakeholder';

let repository: InMemoryCompanyStakeholderRepository;
let useCase: UpdateCompanyStakeholderUseCase;

describe('UpdateCompanyStakeholderUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyStakeholderRepository();
    useCase = new UpdateCompanyStakeholderUseCase(repository);
  });

  it('should update a stakeholder successfully', async () => {
    const stakeholder = makeCompanyStakeholder({ name: 'João' });
    await repository.save(stakeholder);

    const response = await useCase.execute({
      id: stakeholder.id.toString(),
      companyId: stakeholder.companyId.toString(),
      name: 'João Silva',
      role: 'ADMINISTRADOR',
    });

    expect(response.stakeholder.name).toBe('João Silva');
    expect(response.stakeholder.role).toBe('ADMINISTRADOR');
  });

  it('should throw error when stakeholder not found', async () => {
    await expect(
      useCase.execute({
        id: 'non-existent-id',
        companyId: 'company-1',
        name: 'João',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error when entry date is in the future', async () => {
    const stakeholder = makeCompanyStakeholder({});
    await repository.save(stakeholder);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    await expect(
      useCase.execute({
        id: stakeholder.id.toString(),
        companyId: stakeholder.companyId.toString(),
        entryDate: futureDate,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error when status is INACTIVE without exit date', async () => {
    const stakeholder = makeCompanyStakeholder({});
    await repository.save(stakeholder);

    await expect(
      useCase.execute({
        id: stakeholder.id.toString(),
        companyId: stakeholder.companyId.toString(),
        status: 'INACTIVE',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error when updating to duplicate name', async () => {
    const stakeholder1 = makeCompanyStakeholder({ name: 'João' });
    const stakeholder2 = makeCompanyStakeholder({ name: 'Maria' });
    await repository.save(stakeholder1);
    await repository.save(stakeholder2);

    await expect(
      useCase.execute({
        id: stakeholder2.id.toString(),
        companyId: stakeholder2.companyId.toString(),
        name: 'João',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should update pending issues based on fields', async () => {
    const stakeholder = makeCompanyStakeholder({
      role: 'SOCIO',
      entryDate: new Date(),
    });
    await repository.save(stakeholder);

    const response = await useCase.execute({
      id: stakeholder.id.toString(),
      companyId: stakeholder.companyId.toString(),
      role: null,
      entryDate: null,
    });

    expect(response.stakeholder.pendingIssues).toContain('role_not_defined');
    expect(response.stakeholder.pendingIssues).toContain(
      'entry_date_not_defined',
    );
  });
});
