import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Absence } from '@/entities/hr/absence';
import { AbsenceStatus, AbsenceType } from '@/entities/hr/value-objects';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListAbsencesUseCase } from './list-absences';

let absencesRepository: InMemoryAbsencesRepository;
let sut: ListAbsencesUseCase;
const employeeId1 = new UniqueEntityID();
const employeeId2 = new UniqueEntityID();

describe('List Absences Use Case', () => {
  beforeEach(async () => {
    absencesRepository = new InMemoryAbsencesRepository();
    sut = new ListAbsencesUseCase(absencesRepository);

    // Create multiple absences
    const absence1 = Absence.create({
      employeeId: employeeId1,
      type: AbsenceType.create('VACATION'),
      status: AbsenceStatus.pending(),
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-10'),
      totalDays: 10,
      isPaid: true,
      reason: 'Férias anuais',
    });

    const absence2 = Absence.create({
      employeeId: employeeId1,
      type: AbsenceType.create('SICK_LEAVE'),
      status: AbsenceStatus.approved(),
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-05'),
      totalDays: 5,
      isPaid: true,
      cid: 'J11',
      reason: 'Gripe',
    });

    const absence3 = Absence.create({
      employeeId: employeeId2,
      type: AbsenceType.create('VACATION'),
      status: AbsenceStatus.pending(),
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-15'),
      totalDays: 15,
      isPaid: true,
      reason: 'Férias de meio de ano',
    });

    absencesRepository.items.push(absence1, absence2, absence3);
  });

  it('should list all absences', async () => {
    const result = await sut.execute({});

    expect(result.absences).toHaveLength(3);
  });

  it('should filter absences by employee id', async () => {
    const result = await sut.execute({
      employeeId: employeeId1.toString(),
    });

    expect(result.absences).toHaveLength(2);
    result.absences.forEach((absence) => {
      expect(absence.employeeId.equals(employeeId1)).toBe(true);
    });
  });

  it('should filter absences by type', async () => {
    const result = await sut.execute({
      type: 'VACATION',
    });

    expect(result.absences).toHaveLength(2);
    result.absences.forEach((absence) => {
      expect(absence.type.isVacation()).toBe(true);
    });
  });

  it('should filter absences by status', async () => {
    const result = await sut.execute({
      status: 'PENDING',
    });

    expect(result.absences).toHaveLength(2);
    result.absences.forEach((absence) => {
      expect(absence.status.isPending()).toBe(true);
    });
  });

  it('should combine multiple filters', async () => {
    const result = await sut.execute({
      employeeId: employeeId1.toString(),
      type: 'VACATION',
    });

    expect(result.absences).toHaveLength(1);
    expect(result.absences[0].employeeId.equals(employeeId1)).toBe(true);
    expect(result.absences[0].type.isVacation()).toBe(true);
  });
});
