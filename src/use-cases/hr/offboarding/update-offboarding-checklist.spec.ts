import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';
import { InMemoryOffboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-offboarding-checklists-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateOffboardingChecklistUseCase } from './update-offboarding-checklist';

let offboardingChecklistsRepository: InMemoryOffboardingChecklistsRepository;
let updateOffboardingChecklistUseCase: UpdateOffboardingChecklistUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const EMPLOYEE_ID = new UniqueEntityID().toString();

describe('UpdateOffboardingChecklistUseCase', () => {
  beforeEach(() => {
    offboardingChecklistsRepository =
      new InMemoryOffboardingChecklistsRepository();
    updateOffboardingChecklistUseCase = new UpdateOffboardingChecklistUseCase(
      offboardingChecklistsRepository,
    );
  });

  it('should update the title of an offboarding checklist', async () => {
    const checklist = OffboardingChecklist.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      title: 'Checklist de Desligamento',
      items: [{ id: 'item-1', title: 'Test item', completed: false }],
    });
    await offboardingChecklistsRepository.create(checklist);

    const { checklist: updated } =
      await updateOffboardingChecklistUseCase.execute({
        tenantId: TENANT_ID,
        id: checklist.id.toString(),
        title: 'Desligamento Atualizado',
      });

    expect(updated.title).toBe('Desligamento Atualizado');
  });

  it('should update items preserving completed ones', async () => {
    const checklist = OffboardingChecklist.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      title: 'Checklist de Desligamento',
      items: [
        {
          id: 'item-1',
          title: 'Coletar crachá',
          completed: true,
          completedAt: new Date(),
        },
        { id: 'item-2', title: 'Revogar acesso', completed: false },
      ],
    });
    await offboardingChecklistsRepository.create(checklist);

    const { checklist: updated } =
      await updateOffboardingChecklistUseCase.execute({
        tenantId: TENANT_ID,
        id: checklist.id.toString(),
        items: [
          { title: 'Coletar crachá', description: 'Crachá e cartões' },
          { title: 'Nova tarefa' },
        ],
      });

    expect(updated.items).toHaveLength(2);
    const preservedItem = updated.items.find(
      (item) => item.title === 'Coletar crachá',
    );
    expect(preservedItem?.completed).toBe(true);
    expect(preservedItem?.description).toBe('Crachá e cartões');

    const newItem = updated.items.find((item) => item.title === 'Nova tarefa');
    expect(newItem?.completed).toBe(false);
  });

  it('should throw when checklist is not found', async () => {
    await expect(
      updateOffboardingChecklistUseCase.execute({
        tenantId: TENANT_ID,
        id: new UniqueEntityID().toString(),
        title: 'Updated',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
