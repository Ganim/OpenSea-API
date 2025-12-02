import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Absence } from '@/entities/hr/absence';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { AbsenceStatus, AbsenceType } from '@/entities/hr/value-objects';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelAbsenceUseCase } from './cancel-absence';

let absencesRepository: InMemoryAbsencesRepository;
let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: CancelAbsenceUseCase;
let testAbsence: Absence;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let testVacationPeriod: VacationPeriod;
const employeeId = new UniqueEntityID();

describe('Cancel Absence Use Case', () => {
  beforeEach(async () => {
    absencesRepository = new InMemoryAbsencesRepository();
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new CancelAbsenceUseCase(
      absencesRepository,
      vacationPeriodsRepository,
    );

    testVacationPeriod = await vacationPeriodsRepository.create({
      employeeId,
      acquisitionStart: new Date('2022-01-01'),
      acquisitionEnd: new Date('2023-01-01'),
      concessionStart: new Date('2023-01-01'),
      concessionEnd: new Date('2024-12-31'),
      totalDays: 30,
      usedDays: 10,
      soldDays: 0,
      remainingDays: 20,
      status: 'AVAILABLE',
    });

    // Create a pending vacation absence (future dates)
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 30);
    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 9);

    testAbsence = Absence.create({
      employeeId,
      type: AbsenceType.create('VACATION'),
      status: AbsenceStatus.pending(),
      startDate: futureStart,
      endDate: futureEnd,
      totalDays: 10,
      isPaid: true,
      reason: 'Férias anuais',
    });

    absencesRepository.items.push(testAbsence);
  });

  it('should cancel pending absence successfully', async () => {
    const result = await sut.execute({
      absenceId: testAbsence.id.toString(),
    });

    expect(result.absence).toBeDefined();
    expect(result.absence.status.isCancelled()).toBe(true);
  });

  it('should throw error if absence not found', async () => {
    await expect(
      sut.execute({
        absenceId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Absence not found');
  });

  it('should throw error if absence cannot be cancelled', async () => {
    // Approve the absence first
    testAbsence.approve(new UniqueEntityID());
    // Then start it
    testAbsence.startProgress();
    await absencesRepository.save(testAbsence);

    await expect(
      sut.execute({
        absenceId: testAbsence.id.toString(),
      }),
    ).rejects.toThrow();
  });

  it('should cancel approved vacation successfully', async () => {
    // First approve the absence
    testAbsence.approve(new UniqueEntityID());
    await absencesRepository.save(testAbsence);

    const result = await sut.execute({
      absenceId: testAbsence.id.toString(),
    });

    expect(result.absence.status.isCancelled()).toBe(true);
  });

  it('should cancel sick leave successfully', async () => {
    const sickLeave = Absence.create({
      employeeId,
      type: AbsenceType.create('SICK_LEAVE'),
      status: AbsenceStatus.pending(),
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-03'),
      totalDays: 3,
      isPaid: true,
      cid: 'J11',
      reason: 'Gripe',
    });

    absencesRepository.items.push(sickLeave);

    const result = await sut.execute({
      absenceId: sickLeave.id.toString(),
    });

    expect(result.absence.status.isCancelled()).toBe(true);
  });
});
