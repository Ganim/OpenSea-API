import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Absence } from '@/entities/hr/absence';
import { AbsenceStatus, AbsenceType } from '@/entities/hr/value-objects';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetAbsenceUseCase } from './get-absence';

let absencesRepository: InMemoryAbsencesRepository;
let sut: GetAbsenceUseCase;
let testAbsence: Absence;
const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID();

describe('Get Absence Use Case', () => {
  beforeEach(async () => {
    absencesRepository = new InMemoryAbsencesRepository();
    sut = new GetAbsenceUseCase(absencesRepository);

    testAbsence = Absence.create({
      tenantId: new UniqueEntityID(tenantId),
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

  it('should get absence by id', async () => {
    const result = await sut.execute({
      tenantId,
      absenceId: testAbsence.id.toString(),
    });

    expect(result.absence).toBeDefined();
    expect(result.absence.id.equals(testAbsence.id)).toBe(true);
    expect(result.absence.type.isVacation()).toBe(true);
    expect(result.absence.totalDays).toBe(10);
  });

  it('should throw error if absence not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        absenceId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Absence');
  });
});
