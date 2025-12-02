import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationStatus } from '@/entities/hr/value-objects';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ScheduleVacationUseCase } from './schedule-vacation';

let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: ScheduleVacationUseCase;
let testVacationPeriod: VacationPeriod;
const employeeId = new UniqueEntityID();

describe('Schedule Vacation Use Case', () => {
  beforeEach(async () => {
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new ScheduleVacationUseCase(vacationPeriodsRepository);

    testVacationPeriod = VacationPeriod.create({
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

  it('should schedule vacation successfully', async () => {
    const startDate = new Date('2024-06-01');
    const endDate = new Date('2024-06-10'); // 10 days

    const result = await sut.execute({
      vacationPeriodId: testVacationPeriod.id.toString(),
      startDate,
      endDate,
      days: 10,
    });

    expect(result.vacationPeriod).toBeDefined();
    expect(result.vacationPeriod.status.isScheduled()).toBe(true);
    expect(result.vacationPeriod.scheduledStart).toEqual(startDate);
    expect(result.vacationPeriod.scheduledEnd).toEqual(endDate);
  });

  it('should throw error if vacation period not found', async () => {
    await expect(
      sut.execute({
        vacationPeriodId: new UniqueEntityID().toString(),
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-10'),
        days: 10,
      }),
    ).rejects.toThrow('VacationPeriod');
  });

  it('should throw error if not enough days available', async () => {
    await expect(
      sut.execute({
        vacationPeriodId: testVacationPeriod.id.toString(),
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-07-05'),
        days: 35, // More than available
      }),
    ).rejects.toThrow('Não há dias suficientes disponíveis');
  });

  it('should throw error if period is less than 5 days', async () => {
    await expect(
      sut.execute({
        vacationPeriodId: testVacationPeriod.id.toString(),
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-03'),
        days: 3, // Less than minimum
      }),
    ).rejects.toThrow('período mínimo de férias');
  });

  it('should throw error if start date is after end date', async () => {
    await expect(
      sut.execute({
        vacationPeriodId: testVacationPeriod.id.toString(),
        startDate: new Date('2024-06-10'),
        endDate: new Date('2024-06-01'),
        days: 10,
      }),
    ).rejects.toThrow('data de início deve ser anterior');
  });
});
