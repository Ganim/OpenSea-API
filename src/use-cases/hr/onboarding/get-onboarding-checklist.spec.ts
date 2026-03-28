import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import { InMemoryOnboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-onboarding-checklists-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetOnboardingChecklistUseCase } from './get-onboarding-checklist';

let onboardingChecklistsRepository: InMemoryOnboardingChecklistsRepository;
let sut: GetOnboardingChecklistUseCase;

const TENANT_ID = new UniqueEntityID().toString();

function createChecklist(tenantId: string = TENANT_ID) {
  return OnboardingChecklist.create({
    tenantId: new UniqueEntityID(tenantId),
    employeeId: new UniqueEntityID(),
    title: 'Engineering Onboarding',
    items: [
      {
        id: 'item-1',
        title: 'Set up workstation',
        description: 'Configure your development environment',
        completed: false,
      },
    ],
  });
}

describe('GetOnboardingChecklistUseCase', () => {
  beforeEach(() => {
    onboardingChecklistsRepository =
      new InMemoryOnboardingChecklistsRepository();
    sut = new GetOnboardingChecklistUseCase(onboardingChecklistsRepository);
  });

  it('should return a checklist by ID', async () => {
    const checklist = createChecklist();
    await onboardingChecklistsRepository.create(checklist);

    const { checklist: foundChecklist } = await sut.execute({
      tenantId: TENANT_ID,
      id: checklist.id.toString(),
    });

    expect(foundChecklist).toBeDefined();
    expect(foundChecklist.id.equals(checklist.id)).toBe(true);
    expect(foundChecklist.title).toBe('Engineering Onboarding');
    expect(foundChecklist.items).toHaveLength(1);
  });

  it('should throw ResourceNotFoundError when checklist does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not return a checklist from a different tenant', async () => {
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

  it('should not return a soft-deleted checklist', async () => {
    const checklist = createChecklist();
    await onboardingChecklistsRepository.create(checklist);
    checklist.softDelete();
    await onboardingChecklistsRepository.save(checklist);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: checklist.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
