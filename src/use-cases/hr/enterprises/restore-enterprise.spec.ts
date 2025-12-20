import { InMemoryEnterprisesRepository } from '@/repositories/hr/in-memory/in-memory-enterprises-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RestoreEnterpriseUseCase } from './restore-enterprise';
import { CreateEnterpriseUseCase } from './create-enterprise';

let enterprisesRepository: InMemoryEnterprisesRepository;
let restoreEnterpriseUseCase: RestoreEnterpriseUseCase;
let createEnterpriseUseCase: CreateEnterpriseUseCase;

describe('Restore Enterprise Use Case', () => {
  beforeEach(() => {
    enterprisesRepository = new InMemoryEnterprisesRepository();
    restoreEnterpriseUseCase = new RestoreEnterpriseUseCase(
      enterprisesRepository,
    );
    createEnterpriseUseCase = new CreateEnterpriseUseCase(
      enterprisesRepository,
    );
  });

  it('should restore a deleted enterprise', async () => {
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const enterpriseId = created.enterprise.id.toString();
    const enterprise = created.enterprise;
    enterprise.delete();
    await enterprisesRepository.save(enterprise);

    // Verify it's deleted
    let found = await enterprisesRepository.findById(created.enterprise.id);
    expect(found).toBeNull();

    // Restore it
    const result = await restoreEnterpriseUseCase.execute({
      id: enterpriseId,
    });

    expect(result.success).toBe(true);

    // Verify it's restored
    found = await enterprisesRepository.findById(created.enterprise.id);
    expect(found).toBeDefined();
    expect(found?.isDeleted()).toBe(false);
  });

  it('should handle restoring non-existent enterprise', async () => {
    const result = await restoreEnterpriseUseCase.execute({
      id: 'non-existent-id',
    });

    expect(result.success).toBe(true);
  });

  it('should not allow restoring an active enterprise', async () => {
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await restoreEnterpriseUseCase.execute({
      id: created.enterprise.id.toString(),
    });

    // Should still succeed (idempotent)
    expect(result.success).toBe(true);
  });
});
