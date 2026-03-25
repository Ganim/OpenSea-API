import { InMemoryOverdueEscalationsRepository } from '@/repositories/finance/in-memory/in-memory-overdue-escalations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListOverdueEscalationsUseCase } from './list-overdue-escalations';

let escalationsRepository: InMemoryOverdueEscalationsRepository;
let sut: ListOverdueEscalationsUseCase;

const tenantId = 'tenant-1';

describe('ListOverdueEscalationsUseCase', () => {
  beforeEach(() => {
    escalationsRepository = new InMemoryOverdueEscalationsRepository();
    sut = new ListOverdueEscalationsUseCase(escalationsRepository);
  });

  it('should list escalation templates for a tenant', async () => {
    await escalationsRepository.create({
      tenantId,
      name: 'Padrão',
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'Test',
          order: 1,
        },
      ],
    });

    await escalationsRepository.create({
      tenantId,
      name: 'Agressivo',
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'URGENT_NOTICE',
          message: 'Test',
          order: 1,
        },
      ],
    });

    const { escalations, total } = await sut.execute({ tenantId });

    expect(total).toBe(2);
    expect(escalations).toHaveLength(2);
  });

  it('should filter by isActive', async () => {
    await escalationsRepository.create({
      tenantId,
      name: 'Active',
      isActive: true,
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'Test',
          order: 1,
        },
      ],
    });

    await escalationsRepository.create({
      tenantId,
      name: 'Inactive',
      isActive: false,
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'Test',
          order: 1,
        },
      ],
    });

    const { escalations, total } = await sut.execute({
      tenantId,
      isActive: true,
    });

    expect(total).toBe(1);
    expect(escalations[0].name).toBe('Active');
  });

  it('should return empty list when no templates exist', async () => {
    const { escalations, total } = await sut.execute({ tenantId });

    expect(total).toBe(0);
    expect(escalations).toHaveLength(0);
  });

  it('should not return escalations from other tenants', async () => {
    await escalationsRepository.create({
      tenantId: 'other-tenant',
      name: 'Other',
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'Test',
          order: 1,
        },
      ],
    });

    const { escalations, total } = await sut.execute({ tenantId });

    expect(total).toBe(0);
    expect(escalations).toHaveLength(0);
  });
});
