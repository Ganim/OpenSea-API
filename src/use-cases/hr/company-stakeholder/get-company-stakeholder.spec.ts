import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCompanyStakeholderRepository } from '@/repositories/hr/in-memory/in-memory-company-stakeholder-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeCompanyStakeholder } from './factories/make-company-stakeholder';
import { GetCompanyStakeholderUseCase } from './get-company-stakeholder';

let repository: InMemoryCompanyStakeholderRepository;
let useCase: GetCompanyStakeholderUseCase;

describe('GetCompanyStakeholderUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyStakeholderRepository();
    useCase = new GetCompanyStakeholderUseCase(repository);
  });

  it('should get all stakeholders for a company', async () => {
    const stakeholder1 = makeCompanyStakeholder({ name: 'João' });
    const stakeholder2 = makeCompanyStakeholder({ name: 'Maria' });

    await repository.save(stakeholder1);
    await repository.save(stakeholder2);

    const response = await useCase.execute({ companyId: 'company-1' });

    expect(response.stakeholders).toHaveLength(2);
    expect(response.stakeholders[0].name).toBe('João');
    expect(response.stakeholders[1].name).toBe('Maria');
  });

  it('should throw error when no stakeholders found', async () => {
    await expect(
      useCase.execute({ companyId: 'non-existent-company' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not return deleted stakeholders', async () => {
    const stakeholder1 = makeCompanyStakeholder({ name: 'João' });
    const stakeholder2 = makeCompanyStakeholder({
      name: 'Maria',
      status: 'INACTIVE',
    });

    await repository.save(stakeholder1);
    await repository.save(stakeholder2);
    await repository.softDelete(stakeholder2.id);

    const response = await useCase.execute({ companyId: 'company-1' });

    expect(response.stakeholders).toHaveLength(1);
    expect(response.stakeholders[0].name).toBe('João');
  });
});
