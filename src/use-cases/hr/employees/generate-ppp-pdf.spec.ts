import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryMedicalExamsRepository } from '@/repositories/hr/in-memory/in-memory-medical-exams-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeneratePPPUseCase } from './generate-ppp-pdf';

vi.mock('@/lib/pdf/pdf-generator', () => ({
  createPDFDocument: vi.fn().mockReturnValue({
    font: vi.fn().mockReturnThis(),
    fontSize: vi.fn().mockReturnThis(),
    fillColor: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    addPage: vi.fn().mockReturnThis(),
    page: {
      width: 595,
      height: 842,
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
    },
    end: vi.fn(),
    on: vi.fn(),
  }),
  collectPDFBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-pdf')),
  drawHorizontalLine: vi.fn(),
  drawSectionHeader: vi.fn().mockReturnValue(100),
  drawTableHeader: vi.fn().mockReturnValue(120),
  drawTableRow: vi.fn().mockReturnValue(140),
  formatDateBR: vi.fn().mockReturnValue('01/01/2026'),
  formatCNPJ: vi.fn().mockReturnValue('12.345.678/0001-90'),
}));

let employeesRepository: InMemoryEmployeesRepository;
let medicalExamsRepository: InMemoryMedicalExamsRepository;
let sut: GeneratePPPUseCase;

describe('GeneratePPPUseCase', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    medicalExamsRepository = new InMemoryMedicalExamsRepository();
    sut = new GeneratePPPUseCase(employeesRepository, medicalExamsRepository);
  });

  async function createEmployee(id?: string) {
    const _empId = new UniqueEntityID(id ?? 'emp-1');
    return employeesRepository.create({
      tenantId: 'tenant-1',
      registrationNumber: '001',
      fullName: 'João da Silva',
      cpf: { value: '52998224725', formatted: '529.982.247-25' } as unknown,
      pis: { value: '12345678901', formatted: '123.45678.90-1' } as unknown,
      hireDate: new Date('2024-01-15'),
      status: {
        value: 'ACTIVE',
        isActive: () => true,
        isTerminated: () => false,
        canWork: () => true,
      } as unknown,
      contractType: {
        value: 'CLT',
        hasEmploymentRights: () => true,
      } as unknown,
      workRegime: {
        value: 'FULL_TIME',
        requiresTimeTracking: () => true,
      } as unknown,
      weeklyHours: 44,
      country: 'BR',
      pcd: false,
      metadata: {
        companyLegalName: 'Empresa Teste LTDA',
        companyCnpj: '12345678000190',
      },
      pendingIssues: [],
    });
  }

  it('should generate a PPP PDF for an existing employee', async () => {
    const employee = await createEmployee();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      employeeId: employee.id.toString(),
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.filename).toContain('PPP_');
    expect(result.filename).toContain('.pdf');
  });

  it('should throw ResourceNotFoundError if employee does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        employeeId: 'nonexistent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should include employee name in filename', async () => {
    const employee = await createEmployee();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      employeeId: employee.id.toString(),
    });

    expect(result.filename).toContain('Jo_o_da_Silva');
  });

  it('should include current date in filename', async () => {
    const employee = await createEmployee();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      employeeId: employee.id.toString(),
    });

    const today = new Date().toISOString().split('T')[0];
    expect(result.filename).toContain(today);
  });

  it('should work when employee has medical exams', async () => {
    const employee = await createEmployee();

    await medicalExamsRepository.create({
      tenantId: 'tenant-1',
      employeeId: employee.id,
      type: 'ADMISSIONAL',
      examDate: new Date('2024-01-10'),
      doctorName: 'Dr. Teste',
      doctorCrm: 'CRM-12345',
      result: 'APTO',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      employeeId: employee.id.toString(),
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
  });
});
