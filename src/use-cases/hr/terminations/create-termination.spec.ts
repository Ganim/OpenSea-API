import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { NoticeType, TerminationType } from '@/entities/hr/termination';
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
import { CreateTerminationUseCase } from './create-termination';

let terminationsRepository: InMemoryTerminationsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: CreateTerminationUseCase;

const tenantId = new UniqueEntityID().toString();

/** Helper to create an employee via the repository */
async function seedEmployee(overrides: {
  hireDate?: Date;
  baseSalary?: number;
  status?: EmployeeStatus;
  isPregnant?: boolean;
  metadata?: Record<string, unknown>;
}) {
  return employeesRepository.create({
    tenantId,
    registrationNumber: `EMP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fullName: 'Test Employee',
    cpf: CPF.create(generateValidCPF()),
    hireDate: overrides.hireDate ?? new Date('2022-01-01'),
    baseSalary: overrides.baseSalary ?? 5000,
    status: overrides.status ?? EmployeeStatus.ACTIVE(),
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
    country: 'Brasil',
    isPregnant: overrides.isPregnant,
    metadata: overrides.metadata,
  });
}

describe('Create Termination Use Case', () => {
  beforeEach(() => {
    terminationsRepository = new InMemoryTerminationsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new CreateTerminationUseCase(
      terminationsRepository,
      employeesRepository,
    );
  });

  it('should create a termination for an active employee', async () => {
    const activeEmployee = await seedEmployee({
      hireDate: new Date('2020-01-15'),
      baseSalary: 5000,
    });

    const terminationDate = new Date('2025-03-15');
    const lastWorkDay = new Date('2025-03-15');

    const { termination } = await sut.execute({
      tenantId,
      employeeId: activeEmployee.id.toString(),
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate,
      lastWorkDay,
      noticeType: NoticeType.INDENIZADO,
    });

    expect(termination).toBeDefined();
    expect(termination.type).toBe(TerminationType.SEM_JUSTA_CAUSA);
    expect(termination.noticeType).toBe(NoticeType.INDENIZADO);
    expect(termination.isPending()).toBe(true);
    expect(terminationsRepository.items).toHaveLength(1);
  });

  it('should calculate notice days based on years of service (Lei 12.506/2011)', async () => {
    const activeEmployee = await seedEmployee({
      hireDate: new Date('2020-01-15'),
      baseSalary: 5000,
    });

    const terminationDate = new Date('2025-03-15');

    const { termination } = await sut.execute({
      tenantId,
      employeeId: activeEmployee.id.toString(),
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate,
      lastWorkDay: terminationDate,
      noticeType: NoticeType.INDENIZADO,
    });

    // 5 years of service: 30 + (3 * 5) = 45 days
    expect(termination.noticeDays).toBe(45);
  });

  it('should cap notice days at 90', async () => {
    const seniorEmployee = await seedEmployee({
      hireDate: new Date('2000-01-01'),
      baseSalary: 10000,
    });

    const terminationDate = new Date('2025-06-01');

    const { termination } = await sut.execute({
      tenantId,
      employeeId: seniorEmployee.id.toString(),
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate,
      lastWorkDay: terminationDate,
      noticeType: NoticeType.INDENIZADO,
    });

    // 25 years: 30 + (3 * 25) = 105 -> capped at 90
    expect(termination.noticeDays).toBe(90);
  });

  it('should give 30 notice days for less than 1 year of service', async () => {
    const recentEmployee = await seedEmployee({
      hireDate: new Date('2025-01-01'),
      baseSalary: 3000,
    });

    const terminationDate = new Date('2025-06-15');

    const { termination } = await sut.execute({
      tenantId,
      employeeId: recentEmployee.id.toString(),
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate,
      lastWorkDay: terminationDate,
      noticeType: NoticeType.INDENIZADO,
    });

    // 0 complete years: 30 + (3 * 0) = 30
    expect(termination.noticeDays).toBe(30);
  });

  it('should set payment deadline to 10 calendar days after termination date', async () => {
    const activeEmployee = await seedEmployee({
      hireDate: new Date('2022-05-01'),
      baseSalary: 4000,
    });

    const terminationDate = new Date('2025-03-15');

    const { termination } = await sut.execute({
      tenantId,
      employeeId: activeEmployee.id.toString(),
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate,
      lastWorkDay: terminationDate,
      noticeType: NoticeType.INDENIZADO,
    });

    const expectedDeadline = new Date('2025-03-25');
    expect(termination.paymentDeadline.getFullYear()).toBe(
      expectedDeadline.getFullYear(),
    );
    expect(termination.paymentDeadline.getMonth()).toBe(
      expectedDeadline.getMonth(),
    );
    expect(termination.paymentDeadline.getDate()).toBe(
      expectedDeadline.getDate(),
    );
  });

  it('should update employee status to TERMINATED', async () => {
    const activeEmployee = await seedEmployee({
      hireDate: new Date('2022-01-01'),
      baseSalary: 5000,
    });

    await sut.execute({
      tenantId,
      employeeId: activeEmployee.id.toString(),
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate: new Date('2025-03-15'),
      lastWorkDay: new Date('2025-03-15'),
      noticeType: NoticeType.INDENIZADO,
    });

    const updatedEmployee = await employeesRepository.findById(
      activeEmployee.id,
      tenantId,
    );

    expect(updatedEmployee?.status.value).toBe('TERMINATED');
  });

  it('should throw if employee does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate: new Date(),
        lastWorkDay: new Date(),
        noticeType: NoticeType.INDENIZADO,
      }),
    ).rejects.toThrow('Funcionário não encontrado');
  });

  it('should throw if employee is already terminated', async () => {
    const terminatedEmployee = await seedEmployee({
      hireDate: new Date('2020-01-01'),
      baseSalary: 3000,
      status: EmployeeStatus.TERMINATED(),
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: terminatedEmployee.id.toString(),
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate: new Date('2025-03-15'),
        lastWorkDay: new Date('2025-03-15'),
        noticeType: NoticeType.INDENIZADO,
      }),
    ).rejects.toThrow('Funcionário já está desligado');
  });

  it('should block duplicate termination after first termination changes status', async () => {
    const activeEmployee = await seedEmployee({
      hireDate: new Date('2020-01-01'),
      baseSalary: 4000,
    });

    // Create first termination -- this sets employee status to TERMINATED
    await sut.execute({
      tenantId,
      employeeId: activeEmployee.id.toString(),
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate: new Date('2025-03-15'),
      lastWorkDay: new Date('2025-03-15'),
      noticeType: NoticeType.INDENIZADO,
    });

    // Attempt duplicate — blocked because employee status is TERMINATED
    await expect(
      sut.execute({
        tenantId,
        employeeId: activeEmployee.id.toString(),
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate: new Date('2025-03-20'),
        lastWorkDay: new Date('2025-03-20'),
        noticeType: NoticeType.INDENIZADO,
      }),
    ).rejects.toThrow('Funcionário já está desligado');
  });

  it('should block SEM_JUSTA_CAUSA for pregnant employee (stability)', async () => {
    const pregnantEmployee = await seedEmployee({
      hireDate: new Date('2020-01-01'),
      baseSalary: 4000,
      isPregnant: true,
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: pregnantEmployee.id.toString(),
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate: new Date('2025-03-15'),
        lastWorkDay: new Date('2025-03-15'),
        noticeType: NoticeType.INDENIZADO,
      }),
    ).rejects.toThrow('estabilidade provisória');
  });

  it('should allow JUSTA_CAUSA for pregnant employee (stability-exempt)', async () => {
    const pregnantEmployee = await seedEmployee({
      hireDate: new Date('2020-01-01'),
      baseSalary: 4000,
      isPregnant: true,
    });

    const { termination } = await sut.execute({
      tenantId,
      employeeId: pregnantEmployee.id.toString(),
      type: TerminationType.JUSTA_CAUSA,
      terminationDate: new Date('2025-03-15'),
      lastWorkDay: new Date('2025-03-15'),
      noticeType: NoticeType.TRABALHADO,
    });

    expect(termination).toBeDefined();
    expect(termination.type).toBe(TerminationType.JUSTA_CAUSA);
  });

  it('should allow PEDIDO_DEMISSAO for pregnant employee (stability-exempt)', async () => {
    const pregnantEmployee = await seedEmployee({
      hireDate: new Date('2020-01-01'),
      baseSalary: 4000,
      isPregnant: true,
    });

    const { termination } = await sut.execute({
      tenantId,
      employeeId: pregnantEmployee.id.toString(),
      type: TerminationType.PEDIDO_DEMISSAO,
      terminationDate: new Date('2025-03-15'),
      lastWorkDay: new Date('2025-03-15'),
      noticeType: NoticeType.INDENIZADO,
    });

    expect(termination).toBeDefined();
    expect(termination.type).toBe(TerminationType.PEDIDO_DEMISSAO);
  });

  it('should allow FALECIMENTO for pregnant employee (stability-exempt)', async () => {
    const pregnantEmployee = await seedEmployee({
      hireDate: new Date('2020-01-01'),
      baseSalary: 4000,
      isPregnant: true,
    });

    const { termination } = await sut.execute({
      tenantId,
      employeeId: pregnantEmployee.id.toString(),
      type: TerminationType.FALECIMENTO,
      terminationDate: new Date('2025-03-15'),
      lastWorkDay: new Date('2025-03-15'),
      noticeType: NoticeType.DISPENSADO,
    });

    expect(termination).toBeDefined();
    expect(termination.type).toBe(TerminationType.FALECIMENTO);
  });

  it('should block ACORDO_MUTUO for employee with work accident stability', async () => {
    // Return date 3 months ago — stability lasts 12 months, so still active
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const accidentEmployee = await seedEmployee({
      hireDate: new Date('2020-01-01'),
      baseSalary: 5000,
      metadata: {
        workAccidentReturnDate: threeMonthsAgo.toISOString(),
      },
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: accidentEmployee.id.toString(),
        type: TerminationType.ACORDO_MUTUO,
        terminationDate: new Date(),
        lastWorkDay: new Date(),
        noticeType: NoticeType.INDENIZADO,
      }),
    ).rejects.toThrow('estabilidade');
  });

  it('should allow RESCISAO_INDIRETA for employee with work accident stability (stability-exempt)', async () => {
    const accidentEmployee = await seedEmployee({
      hireDate: new Date('2020-01-01'),
      baseSalary: 5000,
      metadata: {
        workAccidentReturnDate: new Date('2025-01-15').toISOString(),
      },
    });

    const { termination } = await sut.execute({
      tenantId,
      employeeId: accidentEmployee.id.toString(),
      type: TerminationType.RESCISAO_INDIRETA,
      terminationDate: new Date('2025-06-15'),
      lastWorkDay: new Date('2025-06-15'),
      noticeType: NoticeType.INDENIZADO,
    });

    expect(termination).toBeDefined();
    expect(termination.type).toBe(TerminationType.RESCISAO_INDIRETA);
  });

  it('should store optional notes', async () => {
    const activeEmployee = await seedEmployee({
      hireDate: new Date('2022-01-01'),
      baseSalary: 5000,
    });

    const { termination } = await sut.execute({
      tenantId,
      employeeId: activeEmployee.id.toString(),
      type: TerminationType.PEDIDO_DEMISSAO,
      terminationDate: new Date('2025-03-15'),
      lastWorkDay: new Date('2025-03-15'),
      noticeType: NoticeType.TRABALHADO,
      notes: 'Employee requested resignation for personal reasons',
    });

    expect(termination.notes).toBe(
      'Employee requested resignation for personal reasons',
    );
  });
});
