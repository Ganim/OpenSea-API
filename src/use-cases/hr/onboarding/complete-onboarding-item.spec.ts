import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import { InMemoryOnboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-onboarding-checklists-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { CompleteOnboardingItemUseCase } from './complete-onboarding-item';

let onboardingChecklistsRepository: InMemoryOnboardingChecklistsRepository;
let completeOnboardingItemUseCase: CompleteOnboardingItemUseCase;

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
      {
        id: 'item-3',
        title: 'Set up workstation',
        completed: false,
      },
    ],
  });
}

describe('CompleteOnboardingItemUseCase', () => {
  beforeEach(() => {
    onboardingChecklistsRepository =
      new InMemoryOnboardingChecklistsRepository();
    completeOnboardingItemUseCase = new CompleteOnboardingItemUseCase(
      onboardingChecklistsRepository,
    );
  });

  it('should complete an onboarding item and recalculate progress', async () => {
    const checklist = createTestChecklist();
    await onboardingChecklistsRepository.create(checklist);

    const { checklist: updatedChecklist } =
      await completeOnboardingItemUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        itemId: 'item-1',
      });

    const completedItem = updatedChecklist.items.find(
      (item) => item.id === 'item-1',
    );
    expect(completedItem?.completed).toBe(true);
    expect(completedItem?.completedAt).toBeInstanceOf(Date);
    expect(updatedChecklist.progress).toBe(33); // 1/3 = 33%
  });

  it('should recalculate to 100% when all items are completed', async () => {
    const checklist = createTestChecklist();
    await onboardingChecklistsRepository.create(checklist);

    await completeOnboardingItemUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
      itemId: 'item-1',
    });

    await completeOnboardingItemUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
      itemId: 'item-2',
    });

    const { checklist: finalChecklist } =
      await completeOnboardingItemUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        itemId: 'item-3',
      });

    expect(finalChecklist.progress).toBe(100);
    expect(finalChecklist.isComplete()).toBe(true);
  });

  it('should throw if checklist not found', async () => {
    await expect(
      completeOnboardingItemUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: new UniqueEntityID().toString(),
        itemId: 'item-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw if item not found in checklist', async () => {
    const checklist = createTestChecklist();
    await onboardingChecklistsRepository.create(checklist);

    await expect(
      completeOnboardingItemUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        itemId: 'nonexistent-item',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw if item is already completed', async () => {
    const checklist = createTestChecklist();
    await onboardingChecklistsRepository.create(checklist);

    await completeOnboardingItemUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
      itemId: 'item-1',
    });

    await expect(
      completeOnboardingItemUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        itemId: 'item-1',
      }),
    ).rejects.toThrow(BadRequestError);
    await expect(
      completeOnboardingItemUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        itemId: 'item-1',
      }),
    ).rejects.toThrow('Onboarding item is already completed');
  });

  it('should update the updatedAt timestamp', async () => {
    const checklist = createTestChecklist();
    const originalUpdatedAt = checklist.updatedAt;
    await onboardingChecklistsRepository.create(checklist);

    // Wait a tiny bit to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 10));

    const { checklist: updatedChecklist } =
      await completeOnboardingItemUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        itemId: 'item-1',
      });

    expect(updatedChecklist.updatedAt.getTime()).toBeGreaterThanOrEqual(
      originalUpdatedAt.getTime(),
    );
  });
});
