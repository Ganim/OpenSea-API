import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryOverdueEscalationsRepository } from '@/repositories/finance/in-memory/in-memory-overdue-escalations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DuplicateOverdueEscalationUseCase } from './duplicate-overdue-escalation';

let repository: InMemoryOverdueEscalationsRepository;
let sut: DuplicateOverdueEscalationUseCase;

describe('DuplicateOverdueEscalationUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryOverdueEscalationsRepository();
    sut = new DuplicateOverdueEscalationUseCase(repository);
  });

  it('should duplicate an escalation appending "(cópia)" to the name', async () => {
    const source = await repository.create({
      tenantId: 'tenant-1',
      name: 'Régua padrão',
      isDefault: true,
      isActive: true,
      steps: [
        {
          daysOverdue: 3,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'Olá, sua fatura venceu',
          order: 1,
          isActive: true,
        },
      ],
    });

    const result = await sut.execute({
      id: source.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.escalation.name).toBe('Régua padrão (cópia)');
    expect(result.escalation.isDefault).toBe(false);
    expect(result.escalation.steps).toHaveLength(1);
    expect(repository.items).toHaveLength(2);
  });

  it('should number collisions "(cópia 2)", "(cópia 3)", ...', async () => {
    const source = await repository.create({
      tenantId: 'tenant-1',
      name: 'X',
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'msg',
          order: 1,
        },
      ],
    });

    const first = await sut.execute({
      id: source.id.toString(),
      tenantId: 'tenant-1',
    });
    const second = await sut.execute({
      id: source.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(first.escalation.name).toBe('X (cópia)');
    expect(second.escalation.name).toBe('X (cópia 2)');
  });

  it('should 404 when source does not exist', async () => {
    await expect(
      sut.execute({ id: 'non-existent', tenantId: 'tenant-1' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should isolate across tenants', async () => {
    const source = await repository.create({
      tenantId: 'tenant-1',
      name: 'X',
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'msg',
          order: 1,
        },
      ],
    });

    await expect(
      sut.execute({ id: source.id.toString(), tenantId: 'tenant-2' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
