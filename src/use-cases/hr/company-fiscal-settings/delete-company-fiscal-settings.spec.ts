import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCompanyFiscalSettingsRepository } from '@/repositories/hr/in-memory/in-memory-company-fiscal-settings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyFiscalSettingsUseCase } from './create-company-fiscal-settings';
import { DeleteCompanyFiscalSettingsUseCase } from './delete-company-fiscal-settings';

let repository: InMemoryCompanyFiscalSettingsRepository;
let createUseCase: CreateCompanyFiscalSettingsUseCase;
let deleteUseCase: DeleteCompanyFiscalSettingsUseCase;

describe('DeleteCompanyFiscalSettingsUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyFiscalSettingsRepository();
    createUseCase = new CreateCompanyFiscalSettingsUseCase(repository);
    deleteUseCase = new DeleteCompanyFiscalSettingsUseCase(repository);
  });

  it('should delete fiscal settings successfully', async () => {
    await createUseCase.execute({
      companyId: 'company-1',
    });

    const response = await deleteUseCase.execute({
      companyId: 'company-1',
    });

    expect(response.success).toBe(true);
  });

  it('should throw ResourceNotFoundError when fiscal settings do not exist', async () => {
    await expect(
      deleteUseCase.execute({
        companyId: 'company-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should soft delete (mark as deleted)', async () => {
    const createResponse = await createUseCase.execute({
      companyId: 'company-1',
    });

    await deleteUseCase.execute({
      companyId: 'company-1',
    });

    const deleted = await repository.findById(
      createResponse.fiscalSettings.id,
      {
        includeDeleted: true,
      },
    );

    expect(deleted?.deletedAt).toBeDefined();
  });
});
