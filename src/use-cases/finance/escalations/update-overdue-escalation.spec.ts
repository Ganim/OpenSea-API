import { InMemoryOverdueEscalationsRepository } from '@/repositories/finance/in-memory/in-memory-overdue-escalations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateOverdueEscalationUseCase } from './update-overdue-escalation';

let escalationsRepository: InMemoryOverdueEscalationsRepository;
let sut: UpdateOverdueEscalationUseCase;

const tenantId = 'tenant-1';

describe('UpdateOverdueEscalationUseCase', () => {
  beforeEach(() => {
    escalationsRepository = new InMemoryOverdueEscalationsRepository();
    sut = new UpdateOverdueEscalationUseCase(escalationsRepository);
  });

  it('should update escalation name', async () => {
    const created = await escalationsRepository.create({
      tenantId,
      name: 'Original',
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

    const { escalation } = await sut.execute({
      id: created.id.toString(),
      tenantId,
      name: 'Updated Name',
    });

    expect(escalation.name).toBe('Updated Name');
  });

  it('should update escalation steps', async () => {
    const created = await escalationsRepository.create({
      tenantId,
      name: 'With Steps',
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'Old message',
          order: 1,
        },
      ],
    });

    const { escalation } = await sut.execute({
      id: created.id.toString(),
      tenantId,
      steps: [
        {
          daysOverdue: 3,
          channel: 'WHATSAPP',
          templateType: 'FORMAL_NOTICE',
          message: 'New message',
          order: 1,
        },
        {
          daysOverdue: 15,
          channel: 'SYSTEM_ALERT',
          templateType: 'URGENT_NOTICE',
          message: 'Alert!',
          order: 2,
        },
      ],
    });

    expect(escalation.steps).toHaveLength(2);
    expect(escalation.steps[0].channel).toBe('WHATSAPP');
    expect(escalation.steps[1].channel).toBe('SYSTEM_ALERT');
  });

  it('should throw if escalation not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent',
        tenantId,
        name: 'Nope',
      }),
    ).rejects.toThrow('Escalation template not found');
  });

  it('should throw on duplicate name', async () => {
    await escalationsRepository.create({
      tenantId,
      name: 'Existing',
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

    const target = await escalationsRepository.create({
      tenantId,
      name: 'Target',
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

    await expect(
      sut.execute({
        id: target.id.toString(),
        tenantId,
        name: 'Existing',
      }),
    ).rejects.toThrow('already exists');
  });

  it('should clear other defaults when setting isDefault', async () => {
    await escalationsRepository.create({
      tenantId,
      name: 'First',
      isDefault: true,
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

    const second = await escalationsRepository.create({
      tenantId,
      name: 'Second',
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

    await sut.execute({
      id: second.id.toString(),
      tenantId,
      isDefault: true,
    });

    expect(escalationsRepository.items[0].isDefault).toBe(false);
    expect(escalationsRepository.items[1].isDefault).toBe(true);
  });
});
