import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationStatus } from '@/entities/hr/value-objects';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CompleteAcquisitionUseCase } from './complete-acquisition';

const TENANT_ID = 'tenant-1';

let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: CompleteAcquisitionUseCase;
let testVacationPeriod: VacationPeriod;
const employeeId = new UniqueEntityID();

describe('Complete Acquisition Use Case', () => {
  beforeEach(async () => {
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new CompleteAcquisitionUseCase(vacationPeriodsRepository);

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
      status: VacationStatus.pending(),
    });

    vacationPeriodsRepository.items.push(testVacationPeriod);
  });

  it('should complete acquisition successfully', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: testVacationPeriod.id.toString(),
    });

    expect(result.vacationPeriod).toBeDefined();
    expect(result.vacationPeriod.status.isAvailable()).toBe(true);
    expect(result.vacationPeriod.isPending()).toBe(false);
  });

  it('should persist the updated vacation period', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: testVacationPeriod.id.toString(),
    });

    const saved = await vacationPeriodsRepository.findById(
      testVacationPeriod.id,
      TENANT_ID,
    );

    expect(saved).not.toBeNull();
    expect(saved!.status.isAvailable()).toBe(true);
  });

  it('should throw error if vacation period not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        vacationPeriodId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('VacationPeriod');
  });

  it('should throw error if vacation period belongs to a different tenant', async () => {
    await expect(
      sut.execute({
        tenantId: 'other-tenant',
        vacationPeriodId: testVacationPeriod.id.toString(),
      }),
    ).rejects.toThrow('VacationPeriod');
  });

  it('should throw error if period is already available', async () => {
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
      status: VacationStatus.available(),
    });

    vacationPeriodsRepository.items = [testVacationPeriod];

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        vacationPeriodId: testVacationPeriod.id.toString(),
      }),
    ).rejects.toThrow('Apenas períodos em aquisição podem ser concluídos');
  });

  it('should throw error if period is scheduled', async () => {
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
      status: VacationStatus.scheduled(),
    });

    vacationPeriodsRepository.items = [testVacationPeriod];

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        vacationPeriodId: testVacationPeriod.id.toString(),
      }),
    ).rejects.toThrow('Apenas períodos em aquisição podem ser concluídos');
  });

  it('should throw error if period is expired', async () => {
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
      status: VacationStatus.expired(),
    });

    vacationPeriodsRepository.items = [testVacationPeriod];

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        vacationPeriodId: testVacationPeriod.id.toString(),
      }),
    ).rejects.toThrow('Apenas períodos em aquisição podem ser concluídos');
  });

  it('should throw error if period is completed', async () => {
    testVacationPeriod = VacationPeriod.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId,
      acquisitionStart: new Date('2022-01-01'),
      acquisitionEnd: new Date('2023-01-01'),
      concessionStart: new Date('2023-01-01'),
      concessionEnd: new Date('2024-12-31'),
      totalDays: 30,
      usedDays: 30,
      soldDays: 0,
      remainingDays: 0,
      status: VacationStatus.completed(),
    });

    vacationPeriodsRepository.items = [testVacationPeriod];

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        vacationPeriodId: testVacationPeriod.id.toString(),
      }),
    ).rejects.toThrow('Apenas períodos em aquisição podem ser concluídos');
  });
});
