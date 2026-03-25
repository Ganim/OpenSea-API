import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryOverdueActionsRepository } from '@/repositories/finance/in-memory/in-memory-overdue-actions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetEntryEscalationHistoryUseCase } from './get-entry-escalation-history';

let entriesRepository: InMemoryFinanceEntriesRepository;
let actionsRepository: InMemoryOverdueActionsRepository;
let sut: GetEntryEscalationHistoryUseCase;

const tenantId = 'tenant-1';
const categoryId = new UniqueEntityID().toString();
const costCenterId = new UniqueEntityID().toString();

describe('GetEntryEscalationHistoryUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    actionsRepository = new InMemoryOverdueActionsRepository();
    sut = new GetEntryEscalationHistoryUseCase(
      entriesRepository,
      actionsRepository,
    );
  });

  it('should return escalation history for an entry', async () => {
    const entry = await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Test',
      categoryId,
      costCenterId,
      expectedAmount: 1000,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'OVERDUE',
    });

    const entryId = entry.id.toString();

    await actionsRepository.create({
      tenantId,
      entryId,
      channel: 'EMAIL',
      status: 'SENT',
    });

    await actionsRepository.create({
      tenantId,
      entryId,
      channel: 'SYSTEM_ALERT',
      status: 'SENT',
    });

    const { actions } = await sut.execute({ entryId, tenantId });

    expect(actions).toHaveLength(2);
    expect(actions[0].channel).toBe('EMAIL');
    expect(actions[1].channel).toBe('SYSTEM_ALERT');
  });

  it('should throw if entry does not exist', async () => {
    await expect(
      sut.execute({
        entryId: 'non-existent',
        tenantId,
      }),
    ).rejects.toThrow('Finance entry not found');
  });

  it('should return empty array if no escalation actions exist', async () => {
    const entry = await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Test',
      categoryId,
      costCenterId,
      expectedAmount: 1000,
      issueDate: new Date(),
      dueDate: new Date(),
    });

    const { actions } = await sut.execute({
      entryId: entry.id.toString(),
      tenantId,
    });

    expect(actions).toHaveLength(0);
  });
});
