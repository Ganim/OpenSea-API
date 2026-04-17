import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryOverdueEscalationsRepository } from '@/repositories/finance/in-memory/in-memory-overdue-escalations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToggleOverdueEscalationActiveUseCase } from './toggle-overdue-escalation-active';

let repository: InMemoryOverdueEscalationsRepository;
let sut: ToggleOverdueEscalationActiveUseCase;

describe('ToggleOverdueEscalationActiveUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryOverdueEscalationsRepository();
    sut = new ToggleOverdueEscalationActiveUseCase(repository);
  });

  it('should flip an active template to inactive', async () => {
    const source = await repository.create({
      tenantId: 'tenant-1',
      name: 'X',
      isActive: true,
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

    const result = await sut.execute({
      id: source.id.toString(),
      tenantId: 'tenant-1',
    });
    expect(result.escalation.isActive).toBe(false);
  });

  it('should flip an inactive template to active', async () => {
    const source = await repository.create({
      tenantId: 'tenant-1',
      name: 'X',
      isActive: false,
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

    const result = await sut.execute({
      id: source.id.toString(),
      tenantId: 'tenant-1',
    });
    expect(result.escalation.isActive).toBe(true);
  });

  it('should 404 when template does not exist', async () => {
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
