import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
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
import { CalculateTerminationPaymentUseCase } from './calculate-termination-payment';

let terminationsRepository: InMemoryTerminationsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: CalculateTerminationPaymentUseCase;

const tenantId = new UniqueEntityID().toString();

/** Round to 2 decimal places (mirrors the use case helper) */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Seed an employee via the repository */
async function seedEmployee(overrides: {
  hireDate: Date;
  baseSalary: number;
}): Promise<Employee> {
  return employeesRepository.create({
    tenantId,
    registrationNumber: `EMP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fullName: 'Test Employee',
    cpf: CPF.create(generateValidCPF()),
    hireDate: overrides.hireDate,
    baseSalary: overrides.baseSalary,
    status: EmployeeStatus.ACTIVE(),
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
    country: 'Brasil',
  });
}

/** Create a PENDING termination and push it to the repository */
function seedTermination(overrides: {
  employeeId: UniqueEntityID;
  type: TerminationType;
  terminationDate: Date;
  noticeType?: NoticeType;
  noticeDays?: number;
  status?: TerminationStatus;
}): Termination {
  const terminationDate = overrides.terminationDate;
  const paymentDeadline = new Date(terminationDate);
  paymentDeadline.setDate(paymentDeadline.getDate() + 10);

  const termination = Termination.create({
    tenantId: new UniqueEntityID(tenantId),
    employeeId: overrides.employeeId,
    type: overrides.type,
    terminationDate,
    lastWorkDay: terminationDate,
    noticeType: overrides.noticeType ?? NoticeType.INDENIZADO,
    noticeDays: overrides.noticeDays ?? 30,
    paymentDeadline,
    status: overrides.status,
  });

  terminationsRepository.items.push(termination);
  return termination;
}

describe('Calculate Termination Payment Use Case', () => {
  beforeEach(() => {
    terminationsRepository = new InMemoryTerminationsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new CalculateTerminationPaymentUseCase(
      terminationsRepository,
      employeesRepository,
    );
  });

  // ─── SEM_JUSTA_CAUSA ─────────────────────────────────────────────────

  describe('SEM_JUSTA_CAUSA', () => {
    it('should calculate all verbas rescisórias with 40% FGTS', async () => {
      const baseSalary = 6000;
      const hireDate = new Date('2022-01-10');
      const terminationDate = new Date('2025-03-15');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate,
        noticeDays: 39,
      });

      const fgtsBalance = 15000;

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
        totalFgtsBalance: fgtsBalance,
      });

      // Saldo salário: proportional to days worked in the month
      expect(breakdown.saldoSalario).toBeGreaterThan(0);

      // Aviso prévio indenizado: (6000/30) * 39
      expect(breakdown.avisoIndenizado).toBe(round((baseSalary / 30) * 39));

      // 13º proporcional: some months worked this year
      expect(breakdown.decimoTerceiroProp).toBeGreaterThan(0);

      // Multa FGTS 40%
      expect(breakdown.multaFgts).toBe(round(fgtsBalance * 0.4));

      // INSS and IRRF should be computed
      expect(breakdown.inssRescisao).toBeGreaterThan(0);

      // No outros descontos for SEM_JUSTA_CAUSA
      expect(breakdown.outrosDescontos).toBe(0);

      // Totals
      expect(breakdown.totalBruto).toBeGreaterThan(0);
      expect(breakdown.totalLiquido).toBe(
        round(breakdown.totalBruto - breakdown.totalDescontos),
      );
    });

    it('should include férias vencidas for employee with 2+ years', async () => {
      const baseSalary = 4000;
      const hireDate = new Date('2022-01-01');
      const terminationDate = new Date('2025-06-15');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate,
        noticeDays: 39,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
      });

      // 3.5 years -> completeYears = 3 -> vencidas = 3-1 = 2
      expect(breakdown.feriasVencidas).toBeGreaterThan(0);
      expect(breakdown.feriasVencidasTerco).toBe(
        round(breakdown.feriasVencidas / 3),
      );
    });
  });

  // ─── JUSTA_CAUSA ──────────────────────────────────────────────────────

  describe('JUSTA_CAUSA', () => {
    it('should exclude 13º, férias proporcionais, multa FGTS, and aviso prévio', async () => {
      const baseSalary = 5000;
      const hireDate = new Date('2023-06-01');
      const terminationDate = new Date('2025-03-20');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.JUSTA_CAUSA,
        terminationDate,
        noticeType: NoticeType.TRABALHADO,
        noticeDays: 30,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
        totalFgtsBalance: 10000,
      });

      // Saldo de salário: proportional to days worked
      expect(breakdown.saldoSalario).toBeGreaterThan(0);

      // JUSTA_CAUSA: no aviso, no 13º, no férias proporcionais, no multa FGTS
      expect(breakdown.avisoIndenizado).toBe(0);
      expect(breakdown.decimoTerceiroProp).toBe(0);
      expect(breakdown.feriasProporcional).toBe(0);
      expect(breakdown.feriasProporcionalTerco).toBe(0);
      expect(breakdown.multaFgts).toBe(0);
      expect(breakdown.outrosDescontos).toBe(0);
    });

    it('should still include férias vencidas if employee has accrued periods', async () => {
      const baseSalary = 5000;
      const hireDate = new Date('2021-01-01');
      const terminationDate = new Date('2025-06-15');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.JUSTA_CAUSA,
        terminationDate,
        noticeType: NoticeType.TRABALHADO,
        noticeDays: 30,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
      });

      // 4+ years -> at least some vencidas
      expect(breakdown.feriasVencidas).toBeGreaterThan(0);
    });
  });

  // ─── PEDIDO_DEMISSAO ─────────────────────────────────────────────────

  describe('PEDIDO_DEMISSAO', () => {
    it('should apply aviso prévio deduction when notice is INDENIZADO', async () => {
      const baseSalary = 4000;
      const hireDate = new Date('2023-01-01');
      const terminationDate = new Date('2025-03-10');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const noticeDays = 36;
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.PEDIDO_DEMISSAO,
        terminationDate,
        noticeType: NoticeType.INDENIZADO,
        noticeDays,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
        totalFgtsBalance: 8000,
      });

      // PEDIDO_DEMISSAO: no aviso indenizado, no multa FGTS
      expect(breakdown.avisoIndenizado).toBe(0);
      expect(breakdown.multaFgts).toBe(0);

      // outrosDescontos = aviso prévio não cumprido
      expect(breakdown.outrosDescontos).toBe(
        round((baseSalary / 30) * noticeDays),
      );

      // 13º proporcional should be present
      expect(breakdown.decimoTerceiroProp).toBeGreaterThan(0);
    });

    it('should not apply aviso deduction when notice is TRABALHADO', async () => {
      const baseSalary = 4000;
      const hireDate = new Date('2023-01-01');
      const terminationDate = new Date('2025-03-10');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.PEDIDO_DEMISSAO,
        terminationDate,
        noticeType: NoticeType.TRABALHADO,
        noticeDays: 36,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
      });

      expect(breakdown.outrosDescontos).toBe(0);
    });
  });

  // ─── ACORDO_MUTUO ────────────────────────────────────────────────────

  describe('ACORDO_MUTUO', () => {
    it('should apply 50% aviso prévio and 20% multa FGTS', async () => {
      const baseSalary = 8000;
      const hireDate = new Date('2020-01-01');
      const terminationDate = new Date('2025-03-15');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const noticeDays = 45;
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.ACORDO_MUTUO,
        terminationDate,
        noticeDays,
      });

      const fgtsBalance = 20000;

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
        totalFgtsBalance: fgtsBalance,
      });

      // Aviso prévio: 50% of full value
      expect(breakdown.avisoIndenizado).toBe(
        round((baseSalary / 30) * noticeDays * 0.5),
      );

      // Multa FGTS: 20%
      expect(breakdown.multaFgts).toBe(round(fgtsBalance * 0.2));

      // 13º proporcional should still be present
      expect(breakdown.decimoTerceiroProp).toBeGreaterThan(0);
    });
  });

  // ─── FALECIMENTO ─────────────────────────────────────────────────────

  describe('FALECIMENTO', () => {
    it('should have no aviso prévio and no multa FGTS', async () => {
      const baseSalary = 5000;
      const hireDate = new Date('2021-06-01');
      const terminationDate = new Date('2025-03-10');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.FALECIMENTO,
        terminationDate,
        noticeType: NoticeType.DISPENSADO,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
        totalFgtsBalance: 12000,
      });

      expect(breakdown.avisoIndenizado).toBe(0);
      expect(breakdown.multaFgts).toBe(0);

      // 13º proporcional and férias should be present (heirs receive)
      expect(breakdown.decimoTerceiroProp).toBeGreaterThan(0);
      expect(breakdown.saldoSalario).toBeGreaterThan(0);
    });
  });

  // ─── RESCISAO_INDIRETA ───────────────────────────────────────────────

  describe('RESCISAO_INDIRETA', () => {
    it('should calculate same as SEM_JUSTA_CAUSA (full aviso + 40% FGTS)', async () => {
      const baseSalary = 7000;
      const hireDate = new Date('2021-01-01');
      const terminationDate = new Date('2025-03-20');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const noticeDays = 42;
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.RESCISAO_INDIRETA,
        terminationDate,
        noticeDays,
      });

      const fgtsBalance = 18000;

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
        totalFgtsBalance: fgtsBalance,
      });

      // Full aviso prévio
      expect(breakdown.avisoIndenizado).toBe(
        round((baseSalary / 30) * noticeDays),
      );

      // 40% FGTS
      expect(breakdown.multaFgts).toBe(round(fgtsBalance * 0.4));
    });
  });

  // ─── CONTRATO_TEMPORARIO ─────────────────────────────────────────────

  describe('CONTRATO_TEMPORARIO', () => {
    it('should have no aviso prévio and no multa FGTS', async () => {
      const baseSalary = 3000;
      const hireDate = new Date('2024-10-01');
      const terminationDate = new Date('2025-03-31');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.CONTRATO_TEMPORARIO,
        terminationDate,
        noticeType: NoticeType.DISPENSADO,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
        totalFgtsBalance: 5000,
      });

      expect(breakdown.avisoIndenizado).toBe(0);
      expect(breakdown.multaFgts).toBe(0);
      // 13º proporcional should be present
      expect(breakdown.decimoTerceiroProp).toBeGreaterThan(0);
    });
  });

  // ─── INSS Progressive Brackets ───────────────────────────────────────

  describe('INSS Calculation', () => {
    it('should apply progressive INSS brackets correctly', async () => {
      const baseSalary = 3000;
      const hireDate = new Date('2024-06-01');
      const terminationDate = new Date('2025-01-30');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate,
        noticeType: NoticeType.TRABALHADO,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
      });

      // INSS should be > 0 and reasonable
      expect(breakdown.inssRescisao).toBeGreaterThan(0);
      // INSS should not exceed the max contribution
      expect(breakdown.inssRescisao).toBeLessThanOrEqual(951.63);
    });
  });

  // ─── IRRF Calculation ────────────────────────────────────────────────

  describe('IRRF Calculation', () => {
    it('should be zero when taxable base is below exempt limit', async () => {
      const baseSalary = 1500;
      const hireDate = new Date('2025-01-01');
      const terminationDate = new Date('2025-01-15');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.JUSTA_CAUSA,
        terminationDate,
        noticeType: NoticeType.TRABALHADO,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
      });

      // Low salary JUSTA_CAUSA: only saldo salário = (1500/30)*15 = 750
      expect(breakdown.irrfRescisao).toBe(0);
    });

    it('should apply IRRF when taxable base exceeds exempt limit', async () => {
      const baseSalary = 15000;
      const hireDate = new Date('2020-01-01');
      const terminationDate = new Date('2025-03-28');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate,
        noticeDays: 45,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
        totalFgtsBalance: 30000,
      });

      // High salary employee: IRRF should be applied
      expect(breakdown.irrfRescisao).toBeGreaterThan(0);
    });
  });

  // ─── Status Transition ───────────────────────────────────────────────

  describe('Status Transition', () => {
    it('should transition termination from PENDING to CALCULATED', async () => {
      const employee = await seedEmployee({
        hireDate: new Date('2023-01-01'),
        baseSalary: 5000,
      });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate: new Date('2025-03-15'),
        noticeDays: 36,
      });

      expect(termination.isPending()).toBe(true);

      const { termination: updatedTermination } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
      });

      expect(updatedTermination.isCalculated()).toBe(true);
      expect(updatedTermination.status).toBe(TerminationStatus.CALCULATED);
    });

    it('should throw if termination is not PENDING', async () => {
      const employee = await seedEmployee({
        hireDate: new Date('2023-01-01'),
        baseSalary: 5000,
      });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate: new Date('2025-03-15'),
        noticeDays: 36,
        status: TerminationStatus.CALCULATED,
      });

      await expect(
        sut.execute({
          tenantId,
          terminationId: termination.id.toString(),
        }),
      ).rejects.toThrow('Somente rescisões pendentes podem ser calculadas');
    });
  });

  // ─── Edge Cases ──────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('should throw if termination not found', async () => {
      await expect(
        sut.execute({
          tenantId,
          terminationId: new UniqueEntityID().toString(),
        }),
      ).rejects.toThrow('Rescisão não encontrada');
    });

    it('should throw if employee not found', async () => {
      const orphanTermination = seedTermination({
        employeeId: new UniqueEntityID(),
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate: new Date('2025-03-15'),
      });

      await expect(
        sut.execute({
          tenantId,
          terminationId: orphanTermination.id.toString(),
        }),
      ).rejects.toThrow('Funcionário não encontrado');
    });

    it('should default totalFgtsBalance to 0 when not provided', async () => {
      const employee = await seedEmployee({
        hireDate: new Date('2023-01-01'),
        baseSalary: 5000,
      });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate: new Date('2025-03-15'),
        noticeDays: 36,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
      });

      // 40% of 0 = 0
      expect(breakdown.multaFgts).toBe(0);
    });

    it('should handle employee with zero baseSalary', async () => {
      const employee = await seedEmployee({
        hireDate: new Date('2024-01-01'),
        baseSalary: 0,
      });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate: new Date('2025-03-15'),
        noticeDays: 33,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
      });

      expect(breakdown.saldoSalario).toBe(0);
      expect(breakdown.avisoIndenizado).toBe(0);
      expect(breakdown.totalBruto).toBe(0);
    });

    it('should persist calculated values in the termination entity', async () => {
      const employee = await seedEmployee({
        hireDate: new Date('2022-01-01'),
        baseSalary: 6000,
      });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate: new Date('2025-03-15'),
        noticeDays: 39,
      });

      const { termination: calculatedTermination, breakdown } =
        await sut.execute({
          tenantId,
          terminationId: termination.id.toString(),
          totalFgtsBalance: 10000,
        });

      // Verify all breakdown values are stored on the entity
      expect(calculatedTermination.saldoSalario).toBe(breakdown.saldoSalario);
      expect(calculatedTermination.avisoIndenizado).toBe(
        breakdown.avisoIndenizado,
      );
      expect(calculatedTermination.decimoTerceiroProp).toBe(
        breakdown.decimoTerceiroProp,
      );
      expect(calculatedTermination.totalBruto).toBe(breakdown.totalBruto);
      expect(calculatedTermination.totalLiquido).toBe(breakdown.totalLiquido);
    });
  });

  // ─── 13º Proporcional Calculation Details ─────────────────────────────

  describe('13º Proporcional (decimoTerceiroProp)', () => {
    it('should count only months with 15+ days worked', async () => {
      const baseSalary = 6000;
      // Hired Jan 10, terminated Mar 10
      // Jan: started on 10th (<=15), counts
      // Feb: full month, counts
      // Mar: 10 days (<15), does NOT count
      // Total: 2 months
      const employee = await seedEmployee({
        hireDate: new Date('2025-01-10'),
        baseSalary,
      });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate: new Date('2025-03-10'),
        noticeType: NoticeType.TRABALHADO,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
      });

      // 2 months of 13º: (6000/12) * 2 = 1000
      expect(breakdown.decimoTerceiroProp).toBe(round((baseSalary / 12) * 2));
    });
  });
});
