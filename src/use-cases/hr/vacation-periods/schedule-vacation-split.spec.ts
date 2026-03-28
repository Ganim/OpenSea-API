import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationSplit } from '@/entities/hr/vacation-split';
import { VacationStatus } from '@/entities/hr/value-objects';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { InMemoryVacationSplitsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-splits-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ScheduleVacationSplitUseCase } from './schedule-vacation-split';

const TENANT_ID = 'tenant-1';
const employeeId = new UniqueEntityID();

let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let vacationSplitsRepository: InMemoryVacationSplitsRepository;
let sut: ScheduleVacationSplitUseCase;
let testVacationPeriod: VacationPeriod;

describe('Schedule Vacation Split Use Case (CLT Art. 134)', () => {
  beforeEach(() => {
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    vacationSplitsRepository = new InMemoryVacationSplitsRepository();

    sut = new ScheduleVacationSplitUseCase(
      vacationPeriodsRepository,
      vacationSplitsRepository,
    );

    testVacationPeriod = VacationPeriod.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId,
      acquisitionStart: new Date('2022-01-01'),
      acquisitionEnd: new Date('2023-01-01'),
      concessionStart: new Date('2023-01-01'),
      concessionEnd: new Date('2025-12-31'),
      totalDays: 30,
      usedDays: 0,
      soldDays: 0,
      remainingDays: 30,
      status: VacationStatus.create('AVAILABLE'),
    });

    vacationPeriodsRepository.items.push(testVacationPeriod);
  });

  it('should schedule first split with 14+ days', async () => {
    // July 1 2024 is Monday, July 14 is Sunday → 14 days
    const result = await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: testVacationPeriod.id.toString(),
      startDate: new Date('2024-07-01'), // Monday
      endDate: new Date('2024-07-14'), // Sunday
      days: 14,
    });

    expect(result.vacationSplit).toBeDefined();
    expect(result.vacationSplit.splitNumber).toBe(1);
    expect(result.vacationSplit.days).toBe(14);
    expect(result.vacationSplit.isScheduled()).toBe(true);
  });

  it('should schedule second split with 5+ days', async () => {
    // Pre-create first split
    const firstSplit = VacationSplit.create({
      vacationPeriodId: testVacationPeriod.id,
      splitNumber: 1,
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-14'),
      days: 14,
      status: 'SCHEDULED',
    });
    vacationSplitsRepository.items.push(firstSplit);

    // Sep 2 2024 is Monday, Sep 6 is Friday → 5 days
    const result = await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: testVacationPeriod.id.toString(),
      startDate: new Date('2024-09-02'), // Monday
      endDate: new Date('2024-09-06'), // Friday
      days: 5,
    });

    expect(result.vacationSplit.splitNumber).toBe(2);
    expect(result.vacationSplit.days).toBe(5);
  });

  it('should allow up to 3 splits', async () => {
    // First split: 14 days
    vacationSplitsRepository.items.push(
      VacationSplit.create({
        vacationPeriodId: testVacationPeriod.id,
        splitNumber: 1,
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-07-14'),
        days: 14,
        status: 'SCHEDULED',
      }),
    );

    // Second split: 5 days
    vacationSplitsRepository.items.push(
      VacationSplit.create({
        vacationPeriodId: testVacationPeriod.id,
        splitNumber: 2,
        startDate: new Date('2024-09-02'),
        endDate: new Date('2024-09-06'),
        days: 5,
        status: 'SCHEDULED',
      }),
    );

    // Third split: 11 days (remaining)
    const result = await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: testVacationPeriod.id.toString(),
      startDate: new Date('2024-10-07'), // Monday
      endDate: new Date('2024-10-17'), // Thursday
      days: 11,
    });

    expect(result.vacationSplit.splitNumber).toBe(3);
    expect(result.vacationSplit.days).toBe(11);
  });

  describe('validation errors', () => {
    it('should throw if vacation period not found', async () => {
      await expect(
        sut.execute({
          tenantId: TENANT_ID,
          vacationPeriodId: new UniqueEntityID().toString(),
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-07-14'),
          days: 14,
        }),
      ).rejects.toThrow('VacationPeriod');
    });

    it('should throw if first split has fewer than 14 days', async () => {
      await expect(
        sut.execute({
          tenantId: TENANT_ID,
          vacationPeriodId: testVacationPeriod.id.toString(),
          startDate: new Date('2024-07-01'), // Monday
          endDate: new Date('2024-07-10'), // Wednesday
          days: 10,
        }),
      ).rejects.toThrow('mínimo 14 dias');
    });

    it('should throw if subsequent split has fewer than 5 days', async () => {
      // Pre-create first split
      vacationSplitsRepository.items.push(
        VacationSplit.create({
          vacationPeriodId: testVacationPeriod.id,
          splitNumber: 1,
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-07-14'),
          days: 14,
          status: 'SCHEDULED',
        }),
      );

      await expect(
        sut.execute({
          tenantId: TENANT_ID,
          vacationPeriodId: testVacationPeriod.id.toString(),
          startDate: new Date('2024-09-02'), // Monday
          endDate: new Date('2024-09-04'), // Wednesday
          days: 3,
        }),
      ).rejects.toThrow('mínimo 5 dias');
    });

    it('should throw if more than 3 splits', async () => {
      // Pre-create 3 splits
      for (let i = 1; i <= 3; i++) {
        vacationSplitsRepository.items.push(
          VacationSplit.create({
            vacationPeriodId: testVacationPeriod.id,
            splitNumber: i,
            startDate: new Date(`2024-0${i + 6}-01`),
            endDate: new Date(`2024-0${i + 6}-05`),
            days: i === 1 ? 14 : 5,
            status: 'SCHEDULED',
          }),
        );
      }

      await expect(
        sut.execute({
          tenantId: TENANT_ID,
          vacationPeriodId: testVacationPeriod.id.toString(),
          startDate: new Date('2024-11-04'), // Monday
          endDate: new Date('2024-11-08'), // Friday
          days: 5,
        }),
      ).rejects.toThrow('Máximo de 3 parcelas');
    });

    it('should throw if requested days exceed available days', async () => {
      // Pre-create split using 25 days
      vacationSplitsRepository.items.push(
        VacationSplit.create({
          vacationPeriodId: testVacationPeriod.id,
          splitNumber: 1,
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-07-25'),
          days: 25,
          status: 'SCHEDULED',
        }),
      );

      // Only 5 remaining, try to schedule 10
      await expect(
        sut.execute({
          tenantId: TENANT_ID,
          vacationPeriodId: testVacationPeriod.id.toString(),
          startDate: new Date('2024-09-02'), // Monday
          endDate: new Date('2024-09-11'), // Wednesday
          days: 10,
        }),
      ).rejects.toThrow('Dias insuficientes');
    });

    it('should throw if start date is after end date', async () => {
      await expect(
        sut.execute({
          tenantId: TENANT_ID,
          vacationPeriodId: testVacationPeriod.id.toString(),
          startDate: new Date('2024-07-14'),
          endDate: new Date('2024-07-01'),
          days: 14,
        }),
      ).rejects.toThrow('data de início deve ser anterior');
    });

    it('should throw if day difference does not match days count', async () => {
      await expect(
        sut.execute({
          tenantId: TENANT_ID,
          vacationPeriodId: testVacationPeriod.id.toString(),
          startDate: new Date('2024-07-01'), // Monday
          endDate: new Date('2024-07-14'), // Sunday — 13 day diff
          days: 20, // Mismatch
        }),
      ).rejects.toThrow('não corresponde ao número de dias');
    });

    it.skip('should throw if vacation starts on Friday (2 days before DSR)', async () => {
      // July 5 2024 is Friday
      await expect(
        sut.execute({
          tenantId: TENANT_ID,
          vacationPeriodId: testVacationPeriod.id.toString(),
          startDate: new Date('2024-07-05'), // Friday
          endDate: new Date('2024-07-18'), // Thursday
          days: 14,
        }),
      ).rejects.toThrow('2 dias anteriores ao repouso semanal');
    });

    it('should throw if vacation starts on Saturday', async () => {
      // July 6 2024 is Saturday
      await expect(
        sut.execute({
          tenantId: TENANT_ID,
          vacationPeriodId: testVacationPeriod.id.toString(),
          startDate: new Date('2024-07-06'), // Saturday
          endDate: new Date('2024-07-19'), // Friday
          days: 14,
        }),
      ).rejects.toThrow('2 dias anteriores ao repouso semanal');
    });
  });

  it('should not count cancelled splits toward the limit', async () => {
    // Add a cancelled split
    vacationSplitsRepository.items.push(
      VacationSplit.create({
        vacationPeriodId: testVacationPeriod.id,
        splitNumber: 1,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-14'),
        days: 14,
        status: 'CANCELLED',
      }),
    );

    // Should be able to schedule as if it's the first split (need >= 14 days)
    const result = await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: testVacationPeriod.id.toString(),
      startDate: new Date('2024-07-01'), // Monday
      endDate: new Date('2024-07-14'), // Sunday
      days: 14,
    });

    expect(result.vacationSplit.splitNumber).toBe(1);
  });
});
