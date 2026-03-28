import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';
import { InMemoryOffboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-offboarding-checklists-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { GetOffboardingChecklistUseCase } from './get-offboarding-checklist';

let offboardingChecklistsRepository: InMemoryOffboardingChecklistsRepository;
let getOffboardingChecklistUseCase: GetOffboardingChecklistUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const EMPLOYEE_ID = new UniqueEntityID().toString();

describe('GetOffboardingChecklistUseCase', () => {
  beforeEach(() => {
    offboardingChecklistsRepository =
      new InMemoryOffboardingChecklistsRepository();
    getOffboardingChecklistUseCase = new GetOffboardingChecklistUseCase(
      offboardingChecklistsRepository,
    );
  });

  it('should return an offboarding checklist by id', async () => {
    const checklist = OffboardingChecklist.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      title: 'Checklist de Desligamento',
      items: [{ id: 'item-1', title: 'Revogar acesso', completed: false }],
    });
    await offboardingChecklistsRepository.create(checklist);

    const result = await getOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      id: checklist.id.toString(),
    });

    expect(result.checklist.id.equals(checklist.id)).toBe(true);
    expect(result.checklist.title).toBe('Checklist de Desligamento');
  });

  it('should throw when checklist is not found', async () => {
    await expect(
      getOffboardingChecklistUseCase.execute({
        tenantId: TENANT_ID,
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not return a deleted checklist', async () => {
    const checklist = OffboardingChecklist.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      title: 'Checklist de Desligamento',
      items: [],
    });
    await offboardingChecklistsRepository.create(checklist);
    await offboardingChecklistsRepository.delete(checklist.id);

    await expect(
      getOffboardingChecklistUseCase.execute({
        tenantId: TENANT_ID,
        id: checklist.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
