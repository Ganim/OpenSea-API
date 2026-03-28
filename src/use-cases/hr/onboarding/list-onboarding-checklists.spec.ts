import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import { InMemoryOnboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-onboarding-checklists-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListOnboardingChecklistsUseCase } from './list-onboarding-checklists';

let onboardingChecklistsRepository: InMemoryOnboardingChecklistsRepository;
let sut: ListOnboardingChecklistsUseCase;

const TENANT_ID = new UniqueEntityID().toString();

function createChecklist(
  overrides: {
    employeeId?: string;
    tenantId?: string;
    title?: string;
    allCompleted?: boolean;
  } = {},
) {
  const employeeId = overrides.employeeId ?? new UniqueEntityID().toString();
  const items = [
    {
      id: 'item-1',
      title: 'Task 1',
      description: 'Do task 1',
      completed: overrides.allCompleted ?? false,
      completedAt: overrides.allCompleted ? new Date() : undefined,
    },
    {
      id: 'item-2',
      title: 'Task 2',
      completed: overrides.allCompleted ?? false,
      completedAt: overrides.allCompleted ? new Date() : undefined,
    },
  ];

  return OnboardingChecklist.create({
    tenantId: new UniqueEntityID(overrides.tenantId ?? TENANT_ID),
    employeeId: new UniqueEntityID(employeeId),
    title: overrides.title ?? 'Onboarding',
    items,
  });
}

describe('ListOnboardingChecklistsUseCase', () => {
  beforeEach(() => {
    onboardingChecklistsRepository =
      new InMemoryOnboardingChecklistsRepository();
    sut = new ListOnboardingChecklistsUseCase(onboardingChecklistsRepository);
  });

  it('should list onboarding checklists with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await onboardingChecklistsRepository.create(createChecklist());
    }

    const { checklists, meta } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 3,
    });

    expect(checklists).toHaveLength(3);
    expect(meta.total).toBe(5);
    expect(meta.page).toBe(1);
    expect(meta.perPage).toBe(3);
    expect(meta.totalPages).toBe(2);
  });

  it('should return second page', async () => {
    for (let i = 0; i < 5; i++) {
      await onboardingChecklistsRepository.create(createChecklist());
    }

    const { checklists, meta } = await sut.execute({
      tenantId: TENANT_ID,
      page: 2,
      perPage: 3,
    });

    expect(checklists).toHaveLength(2);
    expect(meta.page).toBe(2);
  });

  it('should filter by employeeId', async () => {
    const targetEmployeeId = new UniqueEntityID().toString();
    await onboardingChecklistsRepository.create(
      createChecklist({ employeeId: targetEmployeeId }),
    );
    await onboardingChecklistsRepository.create(createChecklist());
    await onboardingChecklistsRepository.create(createChecklist());

    const { checklists } = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: targetEmployeeId,
    });

    expect(checklists).toHaveLength(1);
    expect(checklists[0].employeeId.toString()).toBe(targetEmployeeId);
  });

  it('should filter by status COMPLETED', async () => {
    await onboardingChecklistsRepository.create(
      createChecklist({ allCompleted: true }),
    );
    await onboardingChecklistsRepository.create(createChecklist());

    const { checklists } = await sut.execute({
      tenantId: TENANT_ID,
      status: 'COMPLETED',
    });

    expect(checklists).toHaveLength(1);
    expect(checklists[0].isComplete()).toBe(true);
  });

  it('should filter by status IN_PROGRESS', async () => {
    await onboardingChecklistsRepository.create(
      createChecklist({ allCompleted: true }),
    );
    await onboardingChecklistsRepository.create(createChecklist());

    const { checklists } = await sut.execute({
      tenantId: TENANT_ID,
      status: 'IN_PROGRESS',
    });

    expect(checklists).toHaveLength(1);
    expect(checklists[0].isComplete()).toBe(false);
  });

  it('should filter by search term on title', async () => {
    await onboardingChecklistsRepository.create(
      createChecklist({ title: 'Engineering Onboarding' }),
    );
    await onboardingChecklistsRepository.create(
      createChecklist({ title: 'Sales Onboarding' }),
    );

    const { checklists } = await sut.execute({
      tenantId: TENANT_ID,
      search: 'engineering',
    });

    expect(checklists).toHaveLength(1);
    expect(checklists[0].title).toBe('Engineering Onboarding');
  });

  it('should not return checklists from different tenants', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    await onboardingChecklistsRepository.create(
      createChecklist({ tenantId: otherTenantId }),
    );
    await onboardingChecklistsRepository.create(createChecklist());

    const { checklists } = await sut.execute({ tenantId: TENANT_ID });

    expect(checklists).toHaveLength(1);
  });

  it('should not return soft-deleted checklists', async () => {
    const checklist = createChecklist();
    await onboardingChecklistsRepository.create(checklist);
    checklist.softDelete();
    await onboardingChecklistsRepository.save(checklist);

    const { checklists } = await sut.execute({ tenantId: TENANT_ID });

    expect(checklists).toHaveLength(0);
  });

  it('should return empty list when no checklists exist', async () => {
    const { checklists, meta } = await sut.execute({ tenantId: TENANT_ID });

    expect(checklists).toHaveLength(0);
    expect(meta.total).toBe(0);
    expect(meta.totalPages).toBe(0);
  });

  it('should use default pagination values', async () => {
    await onboardingChecklistsRepository.create(createChecklist());

    const { meta } = await sut.execute({ tenantId: TENANT_ID });

    expect(meta.page).toBe(1);
    expect(meta.perPage).toBe(20);
  });
});
