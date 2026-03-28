import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';
import { InMemoryOffboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-offboarding-checklists-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { CompleteOffboardingItemUseCase } from './complete-offboarding-item';

let offboardingChecklistsRepository: InMemoryOffboardingChecklistsRepository;
let completeOffboardingItemUseCase: CompleteOffboardingItemUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const EMPLOYEE_ID = new UniqueEntityID().toString();

function createTestChecklist(): OffboardingChecklist {
  return OffboardingChecklist.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    employeeId: new UniqueEntityID(EMPLOYEE_ID),
    title: 'Checklist de Desligamento',
    items: [
      {
        id: 'item-1',
        title: 'Coletar crachá',
        completed: false,
      },
      {
        id: 'item-2',
        title: 'Revogar acesso',
        completed: false,
      },
    ],
  });
}

describe('CompleteOffboardingItemUseCase', () => {
  beforeEach(() => {
    offboardingChecklistsRepository =
      new InMemoryOffboardingChecklistsRepository();
    completeOffboardingItemUseCase = new CompleteOffboardingItemUseCase(
      offboardingChecklistsRepository,
    );
  });

  it('should complete an offboarding item', async () => {
    const checklist = createTestChecklist();
    await offboardingChecklistsRepository.create(checklist);

    const { checklist: updatedChecklist } =
      await completeOffboardingItemUseCase.execute({
        tenantId: TENANT_ID,
        checklistId: checklist.id.toString(),
        itemId: 'item-1',
      });

    const completedItem = updatedChecklist.items.find(
      (item) => item.id === 'item-1',
    );
    expect(completedItem?.completed).toBe(true);
    expect(completedItem?.completedAt).toBeInstanceOf(Date);
    expect(updatedChecklist.progress).toBe(50);
  });

  it('should complete all items and reach 100% progress', async () => {
    const checklist = createTestChecklist();
    await offboardingChecklistsRepository.create(checklist);

    await completeOffboardingItemUseCase.execute({
      tenantId: TENANT_ID,
      checklistId: checklist.id.toString(),
      itemId: 'item-1',
    });

    const { checklist: fullyCompleted } =
      await completeOffboardingItemUseCase.execute({
        tenantId: TENANT_ID,
        checklistId: checklist.id.toString(),
        itemId: 'item-2',
      });

    expect(fullyCompleted.progress).toBe(100);
    expect(fullyCompleted.isComplete()).toBe(true);
  });

  it('should throw when checklist is not found', async () => {
    await expect(
      completeOffboardingItemUseCase.execute({
        tenantId: TENANT_ID,
        checklistId: new UniqueEntityID().toString(),
        itemId: 'item-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when item is not found', async () => {
    const checklist = createTestChecklist();
    await offboardingChecklistsRepository.create(checklist);

    await expect(
      completeOffboardingItemUseCase.execute({
        tenantId: TENANT_ID,
        checklistId: checklist.id.toString(),
        itemId: 'nonexistent-item',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when item is already completed', async () => {
    const checklist = createTestChecklist();
    await offboardingChecklistsRepository.create(checklist);

    await completeOffboardingItemUseCase.execute({
      tenantId: TENANT_ID,
      checklistId: checklist.id.toString(),
      itemId: 'item-1',
    });

    await expect(
      completeOffboardingItemUseCase.execute({
        tenantId: TENANT_ID,
        checklistId: checklist.id.toString(),
        itemId: 'item-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
