import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPayrollItemsRepository } from '@/repositories/hr/in-memory/in-memory-payroll-items-repository';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeneratePayslipPDFUseCase } from './generate-payslip-pdf';

// Mock the PDF library to avoid needing PDFKit in unit tests
vi.mock('@/lib/pdf', () => {
  const mockDoc = {
    page: {
      margins: { left: 50, right: 50, top: 50, bottom: 50 },
      width: 595,
      height: 842,
    },
    font: vi.fn().mockReturnThis(),
    fontSize: vi.fn().mockReturnThis(),
    fillColor: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    addPage: vi.fn().mockReturnThis(),
  };

  return {
    createPDFDocument: vi.fn().mockReturnValue(mockDoc),
    collectPDFBuffer: vi
      .fn()
      .mockResolvedValue(Buffer.from('mock-pdf-content')),
    drawHorizontalLine: vi.fn().mockReturnValue(100),
    drawSectionHeader: vi.fn().mockReturnValue(120),
    drawTableHeader: vi.fn().mockReturnValue(140),
    drawTableRow: vi.fn().mockReturnValue(160),
    formatBRL: vi.fn((value: number) => `R$ ${value.toFixed(2)}`),
    formatCNPJ: vi.fn((cnpj: string) => cnpj),
    formatDateBR: vi.fn(() => '15/06/2024'),
    formatMonthYear: vi.fn(
      (month: number, year: number) =>
        `${String(month).padStart(2, '0')}/${year}`,
    ),
    maskCPF: vi.fn((cpf: string) => cpf.replace(/(\d{3})(\d{3})/, '***.$2')),
  };
});

let payrollsRepository: InMemoryPayrollsRepository;
let payrollItemsRepository: InMemoryPayrollItemsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: GeneratePayslipPDFUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Generate Payslip PDF Use Case', () => {
  beforeEach(() => {
    payrollsRepository = new InMemoryPayrollsRepository();
    payrollItemsRepository = new InMemoryPayrollItemsRepository();
    employeesRepository = new InMemoryEmployeesRepository();

    sut = new GeneratePayslipPDFUseCase(
      payrollsRepository,
      payrollItemsRepository,
      employeesRepository,
    );
  });

  async function createTestEmployee() {
    return employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João da Silva',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-15'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 5000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  }

  async function createPayrollWithItems(employeeId: UniqueEntityID) {
    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    // Add earnings
    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId,
      type: 'BASE_SALARY',
      description: 'Salário Base',
      amount: 5000,
      isDeduction: false,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId,
      type: 'OVERTIME',
      description: 'Horas Extras 50%',
      amount: 340.91,
      isDeduction: false,
    });

    // Add deductions
    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId,
      type: 'INSS',
      description: 'INSS',
      amount: 504.43,
      isDeduction: true,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId,
      type: 'IRRF',
      description: 'IRRF',
      amount: 85.28,
      isDeduction: true,
    });

    // FGTS (informative, not deduction)
    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId,
      type: 'FGTS',
      description: 'FGTS',
      amount: 427.27,
      isDeduction: false,
    });

    return payroll;
  }

  it('should generate a PDF buffer and filename', async () => {
    const employee = await createTestEmployee();
    const payroll = await createPayrollWithItems(employee.id);

    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
      employeeId: employee.id.toString(),
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.filename).toContain('holerite');
    expect(result.filename).toContain('EMP001');
    expect(result.filename).toContain('.pdf');
  });

  it('should include company name and CNPJ in PDF when provided', async () => {
    const employee = await createTestEmployee();
    const payroll = await createPayrollWithItems(employee.id);

    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
      employeeId: employee.id.toString(),
      companyName: 'Empresa Demo LTDA',
      companyCnpj: '12.345.678/0001-00',
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.filename).toBeDefined();
  });

  it('should throw error if payroll not found', async () => {
    const employee = await createTestEmployee();

    await expect(
      sut.execute({
        tenantId,
        payrollId: new UniqueEntityID().toString(),
        employeeId: employee.id.toString(),
      }),
    ).rejects.toThrow('Folha de pagamento não encontrada');
  });

  it('should throw error if employee not found', async () => {
    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    await expect(
      sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        employeeId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Funcionário não encontrado');
  });

  it('should throw error if no payroll items found for employee', async () => {
    const employee = await createTestEmployee();
    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    await expect(
      sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        employeeId: employee.id.toString(),
      }),
    ).rejects.toThrow('Nenhum item de folha encontrado para este funcionário');
  });

  it('should generate correct filename format with period', async () => {
    const employee = await createTestEmployee();
    const payroll = await createPayrollWithItems(employee.id);

    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
      employeeId: employee.id.toString(),
    });

    // Filename format: holerite_{registrationNumber}_{MM-YYYY}.pdf
    expect(result.filename).toMatch(/^holerite_EMP001_\d{2}-\d{4}\.pdf$/);
  });
});
