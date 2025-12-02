import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationStatus } from '@/entities/hr/value-objects';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { StartVacationUseCase } from './start-vacation';

let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: StartVacationUseCase;
let testVacationPeriod: VacationPeriod;
const employeeId = new UniqueEntityID();

describe('Start Vacation Use Case', () => {
  beforeEach(async () => {
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new StartVacationUseCase(vacationPeriodsRepository);

    testVacationPeriod = VacationPeriod.create({
      employeeId,
      acquisitionStart: new Date('2022-01-01'),
      acquisitionEnd: new Date('2023-01-01'),
      concessionStart: new Date('2023-01-01'),
      concessionEnd: new Date('2024-12-31'),
      totalDays: 30,
      usedDays: 10,
      soldDays: 0,
      remainingDays: 20,
      status: VacationStatus.create('SCHEDULED'),
      scheduledStart: new Date('2024-06-01'),
      scheduledEnd: new Date('2024-06-10'),
    });

    vacationPeriodsRepository.items.push(testVacationPeriod);
  });

  it('should start vacation successfully', async () => {
    const result = await sut.execute({
      vacationPeriodId: testVacationPeriod.id.toString(),
    });

    expect(result.vacationPeriod).toBeDefined();
    expect(result.vacationPeriod.status.isInProgress()).toBe(true);
  });

  it('should throw error if vacation period not found', async () => {
    await expect(
      sut.execute({
        vacationPeriodId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('VacationPeriod');
  });

  it('should throw error if vacation is not scheduled', async () => {
    const availablePeriod = VacationPeriod.create({
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

    vacationPeriodsRepository.items.push(availablePeriod);

    await expect(
      sut.execute({
        vacationPeriodId: availablePeriod.id.toString(),
      }),
    ).rejects.toThrow('precisam estar agendadas');
  });
});
