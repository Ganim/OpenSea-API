import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';
import { InMemoryOffboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-offboarding-checklists-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { GetOffboardingByEmployeeUseCase } from './get-offboarding-by-employee';

let offboardingChecklistsRepository: InMemoryOffboardingChecklistsRepository;
let getOffboardingByEmployeeUseCase: GetOffboardingByEmployeeUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const EMPLOYEE_ID = new UniqueEntityID().toString();

describe('GetOffboardingByEmployeeUseCase', () => {
  beforeEach(() => {
    offboardingChecklistsRepository =
      new InMemoryOffboardingChecklistsRepository();
    getOffboardingByEmployeeUseCase = new GetOffboardingByEmployeeUseCase(
      offboardingChecklistsRepository,
    );
  });

  it('should return offboarding checklist by employee id', async () => {
    const checklist = OffboardingChecklist.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      title: 'Checklist de Desligamento',
      items: [{ id: 'item-1', title: 'Test', completed: false }],
    });
    await offboardingChecklistsRepository.create(checklist);

    const result = await getOffboardingByEmployeeUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    expect(result.checklist.employeeId.toString()).toBe(EMPLOYEE_ID);
  });

  it('should throw when checklist is not found for employee', async () => {
    await expect(
      getOffboardingByEmployeeUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
