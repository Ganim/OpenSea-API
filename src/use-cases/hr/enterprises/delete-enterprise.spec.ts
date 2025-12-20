import { InMemoryEnterprisesRepository } from '@/repositories/hr/in-memory/in-memory-enterprises-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteEnterpriseUseCase } from './delete-enterprise';
import { CreateEnterpriseUseCase } from './create-enterprise';

let enterprisesRepository: InMemoryEnterprisesRepository;
let deleteEnterpriseUseCase: DeleteEnterpriseUseCase;
let createEnterpriseUseCase: CreateEnterpriseUseCase;

describe('Delete Enterprise Use Case', () => {
  beforeEach(() => {
    enterprisesRepository = new InMemoryEnterprisesRepository();
    deleteEnterpriseUseCase = new DeleteEnterpriseUseCase(enterprisesRepository);
    createEnterpriseUseCase = new CreateEnterpriseUseCase(enterprisesRepository);
  });

  it('should delete enterprise', async () => {
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await deleteEnterpriseUseCase.execute({
      id: created.enterprise.id.toString(),
    });

    expect(result.success).toBe(true);
  });

  it('should soft delete enterprise', async () => {
    const created = await createEnterpriseUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const enterpriseId = created.enterprise.id.toString();

    await deleteEnterpriseUseCase.execute({
      id: enterpriseId,
    });

    // Enterprise should not be found after deletion
    const foundEnterprise = await enterprisesRepository.findById(
      created.enterprise.id,
    );
    expect(foundEnterprise).toBeNull();
  });
});
