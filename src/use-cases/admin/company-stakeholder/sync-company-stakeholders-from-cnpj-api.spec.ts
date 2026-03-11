import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyStakeholderRepository } from '@/repositories/core/in-memory/in-memory-company-stakeholder-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeCompanyStakeholder } from './factories/make-company-stakeholder';
import { SyncCompanyStakeholdersFromCnpjApiUseCase } from './sync-company-stakeholders-from-cnpj-api';

let repository: InMemoryCompanyStakeholderRepository;
let useCase: SyncCompanyStakeholdersFromCnpjApiUseCase;

describe('SyncCompanyStakeholdersFromCnpjApiUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyStakeholderRepository();
    useCase = new SyncCompanyStakeholdersFromCnpjApiUseCase(repository);
  });

  it('should create stakeholders from CNPJ API', async () => {
    const response = await useCase.execute({
      companyId: 'company-1',
      stakeholders: [
        {
          name: 'João da Silva',
          role: 'SOCIO',
          entryDate: new Date('2020-01-01'),
          isLegalRepresentative: true,
          rawPayload: { test: 'data' },
        },
      ],
    });

    expect(response.created).toBe(1);
    expect(response.updated).toBe(0);
  });

  it('should not update manual stakeholders', async () => {
    const manualStakeholder = makeCompanyStakeholder({
      name: 'João',
      source: 'MANUAL',
    });
    await repository.save(manualStakeholder);

    const response = await useCase.execute({
      companyId: 'company-1',
      stakeholders: [
        {
          name: 'João',
          role: 'SOCIO',
          entryDate: new Date('2020-01-01'),
          rawPayload: { test: 'data' },
        },
      ],
    });

    expect(response.created).toBe(0);
    expect(response.updated).toBe(0);
  });

  it('should create pending issues for incomplete data', async () => {
    await useCase.execute({
      companyId: 'company-1',
      stakeholders: [
        {
          name: 'João',
          rawPayload: { test: 'data' },
        },
      ],
    });

    const stakeholders = await repository.findByCompanyId(
      new UniqueEntityID('company-1'),
    );
    expect(stakeholders[0].pendingIssues).toContain('role_not_defined');
    expect(stakeholders[0].pendingIssues).toContain('entry_date_not_defined');
  });
});
