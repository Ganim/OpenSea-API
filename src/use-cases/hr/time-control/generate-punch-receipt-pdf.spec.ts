import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntryType } from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTimeEntriesRepository } from '@/repositories/hr/in-memory/in-memory-time-entries-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeneratePunchReceiptPDFUseCase } from './generate-punch-receipt-pdf';

vi.mock('@/lib/pdf', () => ({
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
  formatDateBR: vi.fn().mockReturnValue('15/03/2026'),
  formatCNPJ: vi.fn().mockReturnValue('12.345.678/0001-90'),
  maskCPF: vi.fn().mockReturnValue('***.***.247-**'),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    timeEntry: {
      findUnique: vi.fn().mockResolvedValue({ nsrNumber: 42 }),
    },
  },
}));

let timeEntriesRepository: InMemoryTimeEntriesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: GeneratePunchReceiptPDFUseCase;

describe('GeneratePunchReceiptPDFUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    timeEntriesRepository = new InMemoryTimeEntriesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new GeneratePunchReceiptPDFUseCase(
      timeEntriesRepository,
      employeesRepository,
    );
  });

  async function createEmployee() {
    return employeesRepository.create({
      tenantId: 'tenant-1',
      registrationNumber: '001',
      fullName: 'João da Silva',
      cpf: { value: '52998224725', formatted: '529.982.247-25' } as unknown,
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
      metadata: {},
      pendingIssues: [],
    });
  }

  async function createTimeEntry(employeeId: UniqueEntityID) {
    return timeEntriesRepository.create({
      tenantId: 'tenant-1',
      employeeId,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2026-03-15T08:00:00'),
      ipAddress: '192.168.1.1',
      latitude: -23.55052,
      longitude: -46.633308,
    });
  }

  it('should generate a punch receipt PDF', async () => {
    const employee = await createEmployee();
    const timeEntry = await createTimeEntry(employee.id);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      timeEntryId: timeEntry.id.toString(),
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.filename).toContain('comprovante_ponto');
    expect(result.filename).toContain('001'); // registration number
    expect(result.filename).toMatch(/\.pdf$/);
  });

  it('should throw ResourceNotFoundError if time entry does not exist', async () => {
    await createEmployee();

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        timeEntryId: 'nonexistent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError if employee does not exist', async () => {
    // Create time entry with a non-existent employee
    const fakeEmpId = new UniqueEntityID('fake-emp');
    const timeEntry = await timeEntriesRepository.create({
      tenantId: 'tenant-1',
      employeeId: fakeEmpId,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2026-03-15T08:00:00'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        timeEntryId: timeEntry.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should include company info when provided', async () => {
    const employee = await createEmployee();
    const timeEntry = await createTimeEntry(employee.id);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      timeEntryId: timeEntry.id.toString(),
      companyName: 'Empresa Teste',
      companyCnpj: '12345678000190',
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('should include date in filename', async () => {
    const employee = await createEmployee();
    const timeEntry = await createTimeEntry(employee.id);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      timeEntryId: timeEntry.id.toString(),
    });

    expect(result.filename).toContain('15-03-2026');
  });
});
