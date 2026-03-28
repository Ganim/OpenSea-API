import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import { InMemoryOnboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-onboarding-checklists-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateOnboardingChecklistUseCase } from './update-onboarding-checklist';

let onboardingChecklistsRepository: InMemoryOnboardingChecklistsRepository;
let sut: UpdateOnboardingChecklistUseCase;

const TENANT_ID = new UniqueEntityID().toString();

function createChecklist(tenantId: string = TENANT_ID) {
  return OnboardingChecklist.create({
    tenantId: new UniqueEntityID(tenantId),
    employeeId: new UniqueEntityID(),
    title: 'Onboarding',
    items: [
      {
        id: 'item-1',
        title: 'Read policies',
        description: 'Review handbook',
        completed: false,
      },
      {
        id: 'item-2',
        title: 'Set up workstation',
        description: 'Configure computer',
        completed: false,
      },
    ],
  });
}

describe('UpdateOnboardingChecklistUseCase', () => {
  beforeEach(() => {
    onboardingChecklistsRepository =
      new InMemoryOnboardingChecklistsRepository();
    sut = new UpdateOnboardingChecklistUseCase(onboardingChecklistsRepository);
  });

  it('should update the title of a checklist', async () => {
    const checklist = createChecklist();
    await onboardingChecklistsRepository.create(checklist);

    const { checklist: updatedChecklist } = await sut.execute({
      tenantId: TENANT_ID,
      id: checklist.id.toString(),
      title: 'Engineering Onboarding',
    });

    expect(updatedChecklist.title).toBe('Engineering Onboarding');
  });

  it('should update items and recalculate progress', async () => {
    const checklist = createChecklist();
    await onboardingChecklistsRepository.create(checklist);

    const { checklist: updatedChecklist } = await sut.execute({
      tenantId: TENANT_ID,
      id: checklist.id.toString(),
      items: [
        { title: 'New task 1', description: 'Description 1' },
        { title: 'New task 2', description: 'Description 2' },
        { title: 'New task 3', description: 'Description 3' },
      ],
    });

    expect(updatedChecklist.items).toHaveLength(3);
    expect(updatedChecklist.items[0].title).toBe('New task 1');
    expect(updatedChecklist.progress).toBe(0);
  });

  it('should preserve completed items when they match by title', async () => {
    const checklist = createChecklist();
    await onboardingChecklistsRepository.create(checklist);

    // Complete the first item
    checklist.completeItem('item-1');
    await onboardingChecklistsRepository.save(checklist);

    const { checklist: updatedChecklist } = await sut.execute({
      tenantId: TENANT_ID,
      id: checklist.id.toString(),
      items: [
        { title: 'Read policies', description: 'Updated description' },
        { title: 'New task', description: 'Completely new' },
      ],
    });

    const preservedItem = updatedChecklist.items.find(
      (item) => item.title === 'Read policies',
    );
    expect(preservedItem?.completed).toBe(true);
    expect(preservedItem?.description).toBe('Updated description');

    const newItem = updatedChecklist.items.find(
      (item) => item.title === 'New task',
    );
    expect(newItem?.completed).toBe(false);
  });

  it('should throw ResourceNotFoundError when checklist does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: new UniqueEntityID().toString(),
        title: 'Updated',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update a checklist from a different tenant', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    const checklist = createChecklist(otherTenantId);
    await onboardingChecklistsRepository.create(checklist);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: checklist.id.toString(),
        title: 'Hacked',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should update both title and items simultaneously', async () => {
    const checklist = createChecklist();
    await onboardingChecklistsRepository.create(checklist);

    const { checklist: updatedChecklist } = await sut.execute({
      tenantId: TENANT_ID,
      id: checklist.id.toString(),
      title: 'Dev Onboarding',
      items: [{ title: 'Install IDE' }],
    });

    expect(updatedChecklist.title).toBe('Dev Onboarding');
    expect(updatedChecklist.items).toHaveLength(1);
    expect(updatedChecklist.items[0].title).toBe('Install IDE');
  });
});
