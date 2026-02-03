import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationStatus } from '@/entities/hr/value-objects';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetVacationPeriodUseCase } from './get-vacation-period';

const TENANT_ID = 'tenant-1';

let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: GetVacationPeriodUseCase;
let testVacationPeriod: VacationPeriod;
const employeeId = new UniqueEntityID();

describe('Get Vacation Period Use Case', () => {
  beforeEach(async () => {
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new GetVacationPeriodUseCase(vacationPeriodsRepository);

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

  it('should get vacation period by id', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      vacationPeriodId: testVacationPeriod.id.toString(),
    });

    expect(result.vacationPeriod).toBeDefined();
    expect(result.vacationPeriod.id.equals(testVacationPeriod.id)).toBe(true);
    expect(result.vacationPeriod.totalDays).toBe(30);
  });

  it('should throw error if vacation period not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        vacationPeriodId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('VacationPeriod');
  });
});
