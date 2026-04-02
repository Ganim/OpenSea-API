import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntryType } from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTimeEntriesRepository } from '@/repositories/hr/in-memory/in-memory-time-entries-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GenerateTimesheetPDFUseCase } from './generate-timesheet-pdf';

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
  drawSectionHeader: vi.fn().mockReturnValue(100),
  drawTableHeader: vi.fn().mockReturnValue(120),
  drawTableRow: vi.fn().mockReturnValue(140),
  formatDateBR: vi.fn().mockReturnValue('01/03/2026'),
  formatBRL: vi.fn().mockReturnValue('R$ 0,00'),
  formatCNPJ: vi.fn().mockReturnValue('12.345.678/0001-90'),
  formatMinutesToHHMM: vi.fn().mockImplementation((m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }),
  formatMonthYear: vi.fn().mockReturnValue('03/2026'),
  maskCPF: vi.fn().mockReturnValue('***.***.247-**'),
  TableColumn: undefined,
}));

let timeEntriesRepository: InMemoryTimeEntriesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: GenerateTimesheetPDFUseCase;

describe('GenerateTimesheetPDFUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    timeEntriesRepository = new InMemoryTimeEntriesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new GenerateTimesheetPDFUseCase(
      timeEntriesRepository,
      employeesRepository,
    );
  });

  async function createEmployee() {
    return employeesRepository.create({
      tenantId: 'tenant-1',
      registrationNumber: '001',
      fullName: 'Maria Silva',
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

  async function createWorkDay(
    employeeId: UniqueEntityID,
    day: number,
    month = 3,
    year = 2026,
  ) {
    // Create CLOCK_IN at 08:00
    await timeEntriesRepository.create({
      tenantId: 'tenant-1',
      employeeId,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date(year, month - 1, day, 8, 0),
    });
    // Create BREAK_START at 12:00
    await timeEntriesRepository.create({
      tenantId: 'tenant-1',
      employeeId,
      entryType: TimeEntryType.BREAK_START(),
      timestamp: new Date(year, month - 1, day, 12, 0),
    });
    // Create BREAK_END at 13:00
    await timeEntriesRepository.create({
      tenantId: 'tenant-1',
      employeeId,
      entryType: TimeEntryType.BREAK_END(),
      timestamp: new Date(year, month - 1, day, 13, 0),
    });
    // Create CLOCK_OUT at 17:00
    await timeEntriesRepository.create({
      tenantId: 'tenant-1',
      employeeId,
      entryType: TimeEntryType.CLOCK_OUT(),
      timestamp: new Date(year, month - 1, day, 17, 0),
    });
  }

  it('should generate a timesheet PDF for an existing employee', async () => {
    const employee = await createEmployee();
    await createWorkDay(employee.id, 3);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      employeeId: employee.id.toString(),
      month: 3,
      year: 2026,
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.filename).toContain('espelho_ponto');
    expect(result.filename).toContain('001'); // registration number
    expect(result.filename).toMatch(/\.pdf$/);
  });

  it('should throw ResourceNotFoundError if employee does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        employeeId: 'nonexistent',
        month: 3,
        year: 2026,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should generate PDF even when no time entries exist', async () => {
    const employee = await createEmployee();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      employeeId: employee.id.toString(),
      month: 3,
      year: 2026,
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('should include period in filename', async () => {
    const employee = await createEmployee();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      employeeId: employee.id.toString(),
      month: 3,
      year: 2026,
    });

    expect(result.filename).toContain('03-2026');
  });

  it('should accept optional company info', async () => {
    const employee = await createEmployee();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      employeeId: employee.id.toString(),
      month: 3,
      year: 2026,
      companyName: 'Empresa Teste',
      companyCnpj: '12345678000190',
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('should accept custom daily expected minutes', async () => {
    const employee = await createEmployee();
    await createWorkDay(employee.id, 3);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      employeeId: employee.id.toString(),
      month: 3,
      year: 2026,
      dailyExpectedMinutes: 360, // 6h
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
  });
});
