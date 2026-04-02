import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { getINSSTable, getIRRFTable } from '@/constants/hr/tax-tables';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Termination } from '@/entities/hr/termination';
import { TerminationType } from '@/entities/hr/termination';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { TerminationsRepository } from '@/repositories/hr/terminations-repository';

export interface CalculateTerminationPaymentRequest {
  tenantId: string;
  terminationId: string;
  /** Total FGTS balance for the employee (provided by the caller) */
  totalFgtsBalance?: number;
}

export interface TerminationPaymentBreakdown {
  // Verbas
  saldoSalario: number;
  avisoIndenizado: number;
  decimoTerceiroProp: number;
  feriasVencidas: number;
  feriasVencidasTerco: number;
  feriasProporcional: number;
  feriasProporcionalTerco: number;
  multaFgts: number;
  // Descontos
  inssRescisao: number;
  irrfRescisao: number;
  outrosDescontos: number;
  // Totais
  totalBruto: number;
  totalDescontos: number;
  totalLiquido: number;
}

export interface CalculateTerminationPaymentResponse {
  termination: Termination;
  breakdown: TerminationPaymentBreakdown;
}

export class CalculateTerminationPaymentUseCase {
  constructor(
    private terminationsRepository: TerminationsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: CalculateTerminationPaymentRequest,
  ): Promise<CalculateTerminationPaymentResponse> {
    const { tenantId, terminationId, totalFgtsBalance = 0 } = request;

    // Find termination
    const termination = await this.terminationsRepository.findById(
      new UniqueEntityID(terminationId),
      tenantId,
    );

    if (!termination) {
      throw new ResourceNotFoundError('Rescisão não encontrada');
    }

    if (!termination.isPending()) {
      throw new BadRequestError(
        'Somente rescisões pendentes podem ser calculadas',
      );
    }

    // Find employee
    const employee = await this.employeesRepository.findById(
      termination.employeeId,
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    const baseSalary = employee.baseSalary ?? 0;
    const hireDate = employee.hireDate;
    const terminationDate = termination.terminationDate;
    const terminationType = termination.type;
    const noticeDays = termination.noticeDays;
    const year = terminationDate.getFullYear();

    // 1. Saldo de salário: (baseSalary / 30) × days worked in final month
    const daysWorkedInFinalMonth = terminationDate.getDate();
    const saldoSalario = round((baseSalary / 30) * daysWorkedInFinalMonth);

    // 2. Aviso prévio indenizado
    let avisoIndenizado = 0;
    if (
      termination.noticeType === 'INDENIZADO' ||
      termination.noticeType === 'DISPENSADO'
    ) {
      if (terminationType === TerminationType.SEM_JUSTA_CAUSA) {
        avisoIndenizado = round((baseSalary / 30) * noticeDays);
      } else if (terminationType === TerminationType.ACORDO_MUTUO) {
        avisoIndenizado = round((baseSalary / 30) * noticeDays * 0.5);
      } else if (terminationType === TerminationType.RESCISAO_INDIRETA) {
        avisoIndenizado = round((baseSalary / 30) * noticeDays);
      }
      // JUSTA_CAUSA, PEDIDO_DEMISSAO, FALECIMENTO, CONTRATO_TEMPORARIO: 0
    }

    // 3. 13º proporcional: (baseSalary / 12) × months worked this year
    let decimoTerceiroProp = 0;
    if (terminationType !== TerminationType.JUSTA_CAUSA) {
      const monthsWorkedThisYear = this.calculateMonthsWorkedThisYear(
        hireDate,
        terminationDate,
      );
      decimoTerceiroProp = round((baseSalary / 12) * monthsWorkedThisYear);
    }

    // 4. Férias vencidas + 1/3
    const { vencidas, proporcionais } = this.calculateVacationMonths(
      hireDate,
      terminationDate,
    );

    let feriasVencidas = 0;
    let feriasVencidasTerco = 0;
    if (vencidas > 0) {
      feriasVencidas = round(baseSalary * vencidas);
      feriasVencidasTerco = round(feriasVencidas / 3);
    }

    // 5. Férias proporcionais + 1/3
    let feriasProporcional = 0;
    let feriasProporcionalTerco = 0;
    if (terminationType !== TerminationType.JUSTA_CAUSA && proporcionais > 0) {
      feriasProporcional = round((baseSalary * proporcionais) / 12);
      feriasProporcionalTerco = round(feriasProporcional / 3);
    }

    // 6. Multa FGTS
    let multaFgts = 0;
    if (
      terminationType === TerminationType.SEM_JUSTA_CAUSA ||
      terminationType === TerminationType.RESCISAO_INDIRETA
    ) {
      multaFgts = round(totalFgtsBalance * 0.4);
    } else if (terminationType === TerminationType.ACORDO_MUTUO) {
      multaFgts = round(totalFgtsBalance * 0.2);
    }
    // JUSTA_CAUSA, PEDIDO_DEMISSAO, CONTRATO_TEMPORARIO, FALECIMENTO: 0

    // 7. Total bruto
    const totalBruto = round(
      saldoSalario +
        avisoIndenizado +
        decimoTerceiroProp +
        feriasVencidas +
        feriasVencidasTerco +
        feriasProporcional +
        feriasProporcionalTerco +
        multaFgts,
    );

    // 8. Descontos: INSS e IRRF sobre verbas rescisórias
    const inssRescisao = this.calculateINSS(totalBruto, year);

    const irrfBase = totalBruto - inssRescisao;
    const irrfRescisao = this.calculateIRRF(irrfBase, year);

    // Desconto de aviso prévio não cumprido (employee quit without notice)
    let outrosDescontos = 0;
    if (
      terminationType === TerminationType.PEDIDO_DEMISSAO &&
      termination.noticeType === 'INDENIZADO'
    ) {
      // Employee must indemnify the employer
      outrosDescontos = round((baseSalary / 30) * noticeDays);
    }

    const totalDescontos = round(inssRescisao + irrfRescisao + outrosDescontos);
    const totalLiquido = round(totalBruto - totalDescontos);

    const breakdown: TerminationPaymentBreakdown = {
      saldoSalario,
      avisoIndenizado,
      decimoTerceiroProp,
      feriasVencidas,
      feriasVencidasTerco,
      feriasProporcional,
      feriasProporcionalTerco,
      multaFgts,
      inssRescisao,
      irrfRescisao,
      outrosDescontos,
      totalBruto,
      totalDescontos,
      totalLiquido,
    };

    // Mark termination as calculated with all values
    termination.markAsCalculated(breakdown);

    // Persist
    await this.terminationsRepository.save(termination);

    return { termination, breakdown };
  }

  /**
   * Calculate the number of months worked in the current year for 13th salary
   * A month with 15+ days worked counts as a full month
   */
  private calculateMonthsWorkedThisYear(
    hireDate: Date,
    terminationDate: Date,
  ): number {
    const year = terminationDate.getFullYear();
    const startOfYear = new Date(year, 0, 1);

    // If hired this year, start from hire date
    const effectiveStart =
      hireDate.getFullYear() === year ? hireDate : startOfYear;

    const startMonth = effectiveStart.getMonth();
    const endMonth = terminationDate.getMonth();

    let months = 0;

    for (let m = startMonth; m <= endMonth; m++) {
      if (m === startMonth && effectiveStart.getDate() > 15) {
        // Started after the 15th — doesn't count
        continue;
      }
      if (m === endMonth && terminationDate.getDate() < 15) {
        // Worked less than 15 days in last month — doesn't count
        continue;
      }
      months++;
    }

    return months;
  }

  /**
   * Calculate vacation periods: expired (vencidas) and proportional
   * Returns number of full vacation periods expired and proportional months (1-12)
   */
  private calculateVacationMonths(
    hireDate: Date,
    terminationDate: Date,
  ): { vencidas: number; proporcionais: number } {
    const totalMonths =
      (terminationDate.getFullYear() - hireDate.getFullYear()) * 12 +
      (terminationDate.getMonth() - hireDate.getMonth());

    // Each 12-month period earns one vacation
    // After 12 months of the acquisitive period, it becomes "vencida" if not taken
    const completeYears = Math.floor(totalMonths / 12);

    // Vencidas: complete years minus 1 (the first year earns but the "concessivo" period
    // starts after; simplified — count periods that have expired)
    // Simplified: if >12 months worked, at least 1 vacation period expired
    const vencidas = Math.max(0, completeYears - 1);

    // Proporcional: months in the current acquisitive period
    const proporcionais = totalMonths % 12;

    return { vencidas, proporcionais };
  }

  private calculateINSS(grossSalary: number, year: number): number {
    const table = getINSSTable(year);

    let inss = 0;
    let remainingSalary = grossSalary;
    let previousLimit = 0;

    for (const bracket of table.brackets) {
      if (remainingSalary <= 0) break;

      const bracketRange = bracket.limit - previousLimit;
      const taxableInBracket = Math.min(remainingSalary, bracketRange);

      inss += taxableInBracket * bracket.rate;
      remainingSalary -= taxableInBracket;
      previousLimit = bracket.limit;
    }

    return round(Math.min(inss, table.maxContribution));
  }

  private calculateIRRF(taxableBase: number, year: number): number {
    const table = getIRRFTable(year);

    if (taxableBase <= table.exemptLimit) return 0;

    for (const bracket of table.brackets) {
      if (taxableBase <= bracket.limit) {
        const irrf = taxableBase * bracket.rate - bracket.deduction;
        return round(Math.max(0, irrf));
      }
    }

    return 0;
  }
}

/** Round to 2 decimal places */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}
