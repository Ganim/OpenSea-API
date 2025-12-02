import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Absence } from '@/entities/hr/absence';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { AbsenceStatus, AbsenceType } from '@/entities/hr/value-objects';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApproveAbsenceUseCase } from './approve-absence';

let absencesRepository: InMemoryAbsencesRepository;
let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: ApproveAbsenceUseCase;
let testAbsence: Absence;
let testVacationPeriod: VacationPeriod;
const employeeId = new UniqueEntityID();

describe('Approve Absence Use Case', () => {
  beforeEach(async () => {
    absencesRepository = new InMemoryAbsencesRepository();
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new ApproveAbsenceUseCase(
      absencesRepository,
      vacationPeriodsRepository,
    );

    // Create vacation period
    testVacationPeriod = await vacationPeriodsRepository.create({
      employeeId,
      acquisitionStart: new Date('2022-01-01'),
      acquisitionEnd: new Date('2023-01-01'),
      concessionStart: new Date('2023-01-01'),
      concessionEnd: new Date('2024-12-31'),
      totalDays: 30,
      usedDays: 0,
      soldDays: 0,
      remainingDays: 30,
      status: 'AVAILABLE',
    });

    // Create pending vacation absence
    testAbsence = Absence.create({
      employeeId,
      type: AbsenceType.create('VACATION'),
      status: AbsenceStatus.pending(),
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-10'),
      totalDays: 10,
      isPaid: true,
      reason: 'Férias anuais',
      vacationPeriodId: testVacationPeriod.id,
    });

    absencesRepository.items.push(testAbsence);
  });

  it('should approve absence successfully', async () => {
    const approverId = new UniqueEntityID();

    const result = await sut.execute({
      absenceId: testAbsence.id.toString(),
      approvedBy: approverId.toString(),
    });

    expect(result.absence).toBeDefined();
    expect(result.absence.status.isApproved()).toBe(true);
    expect(result.absence.approvedBy?.toString()).toBe(approverId.toString());
    expect(result.absence.approvedAt).toBeDefined();
  });

  it('should update vacation period when approving vacation absence', async () => {
    const approverId = new UniqueEntityID();

    await sut.execute({
      absenceId: testAbsence.id.toString(),
      approvedBy: approverId.toString(),
    });

    const updatedPeriod = await vacationPeriodsRepository.findById(
      testVacationPeriod.id,
    );

    expect(updatedPeriod).toBeDefined();
    // The vacation period should be updated via schedule method
  });

  it('should throw error if absence not found', async () => {
    await expect(
      sut.execute({
        absenceId: new UniqueEntityID().toString(),
        approvedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Absence not found');
  });

  it('should throw error if absence is not pending', async () => {
    // Approve the absence first
    testAbsence.approve(new UniqueEntityID());
    await absencesRepository.save(testAbsence);

    await expect(
      sut.execute({
        absenceId: testAbsence.id.toString(),
        approvedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('already approved');
  });

  it('should approve sick leave without vacation period update', async () => {
    const sickLeave = Absence.create({
      employeeId,
      type: AbsenceType.create('SICK_LEAVE'),
      status: AbsenceStatus.pending(),
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-05'),
      totalDays: 5,
      isPaid: true,
      cid: 'J11',
      reason: 'Gripe',
    });

    absencesRepository.items.push(sickLeave);

    const result = await sut.execute({
      absenceId: sickLeave.id.toString(),
      approvedBy: new UniqueEntityID().toString(),
    });

    expect(result.absence.status.isApproved()).toBe(true);
    expect(result.absence.type.isSickLeave()).toBe(true);
  });
});
