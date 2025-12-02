import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Absence } from '@/entities/hr/absence';
import { AbsenceStatus, AbsenceType } from '@/entities/hr/value-objects';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RejectAbsenceUseCase } from './reject-absence';

let absencesRepository: InMemoryAbsencesRepository;
let sut: RejectAbsenceUseCase;
let testAbsence: Absence;
const employeeId = new UniqueEntityID();
const rejectedById = new UniqueEntityID();

describe('Reject Absence Use Case', () => {
  beforeEach(async () => {
    absencesRepository = new InMemoryAbsencesRepository();
    sut = new RejectAbsenceUseCase(absencesRepository);

    testAbsence = Absence.create({
      employeeId,
      type: AbsenceType.create('VACATION'),
      status: AbsenceStatus.pending(),
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-10'),
      totalDays: 10,
      isPaid: true,
      reason: 'Férias anuais',
    });

    absencesRepository.items.push(testAbsence);
  });

  it('should reject absence successfully', async () => {
    const reason = 'Período solicitado conflita com projeto crítico';

    const result = await sut.execute({
      absenceId: testAbsence.id.toString(),
      rejectedBy: rejectedById.toString(),
      reason,
    });

    expect(result.absence).toBeDefined();
    expect(result.absence.status.isRejected()).toBe(true);
    expect(result.absence.rejectionReason).toBe(reason);
  });

  it('should throw error if absence not found', async () => {
    await expect(
      sut.execute({
        absenceId: new UniqueEntityID().toString(),
        rejectedBy: rejectedById.toString(),
        reason: 'Motivo da rejeição para teste',
      }),
    ).rejects.toThrow('Absence not found');
  });

  it('should throw error if absence is not pending', async () => {
    testAbsence.approve(new UniqueEntityID());
    await absencesRepository.save(testAbsence);

    await expect(
      sut.execute({
        absenceId: testAbsence.id.toString(),
        rejectedBy: rejectedById.toString(),
        reason: 'Motivo da rejeição para teste',
      }),
    ).rejects.toThrow('pending');
  });

  it('should throw error if rejection reason is too short', async () => {
    await expect(
      sut.execute({
        absenceId: testAbsence.id.toString(),
        rejectedBy: rejectedById.toString(),
        reason: 'Curto',
      }),
    ).rejects.toThrow('at least 10 characters');
  });
});
