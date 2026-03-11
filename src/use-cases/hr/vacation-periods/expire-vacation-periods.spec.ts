import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationStatus } from '@/entities/hr/value-objects';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ExpireVacationPeriodsUseCase } from './expire-vacation-periods';

const TENANT_ID = 'tenant-1';

let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: ExpireVacationPeriodsUseCase;
const employeeId = new UniqueEntityID();

function createPeriod(
  overrides: Partial<{
    tenantId: string;
    status: VacationStatus;
    concessionEnd: Date;
    usedDays: number;
    soldDays: number;
    remainingDays: number;
  }> = {},
): VacationPeriod {
  return VacationPeriod.create({
    tenantId: new UniqueEntityID(overrides.tenantId ?? TENANT_ID),
    employeeId,
    acquisitionStart: new Date('2022-01-01'),
    acquisitionEnd: new Date('2023-01-01'),
    concessionStart: new Date('2023-01-01'),
    concessionEnd: overrides.concessionEnd ?? new Date('2023-06-01'), // past date by default
    totalDays: 30,
    usedDays: overrides.usedDays ?? 0,
    soldDays: overrides.soldDays ?? 0,
    remainingDays: overrides.remainingDays ?? 30,
    status: overrides.status ?? VacationStatus.available(),
  });
}

describe('Expire Vacation Periods Use Case', () => {
  beforeEach(async () => {
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new ExpireVacationPeriodsUseCase(vacationPeriodsRepository);
  });

  it('should expire periods with past concession end date', async () => {
    const period = createPeriod({ concessionEnd: new Date('2023-06-01') });
    vacationPeriodsRepository.items.push(period);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.expiredCount).toBe(1);
    expect(vacationPeriodsRepository.items[0].isExpired()).toBe(true);
  });

  it('should return zero when no expired periods exist', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.expiredCount).toBe(0);
  });

  it('should not expire periods with future concession end date', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const period = createPeriod({ concessionEnd: futureDate });
    vacationPeriodsRepository.items.push(period);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.expiredCount).toBe(0);
    expect(vacationPeriodsRepository.items[0].isAvailable()).toBe(true);
  });

  it('should expire multiple periods at once', async () => {
    const period1 = createPeriod({ concessionEnd: new Date('2023-03-01') });
    const period2 = createPeriod({ concessionEnd: new Date('2023-06-01') });
    const period3 = createPeriod({ concessionEnd: new Date('2024-01-01') });
    vacationPeriodsRepository.items.push(period1, period2, period3);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.expiredCount).toBe(3);
    expect(vacationPeriodsRepository.items[0].isExpired()).toBe(true);
    expect(vacationPeriodsRepository.items[1].isExpired()).toBe(true);
    expect(vacationPeriodsRepository.items[2].isExpired()).toBe(true);
  });

  it('should not expire periods that are already completed', async () => {
    const period = createPeriod({
      concessionEnd: new Date('2023-06-01'),
      status: VacationStatus.completed(),
      usedDays: 30,
      remainingDays: 0,
    });
    vacationPeriodsRepository.items.push(period);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.expiredCount).toBe(0);
    expect(vacationPeriodsRepository.items[0].isCompleted()).toBe(true);
  });

  it('should not expire periods that are already expired', async () => {
    const period = createPeriod({
      concessionEnd: new Date('2023-06-01'),
      status: VacationStatus.expired(),
    });
    vacationPeriodsRepository.items.push(period);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.expiredCount).toBe(0);
    expect(vacationPeriodsRepository.items[0].isExpired()).toBe(true);
  });

  it('should not expire periods that are sold', async () => {
    const period = createPeriod({
      concessionEnd: new Date('2023-06-01'),
      status: VacationStatus.sold(),
      soldDays: 30,
      remainingDays: 0,
    });
    vacationPeriodsRepository.items.push(period);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.expiredCount).toBe(0);
  });

  it('should expire pending periods with past concession end', async () => {
    const period = createPeriod({
      concessionEnd: new Date('2023-06-01'),
      status: VacationStatus.pending(),
    });
    vacationPeriodsRepository.items.push(period);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.expiredCount).toBe(1);
    expect(vacationPeriodsRepository.items[0].isExpired()).toBe(true);
  });

  it('should expire scheduled periods with past concession end', async () => {
    const period = createPeriod({
      concessionEnd: new Date('2023-06-01'),
      status: VacationStatus.scheduled(),
    });
    vacationPeriodsRepository.items.push(period);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.expiredCount).toBe(1);
    expect(vacationPeriodsRepository.items[0].isExpired()).toBe(true);
  });

  it('should only expire periods of the specified tenant', async () => {
    const period1 = createPeriod({
      tenantId: TENANT_ID,
      concessionEnd: new Date('2023-06-01'),
    });
    const period2 = createPeriod({
      tenantId: 'other-tenant',
      concessionEnd: new Date('2023-06-01'),
    });
    vacationPeriodsRepository.items.push(period1, period2);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.expiredCount).toBe(1);
    expect(vacationPeriodsRepository.items[0].isExpired()).toBe(true);
    // Other tenant's period remains unchanged
    expect(vacationPeriodsRepository.items[1].isAvailable()).toBe(true);
  });

  it('should persist all expired periods', async () => {
    const period1 = createPeriod({ concessionEnd: new Date('2023-03-01') });
    const period2 = createPeriod({ concessionEnd: new Date('2023-06-01') });
    vacationPeriodsRepository.items.push(period1, period2);

    await sut.execute({ tenantId: TENANT_ID });

    const saved1 = await vacationPeriodsRepository.findById(
      period1.id,
      TENANT_ID,
    );
    const saved2 = await vacationPeriodsRepository.findById(
      period2.id,
      TENANT_ID,
    );

    expect(saved1!.isExpired()).toBe(true);
    expect(saved2!.isExpired()).toBe(true);
  });
});
