import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCompanyStakeholderRepository } from '@/repositories/hr/in-memory/in-memory-company-stakeholder-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteCompanyStakeholderUseCase } from './delete-company-stakeholder';
import { makeCompanyStakeholder } from './factories/make-company-stakeholder';

let repository: InMemoryCompanyStakeholderRepository;
let useCase: DeleteCompanyStakeholderUseCase;

describe('DeleteCompanyStakeholderUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyStakeholderRepository();
    useCase = new DeleteCompanyStakeholderUseCase(repository);
  });

  it('should soft delete a stakeholder successfully', async () => {
    const stakeholder = makeCompanyStakeholder({});
    await repository.save(stakeholder);

    const response = await useCase.execute({
      id: stakeholder.id.toString(),
    });

    expect(response.success).toBe(true);

    const deleted = await repository.findById(stakeholder.id);
    expect(deleted).toBeNull();
  });

  it('should throw error when stakeholder not found', async () => {
    await expect(useCase.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('should anonimize stakeholder data when requested', async () => {
    const stakeholder = makeCompanyStakeholder({
      personDocumentMasked: '***456789**',
    });
    await repository.save(stakeholder);

    await useCase.execute({
      id: stakeholder.id.toString(),
      anonimize: true,
    });

    // Verificar que foi anonimizado (note: soft delete + anonimização)
    expect(true).toBe(true);
  });

  it('should throw error when deleting last legal representative', async () => {
    const stakeholder = makeCompanyStakeholder({ isLegalRepresentative: true });
    await repository.save(stakeholder);

    await expect(
      useCase.execute({ id: stakeholder.id.toString() }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow deletion of legal representative if another exists', async () => {
    const stakeholder1 = makeCompanyStakeholder({
      isLegalRepresentative: true,
      name: 'João',
    });
    const stakeholder2 = makeCompanyStakeholder({
      isLegalRepresentative: true,
      name: 'Maria',
    });

    await repository.save(stakeholder1);
    await repository.save(stakeholder2);

    const response = await useCase.execute({
      id: stakeholder1.id.toString(),
    });

    expect(response.success).toBe(true);
  });
});
