import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationSplit } from '@/entities/hr/vacation-split';
import { VacationStatus } from '@/entities/hr/value-objects';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { InMemoryVacationSplitsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-splits-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListVacationSplitsUseCase } from './list-vacation-splits';

const TENANT_ID = 'tenant-1';
const employeeId = new UniqueEntityID();

let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let vacationSplitsRepository: InMemoryVacationSplitsRepository;
let sut: ListVacationSplitsUseCase;
let testVacationPeriod: VacationPeriod;

describe('List Vacation Splits Use Case', () => {
  beforeEach(() => {
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    vacationSplitsRepository = new InMemoryVacationSplitsRepository();
    sut = new ListVacationSplitsUseCase(
      vacationPeriodsRepository,
      vacationSplitsRepository,
    );

    testVacationPeriod = VacationPeriod.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId,
      acquisitionStart: new Date('2022-01-01'),
      acquisitionEnd: new Date('2023-01-01'),
      concessionStart: new Date('2023-01-01'),
      concessionEnd: new Date('2024-12-31'),
      totalDays: 30,
      usedDays: 0,
      soldDays: 0,
      remainingDays: 30,
      status: VacationStatus.create('AVAILABLE'),
    });

    vacationPeriodsRepository.items.push(testVacationPeriod);
  });

  it('should list all splits for a vacation period', async () => {
    const periodId = testVacationPeriod.id.toString();

    // Create 2 splits
    const split1 = VacationSplit.create({
      vacationPeriodId: testVacationPeriod.id,
      splitNumber: 1,
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-14'),
      days: 14,
      status: 'SCHEDULED',
    });

    const split2 = VacationSplit.create({
      vacationPeriodId: testVacationPeriod.id,
      splitNumber: 2,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-09-10'),
      days: 10,
      status: 'SCHEDULED',
    });

    vacationSplitsRepository.items.push(split1, split2);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: periodId,
    });

    expect(result.splits).toHaveLength(2);
    expect(result.splits[0].splitNumber).toBe(1);
    expect(result.splits[1].splitNumber).toBe(2);
  });

  it('should return empty array when no splits exist', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: testVacationPeriod.id.toString(),
    });

    expect(result.splits).toHaveLength(0);
  });

  it('should throw error if vacation period not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        vacationPeriodId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('VacationPeriod');
  });

  it('should throw error if vacation period belongs to different tenant', async () => {
    await expect(
      sut.execute({
        tenantId: 'different-tenant',
        vacationPeriodId: testVacationPeriod.id.toString(),
      }),
    ).rejects.toThrow('VacationPeriod');
  });

  it('should include cancelled splits in the list', async () => {
    const periodId = testVacationPeriod.id.toString();

    const scheduledSplit = VacationSplit.create({
      vacationPeriodId: testVacationPeriod.id,
      splitNumber: 1,
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-14'),
      days: 14,
      status: 'SCHEDULED',
    });

    const cancelledSplit = VacationSplit.create({
      vacationPeriodId: testVacationPeriod.id,
      splitNumber: 2,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-09-10'),
      days: 10,
      status: 'CANCELLED',
    });

    vacationSplitsRepository.items.push(scheduledSplit, cancelledSplit);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: periodId,
    });

    expect(result.splits).toHaveLength(2);
  });

  it('should only return splits for the specified vacation period', async () => {
    const anotherPeriodId = new UniqueEntityID();

    // Split for our test period
    const matchingSplit = VacationSplit.create({
      vacationPeriodId: testVacationPeriod.id,
      splitNumber: 1,
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-14'),
      days: 14,
      status: 'SCHEDULED',
    });

    // Split for a different period
    const otherSplit = VacationSplit.create({
      vacationPeriodId: anotherPeriodId,
      splitNumber: 1,
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-08-14'),
      days: 14,
      status: 'SCHEDULED',
    });

    vacationSplitsRepository.items.push(matchingSplit, otherSplit);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: testVacationPeriod.id.toString(),
    });

    expect(result.splits).toHaveLength(1);
    expect(result.splits[0].id.equals(matchingSplit.id)).toBe(true);
  });
});
