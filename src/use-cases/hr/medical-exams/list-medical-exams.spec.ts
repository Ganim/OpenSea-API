import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryMedicalExamsRepository } from '@/repositories/hr/in-memory/in-memory-medical-exams-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListMedicalExamsUseCase } from './list-medical-exams';

let medicalExamsRepository: InMemoryMedicalExamsRepository;
let sut: ListMedicalExamsUseCase;
const tenantId = new UniqueEntityID().toString();
const employeeIdA = new UniqueEntityID();
const employeeIdB = new UniqueEntityID();

describe('List Medical Exams Use Case', () => {
  beforeEach(async () => {
    medicalExamsRepository = new InMemoryMedicalExamsRepository();
    sut = new ListMedicalExamsUseCase(medicalExamsRepository);

    // Seed exams for employee A
    await medicalExamsRepository.create({
      tenantId,
      employeeId: employeeIdA,
      type: 'ADMISSIONAL',
      examDate: new Date('2024-01-15'),
      doctorName: 'Dr. Ana Paula',
      doctorCrm: 'CRM/SP 111111',
      result: 'APTO',
    });

    await medicalExamsRepository.create({
      tenantId,
      employeeId: employeeIdA,
      type: 'PERIODICO',
      examDate: new Date('2024-06-15'),
      doctorName: 'Dr. Ana Paula',
      doctorCrm: 'CRM/SP 111111',
      result: 'APTO_COM_RESTRICOES',
    });

    // Seed exam for employee B
    await medicalExamsRepository.create({
      tenantId,
      employeeId: employeeIdB,
      type: 'DEMISSIONAL',
      examDate: new Date('2024-07-01'),
      doctorName: 'Dr. Roberto Lima',
      doctorCrm: 'CRM/MG 222222',
      result: 'INAPTO',
    });
  });

  it('should list all medical exams for a tenant', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.medicalExams).toHaveLength(3);
  });

  it('should filter by employee id', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: employeeIdA.toString(),
    });

    expect(result.medicalExams).toHaveLength(2);
    result.medicalExams.forEach((exam) => {
      expect(exam.employeeId.equals(employeeIdA)).toBe(true);
    });
  });

  it('should filter by exam type', async () => {
    const result = await sut.execute({
      tenantId,
      type: 'DEMISSIONAL',
    });

    expect(result.medicalExams).toHaveLength(1);
    expect(result.medicalExams[0].type).toBe('DEMISSIONAL');
  });

  it('should filter by result', async () => {
    const result = await sut.execute({
      tenantId,
      result: 'APTO',
    });

    expect(result.medicalExams).toHaveLength(1);
    expect(result.medicalExams[0].result).toBe('APTO');
  });

  it('should paginate results', async () => {
    const firstPage = await sut.execute({
      tenantId,
      page: 1,
      perPage: 2,
    });

    expect(firstPage.medicalExams).toHaveLength(2);

    const secondPage = await sut.execute({
      tenantId,
      page: 2,
      perPage: 2,
    });

    expect(secondPage.medicalExams).toHaveLength(1);
  });

  it('should return empty list for tenant with no exams', async () => {
    const emptyTenantId = new UniqueEntityID().toString();

    const result = await sut.execute({ tenantId: emptyTenantId });

    expect(result.medicalExams).toHaveLength(0);
  });

  it('should combine employee and type filters', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: employeeIdA.toString(),
      type: 'PERIODICO',
    });

    expect(result.medicalExams).toHaveLength(1);
    expect(result.medicalExams[0].type).toBe('PERIODICO');
    expect(result.medicalExams[0].employeeId.equals(employeeIdA)).toBe(true);
  });
});
