import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';
import { InMemoryOffboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-offboarding-checklists-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { ListOffboardingChecklistsUseCase } from './list-offboarding-checklists';

let offboardingChecklistsRepository: InMemoryOffboardingChecklistsRepository;
let listOffboardingChecklistsUseCase: ListOffboardingChecklistsUseCase;

const TENANT_ID = new UniqueEntityID().toString();

function createChecklist(overrides: {
  employeeId?: string;
  progress?: number;
  title?: string;
}) {
  const checklist = OffboardingChecklist.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    employeeId: new UniqueEntityID(overrides.employeeId),
    title: overrides.title ?? 'Checklist de Desligamento',
    items: [{ id: 'item-1', title: 'Item test', completed: false }],
    progress: overrides.progress,
  });
  return checklist;
}

describe('ListOffboardingChecklistsUseCase', () => {
  beforeEach(() => {
    offboardingChecklistsRepository =
      new InMemoryOffboardingChecklistsRepository();
    listOffboardingChecklistsUseCase = new ListOffboardingChecklistsUseCase(
      offboardingChecklistsRepository,
    );
  });

  it('should list offboarding checklists with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await offboardingChecklistsRepository.create(
        createChecklist({ employeeId: new UniqueEntityID().toString() }),
      );
    }

    const result = await listOffboardingChecklistsUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 3,
    });

    expect(result.checklists).toHaveLength(3);
    expect(result.meta.total).toBe(5);
    expect(result.meta.totalPages).toBe(2);
  });

  it('should filter by status COMPLETED', async () => {
    await offboardingChecklistsRepository.create(
      createChecklist({
        employeeId: new UniqueEntityID().toString(),
        progress: 100,
      }),
    );
    await offboardingChecklistsRepository.create(
      createChecklist({
        employeeId: new UniqueEntityID().toString(),
        progress: 50,
      }),
    );

    const result = await listOffboardingChecklistsUseCase.execute({
      tenantId: TENANT_ID,
      status: 'COMPLETED',
    });

    expect(result.checklists).toHaveLength(1);
    expect(result.checklists[0].progress).toBe(100);
  });

  it('should filter by status IN_PROGRESS', async () => {
    await offboardingChecklistsRepository.create(
      createChecklist({
        employeeId: new UniqueEntityID().toString(),
        progress: 100,
      }),
    );
    await offboardingChecklistsRepository.create(
      createChecklist({
        employeeId: new UniqueEntityID().toString(),
        progress: 50,
      }),
    );

    const result = await listOffboardingChecklistsUseCase.execute({
      tenantId: TENANT_ID,
      status: 'IN_PROGRESS',
    });

    expect(result.checklists).toHaveLength(1);
  });

  it('should filter by search term', async () => {
    await offboardingChecklistsRepository.create(
      createChecklist({
        employeeId: new UniqueEntityID().toString(),
        title: 'Desligamento TI',
      }),
    );
    await offboardingChecklistsRepository.create(
      createChecklist({
        employeeId: new UniqueEntityID().toString(),
        title: 'Desligamento RH',
      }),
    );

    const result = await listOffboardingChecklistsUseCase.execute({
      tenantId: TENANT_ID,
      search: 'TI',
    });

    expect(result.checklists).toHaveLength(1);
    expect(result.checklists[0].title).toBe('Desligamento TI');
  });

  it('should return empty when no checklists exist', async () => {
    const result = await listOffboardingChecklistsUseCase.execute({
      tenantId: TENANT_ID,
    });

    expect(result.checklists).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });
});
