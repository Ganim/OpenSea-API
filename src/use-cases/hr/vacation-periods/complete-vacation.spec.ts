import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationStatus } from '@/entities/hr/value-objects';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CompleteVacationUseCase } from './complete-vacation';

const TENANT_ID = 'tenant-1';

let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: CompleteVacationUseCase;
let testVacationPeriod: VacationPeriod;
const employeeId = new UniqueEntityID();

describe('Complete Vacation Use Case', () => {
  beforeEach(async () => {
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new CompleteVacationUseCase(vacationPeriodsRepository);

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
      status: VacationStatus.create('IN_PROGRESS'),
      scheduledStart: new Date('2024-06-01'),
      scheduledEnd: new Date('2024-06-10'),
    });

    vacationPeriodsRepository.items.push(testVacationPeriod);
  });

  it('should complete vacation successfully', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: testVacationPeriod.id.toString(),
      daysUsed: 10,
    });

    expect(result.vacationPeriod).toBeDefined();
    expect(result.vacationPeriod.usedDays).toBe(10);
    expect(result.vacationPeriod.remainingDays).toBe(20);
    expect(result.vacationPeriod.status.isAvailable()).toBe(true);
  });

  it('should mark as completed if all days used', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: testVacationPeriod.id.toString(),
      daysUsed: 30,
    });

    expect(result.vacationPeriod.usedDays).toBe(30);
    expect(result.vacationPeriod.remainingDays).toBe(0);
    expect(result.vacationPeriod.status.isCompleted()).toBe(true);
  });

  it('should throw error if vacation period not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        vacationPeriodId: new UniqueEntityID().toString(),
        daysUsed: 10,
      }),
    ).rejects.toThrow('VacationPeriod');
  });

  it('should throw error if vacation is not in progress or scheduled', async () => {
    const availablePeriod = VacationPeriod.create({
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

    vacationPeriodsRepository.items.push(availablePeriod);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        vacationPeriodId: availablePeriod.id.toString(),
        daysUsed: 10,
      }),
    ).rejects.toThrow('em progresso ou agendadas');
  });

  it('should throw error if days used exceeds remaining days', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        vacationPeriodId: testVacationPeriod.id.toString(),
        daysUsed: 35, // More than remaining
      }),
    ).rejects.toThrow('Não é possível registrar');
  });
});
