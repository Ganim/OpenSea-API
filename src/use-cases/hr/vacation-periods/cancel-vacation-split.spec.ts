import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationSplit } from '@/entities/hr/vacation-split';
import { InMemoryVacationSplitsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-splits-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelVacationSplitUseCase } from './cancel-vacation-split';

let vacationSplitsRepository: InMemoryVacationSplitsRepository;
let sut: CancelVacationSplitUseCase;

const vacationPeriodId = new UniqueEntityID();

describe('Cancel Vacation Split Use Case', () => {
  beforeEach(() => {
    vacationSplitsRepository = new InMemoryVacationSplitsRepository();
    sut = new CancelVacationSplitUseCase(vacationSplitsRepository);
  });

  function createScheduledSplit(days: number = 14): VacationSplit {
    const startDate = new Date('2024-07-01');
    const endDate = new Date('2024-07-01');
    endDate.setDate(endDate.getDate() + days - 1);

    return VacationSplit.create({
      vacationPeriodId,
      splitNumber: 1,
      startDate,
      endDate,
      days,
      status: 'SCHEDULED',
    });
  }

  it('should cancel a scheduled vacation split', async () => {
    const split = createScheduledSplit();
    vacationSplitsRepository.items.push(split);

    const result = await sut.execute({
      splitId: split.id.toString(),
    });

    expect(result.vacationSplit.isCancelled()).toBe(true);
  });

  it('should persist the cancelled status', async () => {
    const split = createScheduledSplit();
    vacationSplitsRepository.items.push(split);

    await sut.execute({ splitId: split.id.toString() });

    const persisted = await vacationSplitsRepository.findById(split.id);
    expect(persisted!.isCancelled()).toBe(true);
  });

  it('should throw error if split not found', async () => {
    await expect(
      sut.execute({ splitId: new UniqueEntityID().toString() }),
    ).rejects.toThrow('VacationSplit');
  });

  it('should throw error if split is already in progress', async () => {
    const split = createScheduledSplit();
    split.start(); // Move to IN_PROGRESS
    vacationSplitsRepository.items.push(split);

    await expect(sut.execute({ splitId: split.id.toString() })).rejects.toThrow(
      'Não é possível cancelar parcela com status',
    );
  });

  it('should throw error if split is already completed', async () => {
    const split = createScheduledSplit();
    split.start();
    split.complete(); // Move to COMPLETED
    vacationSplitsRepository.items.push(split);

    await expect(sut.execute({ splitId: split.id.toString() })).rejects.toThrow(
      'Não é possível cancelar parcela com status',
    );
  });

  it('should throw error if split is already cancelled', async () => {
    const split = createScheduledSplit();
    split.cancel(); // Move to CANCELLED
    vacationSplitsRepository.items.push(split);

    await expect(sut.execute({ splitId: split.id.toString() })).rejects.toThrow(
      'Não é possível cancelar parcela com status',
    );
  });
});
