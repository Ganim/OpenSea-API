import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateAbsencesReportUseCase } from './generate-absences-report';

let absencesRepository: InMemoryAbsencesRepository;
let sut: GenerateAbsencesReportUseCase;
const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID();

describe('Generate Absences Report Use Case', () => {
  beforeEach(() => {
    absencesRepository = new InMemoryAbsencesRepository();
    sut = new GenerateAbsencesReportUseCase(absencesRepository);
  });

  it('should generate CSV with correct headers and absence data', async () => {
    await absencesRepository.create({
      tenantId,
      employeeId,
      type: 'VACATION',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-15'),
      totalDays: 15,
      reason: 'Férias regulares',
      isPaid: true,
    });

    await absencesRepository.create({
      tenantId,
      employeeId,
      type: 'SICK_LEAVE',
      startDate: new Date('2024-07-10'),
      endDate: new Date('2024-07-12'),
      totalDays: 3,
      reason: 'Consulta médica',
      isPaid: true,
    });

    const result = await sut.execute({
      tenantId,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });

    // BOM prefix
    expect(result.csv.startsWith('\uFEFF')).toBe(true);

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    expect(lines.length).toBe(3); // header + 2 rows

    // Header
    expect(lines[0]).toContain('Funcionário');
    expect(lines[0]).toContain('Tipo de Ausência');
    expect(lines[0]).toContain('Data Início');
    expect(lines[0]).toContain('Data Fim');
    expect(lines[0]).toContain('Dias');
    expect(lines[0]).toContain('Status');
    expect(lines[0]).toContain('Motivo');

    // Data - type labels translated
    const allContent = lines.join('\n');
    expect(allContent).toContain('"Férias"');
    expect(allContent).toContain('"Licença Médica"');
    expect(allContent).toContain('"Pendente"'); // default status is PENDING
    expect(allContent).toContain('"Férias regulares"');

    // File name includes date range
    expect(result.fileName).toMatch(/^ausencias_.*\.csv$/);
  });

  it('should return header-only CSV when no absences exist', async () => {
    const result = await sut.execute({
      tenantId,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    expect(lines.length).toBe(1); // header only
    expect(lines[0]).toContain('Funcionário');
    expect(lines[0]).toContain('Tipo de Ausência');
  });

  it('should calculate days correctly between start and end dates', async () => {
    await absencesRepository.create({
      tenantId,
      employeeId,
      type: 'VACATION',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-03'),
      totalDays: 3,
      isPaid: true,
    });

    const result = await sut.execute({
      tenantId,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    // Days column should show 3 (June 1 to June 3 inclusive)
    expect(lines[1]).toContain('"3"');
  });

  it('should filter absences by employee', async () => {
    const otherEmployeeId = new UniqueEntityID();

    await absencesRepository.create({
      tenantId,
      employeeId,
      type: 'VACATION',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-15'),
      totalDays: 15,
      isPaid: true,
    });

    await absencesRepository.create({
      tenantId,
      employeeId: otherEmployeeId,
      type: 'SICK_LEAVE',
      startDate: new Date('2024-06-10'),
      endDate: new Date('2024-06-12'),
      totalDays: 3,
      isPaid: true,
    });

    const result = await sut.execute({
      tenantId,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      employeeId: employeeId.toString(),
    });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    expect(lines.length).toBe(2); // header + 1 row (only the matching employee)
  });

  it('should filter absences by type', async () => {
    await absencesRepository.create({
      tenantId,
      employeeId,
      type: 'VACATION',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-15'),
      totalDays: 15,
      isPaid: true,
    });

    await absencesRepository.create({
      tenantId,
      employeeId,
      type: 'SICK_LEAVE',
      startDate: new Date('2024-07-10'),
      endDate: new Date('2024-07-12'),
      totalDays: 3,
      isPaid: true,
    });

    const result = await sut.execute({
      tenantId,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      type: 'SICK_LEAVE',
    });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    expect(lines.length).toBe(2); // header + 1 matching row
    expect(lines[1]).toContain('"Licença Médica"');
  });

  it('should filter absences by status', async () => {
    await absencesRepository.create({
      tenantId,
      employeeId,
      type: 'VACATION',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-15'),
      totalDays: 15,
      isPaid: true,
    });

    const result = await sut.execute({
      tenantId,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: 'APPROVED',
    });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    // Default status is PENDING, so filtering by APPROVED returns no rows
    expect(lines.length).toBe(1); // header only
  });

  it('should not include absences from another tenant', async () => {
    const otherTenantId = new UniqueEntityID().toString();

    await absencesRepository.create({
      tenantId: otherTenantId,
      employeeId,
      type: 'VACATION',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-15'),
      totalDays: 15,
      isPaid: true,
    });

    const result = await sut.execute({
      tenantId,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    expect(lines.length).toBe(1); // header only
  });

  it('should use semicolon as CSV delimiter', async () => {
    await absencesRepository.create({
      tenantId,
      employeeId,
      type: 'VACATION',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-15'),
      totalDays: 15,
      isPaid: true,
    });

    const result = await sut.execute({
      tenantId,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    expect(lines[0].split(';').length).toBe(7);
    expect(lines[1].split(';').length).toBe(7);
  });
});
