import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import { InMemoryOnboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-onboarding-checklists-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { GetMyOnboardingUseCase } from './get-my-onboarding';

let onboardingChecklistsRepository: InMemoryOnboardingChecklistsRepository;
let getMyOnboardingUseCase: GetMyOnboardingUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const EMPLOYEE_ID = new UniqueEntityID().toString();

function createTestChecklist(
  employeeId: string = EMPLOYEE_ID,
  tenantId: string = TENANT_ID,
) {
  return OnboardingChecklist.create({
    tenantId: new UniqueEntityID(tenantId),
    employeeId: new UniqueEntityID(employeeId),
    title: 'Onboarding',
    items: [
      {
        id: 'item-1',
        title: 'Complete personal info',
        description: 'Fill in details',
        completed: false,
      },
      {
        id: 'item-2',
        title: 'Read policies',
        description: 'Review handbook',
        completed: false,
      },
    ],
  });
}

describe('GetMyOnboardingUseCase', () => {
  beforeEach(() => {
    onboardingChecklistsRepository =
      new InMemoryOnboardingChecklistsRepository();
    getMyOnboardingUseCase = new GetMyOnboardingUseCase(
      onboardingChecklistsRepository,
    );
  });

  it('should return the onboarding checklist for an employee', async () => {
    const checklist = createTestChecklist();
    await onboardingChecklistsRepository.create(checklist);

    const { checklist: foundChecklist } = await getMyOnboardingUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    expect(foundChecklist).toBeDefined();
    expect(foundChecklist.employeeId.toString()).toBe(EMPLOYEE_ID);
    expect(foundChecklist.tenantId.toString()).toBe(TENANT_ID);
    expect(foundChecklist.items).toHaveLength(2);
  });

  it('should return the correct checklist when multiple exist', async () => {
    const secondEmployeeId = new UniqueEntityID().toString();

    const firstChecklist = createTestChecklist(EMPLOYEE_ID);
    const secondChecklist = createTestChecklist(secondEmployeeId);

    await onboardingChecklistsRepository.create(firstChecklist);
    await onboardingChecklistsRepository.create(secondChecklist);

    const { checklist: foundChecklist } = await getMyOnboardingUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    expect(foundChecklist.employeeId.toString()).toBe(EMPLOYEE_ID);
  });

  it('should throw ResourceNotFoundError when checklist does not exist', async () => {
    await expect(
      getMyOnboardingUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);

    await expect(
      getMyOnboardingUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Onboarding checklist not found');
  });

  it('should not find checklist from a different tenant', async () => {
    const checklist = createTestChecklist();
    await onboardingChecklistsRepository.create(checklist);

    const differentTenantId = new UniqueEntityID().toString();

    await expect(
      getMyOnboardingUseCase.execute({
        tenantId: differentTenantId,
        employeeId: EMPLOYEE_ID,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should return checklist with progress data', async () => {
    const checklist = createTestChecklist();
    await onboardingChecklistsRepository.create(checklist);

    const { checklist: foundChecklist } = await getMyOnboardingUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    expect(foundChecklist.progress).toBe(0);
    expect(foundChecklist.isComplete()).toBe(false);
  });

  it('should return checklist with updated progress after completing items', async () => {
    const checklist = createTestChecklist();
    await onboardingChecklistsRepository.create(checklist);

    // Complete one item
    checklist.completeItem('item-1');
    await onboardingChecklistsRepository.save(checklist);

    const { checklist: foundChecklist } = await getMyOnboardingUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    expect(foundChecklist.progress).toBe(50);
  });
});
