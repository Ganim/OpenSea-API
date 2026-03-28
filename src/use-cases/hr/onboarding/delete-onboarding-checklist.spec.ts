import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import { InMemoryOnboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-onboarding-checklists-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteOnboardingChecklistUseCase } from './delete-onboarding-checklist';

let onboardingChecklistsRepository: InMemoryOnboardingChecklistsRepository;
let sut: DeleteOnboardingChecklistUseCase;

const TENANT_ID = new UniqueEntityID().toString();

function createChecklist(tenantId: string = TENANT_ID) {
  return OnboardingChecklist.create({
    tenantId: new UniqueEntityID(tenantId),
    employeeId: new UniqueEntityID(),
    title: 'Onboarding',
    items: [
      {
        id: 'item-1',
        title: 'Complete personal info',
        completed: false,
      },
    ],
  });
}

describe('DeleteOnboardingChecklistUseCase', () => {
  beforeEach(() => {
    onboardingChecklistsRepository =
      new InMemoryOnboardingChecklistsRepository();
    sut = new DeleteOnboardingChecklistUseCase(onboardingChecklistsRepository);
  });

  it('should soft delete a checklist', async () => {
    const checklist = createChecklist();
    await onboardingChecklistsRepository.create(checklist);

    const { success } = await sut.execute({
      tenantId: TENANT_ID,
      id: checklist.id.toString(),
    });

    expect(success).toBe(true);

    // Should not find it anymore via findById
    const found = await onboardingChecklistsRepository.findById(
      checklist.id,
      TENANT_ID,
    );
    expect(found).toBeNull();
  });

  it('should mark the checklist as deleted', async () => {
    const checklist = createChecklist();
    await onboardingChecklistsRepository.create(checklist);

    await sut.execute({
      tenantId: TENANT_ID,
      id: checklist.id.toString(),
    });

    // Access internal store directly
    const rawItem = onboardingChecklistsRepository.items.find((item) =>
      item.id.equals(checklist.id),
    );
    expect(rawItem?.isDeleted()).toBe(true);
    expect(rawItem?.deletedAt).toBeInstanceOf(Date);
  });

  it('should throw ResourceNotFoundError when checklist does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not delete a checklist from a different tenant', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    const checklist = createChecklist(otherTenantId);
    await onboardingChecklistsRepository.create(checklist);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: checklist.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not find an already deleted checklist', async () => {
    const checklist = createChecklist();
    await onboardingChecklistsRepository.create(checklist);

    await sut.execute({
      tenantId: TENANT_ID,
      id: checklist.id.toString(),
    });

    // Attempting to delete again should fail
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: checklist.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
