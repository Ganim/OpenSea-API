import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  NoticeType,
  Termination,
  TerminationStatus,
  TerminationType,
} from '@/entities/hr/termination';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTerminationsRepository } from '@/repositories/hr/in-memory/in-memory-terminations-repository';
import { generateValidCPF } from '@/utils/tests/factories/hr/make-employee';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateTRCTPDFUseCase } from './generate-trct-pdf';

let terminationsRepository: InMemoryTerminationsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: GenerateTRCTPDFUseCase;

const tenantId = new UniqueEntityID().toString();

async function seedEmployee(overrides?: {
  hireDate?: Date;
  baseSalary?: number;
}) {
  return employeesRepository.create({
    tenantId,
    registrationNumber: `EMP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fullName: 'Maria Oliveira',
    cpf: CPF.create(generateValidCPF()),
    hireDate: overrides?.hireDate ?? new Date('2020-01-01'),
    baseSalary: overrides?.baseSalary ?? 5000,
    status: EmployeeStatus.TERMINATED(),
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
    country: 'Brasil',
  });
}

describe('Generate TRCT PDF Use Case', () => {
  beforeEach(() => {
    terminationsRepository = new InMemoryTerminationsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new GenerateTRCTPDFUseCase(
      terminationsRepository,
      employeesRepository,
    );
  });

  it('should generate a PDF buffer for a valid termination', async () => {
    const employee = await seedEmployee();

    const termination = Termination.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: employee.id,
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate: new Date('2025-03-15'),
      lastWorkDay: new Date('2025-03-15'),
      noticeType: NoticeType.INDENIZADO,
      noticeDays: 45,
      paymentDeadline: new Date('2025-03-25'),
      status: TerminationStatus.CALCULATED,
      saldoSalario: 2500,
      avisoIndenizado: 7500,
      decimoTerceiroProp: 1250,
      feriasVencidas: 5000,
      feriasVencidasTerco: 1666.67,
      feriasProporcional: 1250,
      feriasProporcionalTerco: 416.67,
      multaFgts: 6000,
      inssRescisao: 800,
      irrfRescisao: 500,
      outrosDescontos: 0,
      totalBruto: 25583.34,
      totalDescontos: 1300,
      totalLiquido: 24283.34,
    });
    terminationsRepository.items.push(termination);

    const { buffer, filename } = await sut.execute({
      tenantId,
      terminationId: termination.id.toString(),
      companyName: 'Empresa Teste LTDA',
      companyCnpj: '12345678000199',
      companyAddress: 'Rua Teste, 123 - Centro',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(filename).toContain('trct_');
    expect(filename).toContain(employee.registrationNumber);
    expect(filename.endsWith('.pdf')).toBe(true);
  });

  it('should throw if termination not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        terminationId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Rescisão não encontrada');
  });

  it('should throw if employee not found', async () => {
    const orphanTermination = Termination.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(),
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate: new Date('2025-03-15'),
      lastWorkDay: new Date('2025-03-15'),
      noticeType: NoticeType.INDENIZADO,
      noticeDays: 30,
      paymentDeadline: new Date('2025-03-25'),
    });
    terminationsRepository.items.push(orphanTermination);

    await expect(
      sut.execute({
        tenantId,
        terminationId: orphanTermination.id.toString(),
      }),
    ).rejects.toThrow('Funcionário não encontrado');
  });

  it('should generate PDF without optional company data', async () => {
    const employee = await seedEmployee({
      hireDate: new Date('2022-06-01'),
      baseSalary: 3000,
    });

    const termination = Termination.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: employee.id,
      type: TerminationType.PEDIDO_DEMISSAO,
      terminationDate: new Date('2025-03-10'),
      lastWorkDay: new Date('2025-03-10'),
      noticeType: NoticeType.TRABALHADO,
      noticeDays: 30,
      paymentDeadline: new Date('2025-03-20'),
    });
    terminationsRepository.items.push(termination);

    const { buffer, filename } = await sut.execute({
      tenantId,
      terminationId: termination.id.toString(),
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(filename).toContain('.pdf');
  });
});
