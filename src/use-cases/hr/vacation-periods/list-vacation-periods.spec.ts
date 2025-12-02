import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationStatus } from '@/entities/hr/value-objects';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListVacationPeriodsUseCase } from './list-vacation-periods';

let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: ListVacationPeriodsUseCase;
const employeeId1 = new UniqueEntityID();
const employeeId2 = new UniqueEntityID();

describe('List Vacation Periods Use Case', () => {
  beforeEach(async () => {
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new ListVacationPeriodsUseCase(vacationPeriodsRepository);

    // Create test vacation periods
    const period1 = VacationPeriod.create({
      employeeId: employeeId1,
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

    const period2 = VacationPeriod.create({
      employeeId: employeeId1,
      acquisitionStart: new Date('2023-01-01'),
      acquisitionEnd: new Date('2024-01-01'),
      concessionStart: new Date('2024-01-01'),
      concessionEnd: new Date('2025-12-31'),
      totalDays: 30,
      usedDays: 10,
      soldDays: 0,
      remainingDays: 20,
      status: VacationStatus.create('SCHEDULED'),
    });

    const period3 = VacationPeriod.create({
      employeeId: employeeId2,
      acquisitionStart: new Date('2022-01-01'),
      acquisitionEnd: new Date('2023-01-01'),
      concessionStart: new Date('2023-01-01'),
      concessionEnd: new Date('2024-12-31'),
      totalDays: 30,
      usedDays: 30,
      soldDays: 0,
      remainingDays: 0,
      status: VacationStatus.create('COMPLETED'),
    });

    vacationPeriodsRepository.items.push(period1, period2, period3);
  });

  it('should list all vacation periods', async () => {
    const result = await sut.execute({});

    expect(result.vacationPeriods).toHaveLength(3);
  });

  it('should filter vacation periods by employee id', async () => {
    const result = await sut.execute({
      employeeId: employeeId1.toString(),
    });

    expect(result.vacationPeriods).toHaveLength(2);
    result.vacationPeriods.forEach((period) => {
      expect(period.employeeId.equals(employeeId1)).toBe(true);
    });
  });

  it('should filter vacation periods by status', async () => {
    const result = await sut.execute({
      status: 'AVAILABLE',
    });

    expect(result.vacationPeriods).toHaveLength(1);
    expect(result.vacationPeriods[0].status.isAvailable()).toBe(true);
  });

  it('should filter vacation periods by year', async () => {
    const result = await sut.execute({
      year: 2024,
    });

    expect(result.vacationPeriods.length).toBeGreaterThan(0);
  });

  it('should combine multiple filters', async () => {
    const result = await sut.execute({
      employeeId: employeeId1.toString(),
      status: 'SCHEDULED',
    });

    expect(result.vacationPeriods).toHaveLength(1);
    expect(result.vacationPeriods[0].status.isScheduled()).toBe(true);
  });
});
