import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationStatus } from '@/entities/hr/value-objects';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SellVacationDaysUseCase } from './sell-vacation-days';

const TENANT_ID = 'tenant-1';

let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: SellVacationDaysUseCase;
let testVacationPeriod: VacationPeriod;
const employeeId = new UniqueEntityID();

describe('Sell Vacation Days Use Case', () => {
  beforeEach(async () => {
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new SellVacationDaysUseCase(vacationPeriodsRepository);

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

  it('should sell vacation days successfully', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: testVacationPeriod.id.toString(),
      daysToSell: 10, // 1/3 of 30
    });

    expect(result.vacationPeriod).toBeDefined();
    expect(result.vacationPeriod.soldDays).toBe(10);
    expect(result.vacationPeriod.remainingDays).toBe(20);
  });

  it('should throw error if vacation period not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        vacationPeriodId: new UniqueEntityID().toString(),
        daysToSell: 10,
      }),
    ).rejects.toThrow('VacationPeriod');
  });

  it('should throw error if trying to sell more than 1/3 of days', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        vacationPeriodId: testVacationPeriod.id.toString(),
        daysToSell: 15, // More than 1/3 (10 days)
      }),
    ).rejects.toThrow('Só é permitido vender até');
  });

  it('should throw error if not enough days available', async () => {
    // First sell some days
    testVacationPeriod.sellDays(10);
    await vacationPeriodsRepository.save(testVacationPeriod);

    // Update remaining days manually for test
    const periodWithLessDays = VacationPeriod.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId,
      acquisitionStart: new Date('2022-01-01'),
      acquisitionEnd: new Date('2023-01-01'),
      concessionStart: new Date('2023-01-01'),
      concessionEnd: new Date('2024-12-31'),
      totalDays: 30,
      usedDays: 25,
      soldDays: 0,
      remainingDays: 5, // Only 5 days left
      status: VacationStatus.create('AVAILABLE'),
    });

    vacationPeriodsRepository.items = [periodWithLessDays];

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        vacationPeriodId: periodWithLessDays.id.toString(),
        daysToSell: 10,
      }),
    ).rejects.toThrow('Não há dias suficientes disponíveis');
  });
});
