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
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTerminationsRepository } from '@/repositories/hr/in-memory/in-memory-terminations-repository';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { generateValidCPF } from '@/utils/tests/factories/hr/make-employee';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalculateTerminationPaymentUseCase } from './calculate-termination-payment';

let terminationsRepository: InMemoryTerminationsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let absencesRepository: InMemoryAbsencesRepository;
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
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    absencesRepository = new InMemoryAbsencesRepository();
    sut = new CalculateTerminationPaymentUseCase(
      terminationsRepository,
      employeesRepository,
      vacationPeriodsRepository,
      absencesRepository,
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

      expect(breakdown.saldoSalario).toBeGreaterThan(0);
      expect(breakdown.avisoIndenizado).toBe(round((baseSalary / 30) * 39));
      expect(breakdown.decimoTerceiroProp).toBeGreaterThan(0);
      expect(breakdown.multaFgts).toBe(round(fgtsBalance * 0.4));

      // INSS is computed — at minimum on saldoSalario and 13º proporcional.
      expect(breakdown.inssRescisao).toBeGreaterThan(0);

      expect(breakdown.outrosDescontos).toBe(0);

      expect(breakdown.totalBruto).toBeGreaterThan(0);
      expect(breakdown.totalLiquido).toBe(
        round(breakdown.totalBruto - breakdown.totalDescontos),
      );
    });

    it('should include férias vencidas for employee with 2+ years (fallback heuristic)', async () => {
      // No VacationPeriod rows seeded — use-case falls back to hire-date heuristic.
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

      // Force fallback: wire a use case without the vacation repository.
      const fallbackSut = new CalculateTerminationPaymentUseCase(
        terminationsRepository,
        employeesRepository,
      );

      const { breakdown } = await fallbackSut.execute({
        tenantId,
        terminationId: termination.id.toString(),
      });

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

      expect(breakdown.saldoSalario).toBeGreaterThan(0);

      expect(breakdown.avisoIndenizado).toBe(0);
      expect(breakdown.decimoTerceiroProp).toBe(0);
      expect(breakdown.feriasProporcional).toBe(0);
      expect(breakdown.feriasProporcionalTerco).toBe(0);
      expect(breakdown.multaFgts).toBe(0);
      expect(breakdown.outrosDescontos).toBe(0);
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

      expect(breakdown.avisoIndenizado).toBe(0);
      expect(breakdown.multaFgts).toBe(0);

      expect(breakdown.outrosDescontos).toBe(
        round((baseSalary / 30) * noticeDays),
      );
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

      expect(breakdown.avisoIndenizado).toBe(
        round((baseSalary / 30) * noticeDays * 0.5),
      );
      expect(breakdown.multaFgts).toBe(round(fgtsBalance * 0.2));
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

      expect(breakdown.avisoIndenizado).toBe(
        round((baseSalary / 30) * noticeDays),
      );
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
      expect(breakdown.decimoTerceiroProp).toBeGreaterThan(0);
    });
  });

  // ─── INSS/IRRF Sanity ────────────────────────────────────────────────

  describe('INSS Calculation', () => {
    it('should cap INSS at the annual ceiling', async () => {
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

      expect(breakdown.inssRescisao).toBeGreaterThan(0);
      // INSS regular + INSS 13º, each capped at 951.63 (2025 ceiling).
      expect(breakdown.taxBreakdown.inssRegular).toBeLessThanOrEqual(951.63);
      expect(breakdown.taxBreakdown.inss13th).toBeLessThanOrEqual(951.63);
    });
  });

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

      // Jan: started on 10th (<=15), counts; Feb: full, counts; Mar: 10 days (<15), drops.
      expect(breakdown.decimoTerceiroProp).toBe(round((baseSalary / 12) * 2));
    });
  });

  // ─── VacationPeriod integration (Art. 146 CLT) ───────────────────────

  describe('Férias vencidas with multiple VacationPeriods', () => {
    it('should sum remainingDays from all closed acquisition periods', async () => {
      const baseSalary = 3000;
      const hireDate = new Date('2021-01-01');
      const terminationDate = new Date('2025-03-15');

      const employee = await seedEmployee({ hireDate, baseSalary });

      // Período 1: totalmente fechado, 10 dias ainda não gozados.
      await vacationPeriodsRepository.create({
        tenantId,
        employeeId: employee.id,
        acquisitionStart: new Date('2021-01-01'),
        acquisitionEnd: new Date('2021-12-31'),
        concessionStart: new Date('2022-01-01'),
        concessionEnd: new Date('2022-12-31'),
        totalDays: 30,
        usedDays: 20,
        soldDays: 0,
        remainingDays: 10,
        status: 'AVAILABLE',
      });

      // Período 2: fechado, 15 dias não gozados.
      await vacationPeriodsRepository.create({
        tenantId,
        employeeId: employee.id,
        acquisitionStart: new Date('2022-01-01'),
        acquisitionEnd: new Date('2022-12-31'),
        concessionStart: new Date('2023-01-01'),
        concessionEnd: new Date('2023-12-31'),
        totalDays: 30,
        usedDays: 15,
        soldDays: 0,
        remainingDays: 15,
        status: 'AVAILABLE',
      });

      // Período 3: aberto em 2025 (ainda não fechou até a terminationDate).
      await vacationPeriodsRepository.create({
        tenantId,
        employeeId: employee.id,
        acquisitionStart: new Date('2025-01-01'),
        acquisitionEnd: new Date('2025-12-31'),
        concessionStart: new Date('2026-01-01'),
        concessionEnd: new Date('2026-12-31'),
        totalDays: 30,
        usedDays: 0,
        soldDays: 0,
        remainingDays: 30,
        status: 'PENDING',
      });

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

      // 10 + 15 = 25 days of férias vencidas, valued at (baseSalary/30) * days.
      expect(breakdown.vacationRules.vencidasDays).toBe(25);
      expect(breakdown.feriasVencidas).toBe(round((baseSalary / 30) * 25));
      expect(breakdown.feriasVencidasTerco).toBe(
        round(breakdown.feriasVencidas / 3),
      );
    });

    it('should not count vacation periods with zero remaining days', async () => {
      const baseSalary = 4000;
      const hireDate = new Date('2022-01-01');
      const terminationDate = new Date('2025-06-15');

      const employee = await seedEmployee({ hireDate, baseSalary });

      await vacationPeriodsRepository.create({
        tenantId,
        employeeId: employee.id,
        acquisitionStart: new Date('2022-01-01'),
        acquisitionEnd: new Date('2022-12-31'),
        concessionStart: new Date('2023-01-01'),
        concessionEnd: new Date('2023-12-31'),
        totalDays: 30,
        usedDays: 30,
        soldDays: 0,
        remainingDays: 0,
        status: 'COMPLETED',
      });

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

      expect(breakdown.vacationRules.vencidasDays).toBe(0);
      expect(breakdown.feriasVencidas).toBe(0);
      expect(breakdown.feriasVencidasTerco).toBe(0);
    });
  });

  // ─── Art. 130 CLT — Faltas injustificadas ────────────────────────────

  describe('Férias proporcionais with unjustified absences (Art. 130 CLT)', () => {
    it('should reduce proportional vacation days to 18 when employee has 16 unjustified absences', async () => {
      const baseSalary = 3000;
      // Open acquisition window of 11 months (hire Mar 1 → term Feb 15).
      // Using `new Date(year, month, day)` to avoid UTC parsing shifting months.
      const hireDate = new Date(2024, 2, 1);
      const terminationDate = new Date(2025, 1, 15);

      const employee = await seedEmployee({ hireDate, baseSalary });

      // 16 unjustified absence days inside the open acquisition window.
      const absence = await absencesRepository.create({
        tenantId,
        employeeId: employee.id,
        type: 'UNPAID_LEAVE',
        startDate: new Date(2024, 4, 1),
        endDate: new Date(2024, 4, 16),
        totalDays: 16,
        isPaid: false,
      });
      absence.approve(new UniqueEntityID());

      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate,
        noticeDays: 30,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
      });

      // 16 faltas → cap de 18 dias de férias (tabela Art. 130).
      // Janela: mar/24, abr/24, mai/24, jun/24, jul/24, ago/24, set/24, out/24,
      // nov/24, dez/24, jan/25, fev/25(15 dias) → 12 meses qualificados.
      // (18 / 12) * 12 = 18 dias inteiros.
      expect(breakdown.vacationRules.unjustifiedAbsences).toBe(16);
      expect(breakdown.vacationRules.proporcionaisMonths).toBe(12);
      expect(breakdown.vacationRules.proporcionaisDays).toBe(18);
      expect(breakdown.feriasProporcional).toBe(round((baseSalary / 30) * 18));
      expect(breakdown.feriasProporcionalTerco).toBe(
        round(breakdown.feriasProporcional / 3),
      );
    });

    it('should grant full cap proportionally when there are no unjustified absences', async () => {
      const baseSalary = 3000;
      const hireDate = new Date(2024, 2, 1);
      const terminationDate = new Date(2025, 1, 15);

      const employee = await seedEmployee({ hireDate, baseSalary });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate,
        noticeDays: 30,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
      });

      expect(breakdown.vacationRules.unjustifiedAbsences).toBe(0);
      // 12 meses qualificados × cap 30 / 12 = 30 dias.
      expect(breakdown.vacationRules.proporcionaisMonths).toBe(12);
      expect(breakdown.vacationRules.proporcionaisDays).toBe(30);
    });
  });

  // ─── Art. 132 CLT — 15+ dias no mês ─────────────────────────────────

  describe('Art. 132 CLT (mês sem 15+ dias não conta)', () => {
    it('should drop months where the employee worked fewer than 15 days', async () => {
      const baseSalary = 6000;
      // Hire date = 2024-01-20 → Jan 2024 has only 12 days in the window
      //   (20..31), which is < 15, so January must NOT count.
      // Acquisition window: 2024-01-20 → 2025-01-19.
      const hireDate = new Date('2024-01-20');
      const terminationDate = new Date('2024-03-25');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate,
        noticeDays: 30,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
      });

      // Eligible months inside the acquisition window up to terminationDate:
      //   Jan 2024 (20..31 = 12 days, dropped)
      //   Feb 2024 (full, counts)
      //   Mar 2024 (01..25 = 25 days, counts)
      //   → 2 months.
      expect(breakdown.vacationRules.proporcionaisMonths).toBe(2);
    });
  });

  // ─── Isenções fiscais (Súmula 215 + Lei 8.212/91) ────────────────────

  describe('IRRF/INSS exemptions (Súmula 215 + Lei 8.212/91 Art. 28 §9º)', () => {
    it('should NOT include aviso prévio indenizado in IRRF nor INSS base', async () => {
      const baseSalary = 15000;
      const hireDate = new Date('2020-01-01');
      const terminationDate = new Date('2025-03-28');

      const employee = await seedEmployee({ hireDate, baseSalary });
      const termination = seedTermination({
        employeeId: employee.id,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate,
        noticeDays: 45,
        noticeType: NoticeType.INDENIZADO,
      });

      const { breakdown } = await sut.execute({
        tenantId,
        terminationId: termination.id.toString(),
        totalFgtsBalance: 30000,
      });

      // Aviso indenizado exists in payload.
      expect(breakdown.avisoIndenizado).toBeGreaterThan(0);

      // …but it was routed into the exempt bucket (Súmula 215 STF).
      expect(breakdown.taxBreakdown.exemptEarnings).toBeGreaterThanOrEqual(
        breakdown.avisoIndenizado,
      );

      // Taxable base = saldo salário - INSS regular (NÃO inclui aviso).
      const expectedTaxableBase = round(
        Math.max(
          0,
          breakdown.saldoSalario - breakdown.taxBreakdown.inssRegular,
        ),
      );
      expect(breakdown.taxBreakdown.taxableBase).toBe(expectedTaxableBase);
    });

    it('should treat férias vencidas + 1/3 and férias proporcionais + 1/3 as exempt', async () => {
      const baseSalary = 10000;
      const hireDate = new Date('2022-01-01');
      const terminationDate = new Date('2025-06-30');

      const employee = await seedEmployee({ hireDate, baseSalary });

      await vacationPeriodsRepository.create({
        tenantId,
        employeeId: employee.id,
        acquisitionStart: new Date('2022-01-01'),
        acquisitionEnd: new Date('2022-12-31'),
        concessionStart: new Date('2023-01-01'),
        concessionEnd: new Date('2023-12-31'),
        totalDays: 30,
        usedDays: 0,
        soldDays: 0,
        remainingDays: 30,
        status: 'AVAILABLE',
      });

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

      const feriasTotal =
        breakdown.feriasVencidas +
        breakdown.feriasVencidasTerco +
        breakdown.feriasProporcional +
        breakdown.feriasProporcionalTerco;

      // All férias + 1/3 contribute to the exempt bucket along with aviso
      // indenizado. (exempt >= férias + 1/3 is a safe lower bound.)
      expect(breakdown.taxBreakdown.exemptEarnings).toBeGreaterThanOrEqual(
        round(feriasTotal),
      );
    });

    it('should tax 13º proporcional with its own INSS + IRRF (separate base)', async () => {
      const baseSalary = 12000;
      const hireDate = new Date('2020-01-01');
      const terminationDate = new Date('2025-06-30');

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
      });

      expect(breakdown.decimoTerceiroProp).toBeGreaterThan(0);

      // INSS do 13º é calculado em separado (>0 para salário alto).
      expect(breakdown.taxBreakdown.inss13th).toBeGreaterThan(0);

      // Base do IRRF do 13º = 13º - INSS 13º (calculada isoladamente).
      const expectedThirteenthBase = round(
        Math.max(
          0,
          breakdown.decimoTerceiroProp - breakdown.taxBreakdown.inss13th,
        ),
      );
      expect(breakdown.taxBreakdown.thirteenthTaxableBase).toBe(
        expectedThirteenthBase,
      );

      // IRRF total = IRRF regular + IRRF do 13º.
      expect(breakdown.irrfRescisao).toBe(
        round(
          breakdown.taxBreakdown.irrfRegular + breakdown.taxBreakdown.irrf13th,
        ),
      );
    });
  });
});
