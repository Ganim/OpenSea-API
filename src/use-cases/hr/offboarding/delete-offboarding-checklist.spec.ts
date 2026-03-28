import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';
import { InMemoryOffboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-offboarding-checklists-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteOffboardingChecklistUseCase } from './delete-offboarding-checklist';

let offboardingChecklistsRepository: InMemoryOffboardingChecklistsRepository;
let deleteOffboardingChecklistUseCase: DeleteOffboardingChecklistUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const EMPLOYEE_ID = new UniqueEntityID().toString();

describe('DeleteOffboardingChecklistUseCase', () => {
  beforeEach(() => {
    offboardingChecklistsRepository =
      new InMemoryOffboardingChecklistsRepository();
    deleteOffboardingChecklistUseCase = new DeleteOffboardingChecklistUseCase(
      offboardingChecklistsRepository,
    );
  });

  it('should soft-delete an offboarding checklist', async () => {
    const checklist = OffboardingChecklist.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      title: 'Checklist de Desligamento',
      items: [],
    });
    await offboardingChecklistsRepository.create(checklist);

    const result = await deleteOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      id: checklist.id.toString(),
    });

    expect(result.success).toBe(true);

    // Should not be findable after deletion
    const found = await offboardingChecklistsRepository.findById(
      checklist.id,
      TENANT_ID,
    );
    expect(found).toBeNull();
  });

  it('should throw when checklist is not found', async () => {
    await expect(
      deleteOffboardingChecklistUseCase.execute({
        tenantId: TENANT_ID,
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
