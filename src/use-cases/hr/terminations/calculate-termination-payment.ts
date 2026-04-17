import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { getINSSTable, getIRRFTable } from '@/constants/hr/tax-tables';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Termination } from '@/entities/hr/termination';
import { TerminationType } from '@/entities/hr/termination';
import { AbsencesRepository } from '@/repositories/hr/absences-repository';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { TerminationsRepository } from '@/repositories/hr/terminations-repository';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';
import { calculateVacationDays } from '@/use-cases/hr/vacation-periods/calculate-vacation-days';

/**
 * Request shape for calculating TRCT (Termo de Rescisão de Contrato de Trabalho).
 */
export interface CalculateTerminationPaymentRequest {
  tenantId: string;
  terminationId: string;
  /** Total FGTS balance for the employee (provided by the caller) */
  totalFgtsBalance?: number;
}

/**
 * Breakdown of the TRCT (Termo de Rescisão de Contrato de Trabalho).
 *
 * Verbas are split so callers (holerite rescisório, eSocial S-2299, TRCT PDF)
 * can distinguish what is taxable from what is exempt, in accordance with
 * Brazilian tax/labour law:
 *
 *  - Aviso prévio indenizado: isento de INSS e IRRF (Súmula 215 STF,
 *    Lei 8.212/91 Art. 28 §9º 'e', item 5; IN RFB 1.500/14 Art. 5º).
 *  - Férias indenizadas (vencidas + proporcionais) + 1/3 constitucional:
 *    isentas de INSS (Lei 8.212/91 Art. 28 §9º 'd' e 'e') e isentas de IRRF
 *    quando pagas na rescisão (RE 855.091 / Súmula 386 STJ).
 *  - 13º proporcional: integra base própria de INSS e IRRF, calculados
 *    separadamente das demais verbas tributáveis (Lei 8.212/91 Art. 28 §7º;
 *    IN RFB 1.500/14 Art. 13).
 *  - Saldo de salário e "outros descontos" seguem a regra normal da folha.
 */
export interface TerminationPaymentBreakdown {
  // Verbas (earnings)
  saldoSalario: number;
  avisoIndenizado: number;
  decimoTerceiroProp: number;
  feriasVencidas: number;
  feriasVencidasTerco: number;
  feriasProporcional: number;
  feriasProporcionalTerco: number;
  multaFgts: number;

  // Descontos (deductions)
  inssRescisao: number;
  irrfRescisao: number;
  outrosDescontos: number;

  // Totais
  totalBruto: number;
  totalDescontos: number;
  totalLiquido: number;

  // Detalhamento fiscal (por regime tributário — não persistido no Termination,
  // usado pelo holerite rescisório/TRCT para explicar a memória de cálculo).
  taxBreakdown: {
    /** INSS mensal sobre verbas tributáveis (saldo salário + outras verbas tributáveis). */
    inssRegular: number;
    /** INSS exclusivo sobre o 13º proporcional. */
    inss13th: number;
    /** Base tributável pela tabela mensal (já descontado o INSS regular). */
    taxableBase: number;
    /** IRRF sobre a base tributável mensal. */
    irrfRegular: number;
    /** Base do IRRF exclusivo do 13º (já descontado o INSS do 13º). */
    thirteenthTaxableBase: number;
    /** IRRF exclusivo sobre o 13º proporcional. */
    irrf13th: number;
    /** Verbas isentas de IRRF (aviso indenizado + férias + 1/3 vencidas e proporcionais). */
    exemptEarnings: number;
  };

  // Regras trabalhistas aplicadas (auditoria/holerite rescisório).
  vacationRules: {
    /** Total de férias vencidas provenientes de VacationPeriods com saldo. */
    vencidasDays: number;
    /** Dias proporcionais (após Art. 130 e Art. 132 CLT). */
    proporcionaisDays: number;
    /** Meses efetivamente contabilizados para proporcionais (Art. 132 CLT). */
    proporcionaisMonths: number;
    /** Faltas injustificadas que reduziram dias de férias (Art. 130 CLT). */
    unjustifiedAbsences: number;
  };
}

export interface CalculateTerminationPaymentResponse {
  termination: Termination;
  breakdown: TerminationPaymentBreakdown;
}

/**
 * Use case that materialises a termination's verbas rescisórias.
 *
 * Brazilian compliance anchors (CLT, Law 8.212/91, Súmula 215 STF):
 *  - Art. 130 CLT  — redução de dias de férias por faltas injustificadas.
 *  - Art. 132 CLT  — só se contabiliza o mês de férias proporcional se o
 *                     funcionário trabalhou 15+ dias naquele mês.
 *  - Art. 146 CLT  — férias vencidas pagas na rescisão.
 *  - Art. 477 CLT  — verbas rescisórias e prazo de 10 dias.
 *  - Art. 487 CLT  — aviso prévio.
 *  - Súmula 215 STF — férias indenizadas e aviso prévio indenizado isentos de IRRF.
 *  - Lei 8.212/91 Art. 28 §9º 'd', 'e' — isenção de INSS sobre aviso
 *                     indenizado e férias indenizadas.
 */
export class CalculateTerminationPaymentUseCase {
  constructor(
    private terminationsRepository: TerminationsRepository,
    private employeesRepository: EmployeesRepository,
    /**
     * When provided, real vacation balances are pulled from the VacationPeriod
     * table (with per-period `remainingDays`). Otherwise a best-effort
     * simplified algorithm is used (kept for backward compatibility with tests
     * that do not wire the vacation repository).
     */
    private vacationPeriodsRepository?: VacationPeriodsRepository,
    /**
     * When provided, unjustified absences inside the open acquisition period
     * are fetched so Art. 130 CLT (redução de dias de férias por faltas)
     * and Art. 132 CLT (15+ dias no mês) can be honoured.
     */
    private absencesRepository?: AbsencesRepository,
  ) {}

  async execute(
    request: CalculateTerminationPaymentRequest,
  ): Promise<CalculateTerminationPaymentResponse> {
    const { tenantId, terminationId, totalFgtsBalance = 0 } = request;

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
    const fiscalYear = terminationDate.getFullYear();
    const dailyRate = baseSalary / 30;

    // 1. Saldo de salário — (baseSalary / 30) × dias trabalhados no mês da rescisão.
    const daysWorkedInFinalMonth = terminationDate.getDate();
    const saldoSalario = round(dailyRate * daysWorkedInFinalMonth);

    // 2. Aviso prévio indenizado (CLT Art. 487).
    const avisoIndenizado = this.computeAvisoIndenizado(
      terminationType,
      termination.noticeType,
      dailyRate,
      noticeDays,
    );

    // 3. 13º proporcional (Lei 4.090/62 + Art. 132 CLT).
    const decimoTerceiroProp = this.computeThirteenthProportional(
      terminationType,
      baseSalary,
      hireDate,
      terminationDate,
    );

    // 4 + 5. Férias vencidas e proporcionais (CLT Art. 130, 132, 146).
    const vacationCalculation = await this.computeVacationPayments(
      terminationType,
      tenantId,
      termination.employeeId,
      hireDate,
      terminationDate,
      baseSalary,
    );
    const {
      feriasVencidas,
      feriasVencidasTerco,
      feriasProporcional,
      feriasProporcionalTerco,
      vencidasDays,
      proporcionaisDays,
      proporcionaisMonths,
      unjustifiedAbsences,
    } = vacationCalculation;

    // 6. Multa FGTS (Lei 8.036/90 Art. 18 §1º).
    const multaFgts = this.computeFgtsPenalty(
      terminationType,
      totalFgtsBalance,
    );

    // 7. Agrupamento fiscal — segrega tributáveis, 13º e isentas.
    //    Súmula 215 STF + Lei 8.212/91 Art. 28 §9º 'e'.
    const taxableEarnings = round(saldoSalario);
    const thirteenthEarnings = round(decimoTerceiroProp);
    const exemptEarnings = round(
      avisoIndenizado +
        feriasVencidas +
        feriasVencidasTerco +
        feriasProporcional +
        feriasProporcionalTerco,
    );

    // Total bruto = tributáveis + 13º + isentas + multa FGTS.
    // A multa FGTS vai ao bruto apenas para o trabalhador enxergar no TRCT,
    // mas é paga via conta vinculada (não entra em INSS/IRRF).
    const totalBruto = round(
      taxableEarnings + thirteenthEarnings + exemptEarnings + multaFgts,
    );

    // 8. INSS e IRRF — calculados POR GRUPO, nunca em base única.
    const inssRegular = this.calculateINSS(taxableEarnings, fiscalYear);
    const inss13th = this.calculateINSS(thirteenthEarnings, fiscalYear);

    const taxableBase = round(Math.max(0, taxableEarnings - inssRegular));
    const irrfRegular = this.calculateIRRF(taxableBase, fiscalYear);

    const thirteenthTaxableBase = round(
      Math.max(0, thirteenthEarnings - inss13th),
    );
    const irrf13th = this.calculateIRRF(thirteenthTaxableBase, fiscalYear);

    const inssRescisao = round(inssRegular + inss13th);
    const irrfRescisao = round(irrfRegular + irrf13th);

    // 9. Desconto de aviso prévio não cumprido (empregado pediu demissão e
    //    não cumpriu aviso — CLT Art. 487 §2º).
    let outrosDescontos = 0;
    if (
      terminationType === TerminationType.PEDIDO_DEMISSAO &&
      termination.noticeType === 'INDENIZADO'
    ) {
      outrosDescontos = round(dailyRate * noticeDays);
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
      taxBreakdown: {
        inssRegular,
        inss13th,
        taxableBase,
        irrfRegular,
        thirteenthTaxableBase,
        irrf13th,
        exemptEarnings,
      },
      vacationRules: {
        vencidasDays,
        proporcionaisDays,
        proporcionaisMonths,
        unjustifiedAbsences,
      },
    };

    // Persistência — `Termination.markAsCalculated` recebe apenas as colunas
    // do schema atual; o `taxBreakdown` e `vacationRules` ficam apenas na
    // resposta da API (consumidos pelo holerite rescisório).
    termination.markAsCalculated({
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
    });

    await this.terminationsRepository.save(termination);

    return { termination, breakdown };
  }

  // ─── Verbas individuais ────────────────────────────────────────────────

  private computeAvisoIndenizado(
    terminationType: TerminationType,
    noticeType: string,
    dailyRate: number,
    noticeDays: number,
  ): number {
    if (noticeType !== 'INDENIZADO' && noticeType !== 'DISPENSADO') {
      return 0;
    }

    switch (terminationType) {
      case TerminationType.SEM_JUSTA_CAUSA:
      case TerminationType.RESCISAO_INDIRETA:
        return round(dailyRate * noticeDays);
      case TerminationType.ACORDO_MUTUO:
        return round(dailyRate * noticeDays * 0.5);
      default:
        // JUSTA_CAUSA, PEDIDO_DEMISSAO, FALECIMENTO, CONTRATO_TEMPORARIO: 0
        return 0;
    }
  }

  private computeThirteenthProportional(
    terminationType: TerminationType,
    baseSalary: number,
    hireDate: Date,
    terminationDate: Date,
  ): number {
    if (terminationType === TerminationType.JUSTA_CAUSA) return 0;

    const monthsWorkedThisYear = this.calculateMonthsWorkedThisYear(
      hireDate,
      terminationDate,
    );

    return round((baseSalary / 12) * monthsWorkedThisYear);
  }

  private computeFgtsPenalty(
    terminationType: TerminationType,
    totalFgtsBalance: number,
  ): number {
    switch (terminationType) {
      case TerminationType.SEM_JUSTA_CAUSA:
      case TerminationType.RESCISAO_INDIRETA:
        return round(totalFgtsBalance * 0.4);
      case TerminationType.ACORDO_MUTUO:
        return round(totalFgtsBalance * 0.2);
      default:
        return 0;
    }
  }

  /**
   * Compute vacation payments honouring:
   *  - Art. 146 CLT: férias vencidas pagas na rescisão com acréscimo de 1/3.
   *  - Art. 130 CLT: dias de férias proporcionais reduzidos por faltas.
   *  - Art. 132 CLT: só conta o mês se houver 15+ dias trabalhados.
   *
   * When `vacationPeriodsRepository` is injected, real per-period balances
   * are respected — an employee can carry multiple `VacationPeriod` rows
   * with different `remainingDays` (e.g. férias fracionadas, abono
   * pecuniário parcial).
   */
  private async computeVacationPayments(
    terminationType: TerminationType,
    tenantId: string,
    employeeId: UniqueEntityID,
    hireDate: Date,
    terminationDate: Date,
    baseSalary: number,
  ): Promise<{
    feriasVencidas: number;
    feriasVencidasTerco: number;
    feriasProporcional: number;
    feriasProporcionalTerco: number;
    vencidasDays: number;
    proporcionaisDays: number;
    proporcionaisMonths: number;
    unjustifiedAbsences: number;
  }> {
    const dailyRate = baseSalary / 30;

    // Dias vencidos — somatório dos períodos aquisitivos completos ainda com saldo.
    const vencidasDays = await this.countExpiredVacationDays(
      tenantId,
      employeeId,
      hireDate,
      terminationDate,
    );

    const feriasVencidas = round(dailyRate * vencidasDays);
    const feriasVencidasTerco = round(feriasVencidas / 3);

    // Funcionários demitidos por justa causa perdem as proporcionais mesmo
    // que exista período aquisitivo aberto (Art. 147 CLT).
    if (terminationType === TerminationType.JUSTA_CAUSA) {
      return {
        feriasVencidas,
        feriasVencidasTerco,
        feriasProporcional: 0,
        feriasProporcionalTerco: 0,
        vencidasDays,
        proporcionaisDays: 0,
        proporcionaisMonths: 0,
        unjustifiedAbsences: 0,
      };
    }

    // Período aquisitivo em aberto — define janela para Art. 130 + Art. 132.
    const openAcquisitionStart = this.computeOpenAcquisitionStart(
      hireDate,
      terminationDate,
    );

    const unjustifiedAbsences = await this.countUnjustifiedAbsenceDays(
      tenantId,
      employeeId,
      openAcquisitionStart,
      terminationDate,
    );

    // Meses contados: Art. 132 CLT (15+ dias efetivamente trabalhados).
    const proporcionaisMonths = this.countEligibleAcquisitionMonths(
      openAcquisitionStart,
      terminationDate,
    );

    // Dias-base conforme Art. 130 CLT, proporcionalizados ao tempo aquisitivo.
    const vacationDaysCap = calculateVacationDays(unjustifiedAbsences);
    const proporcionaisDays = Math.max(
      0,
      Math.round((vacationDaysCap / 12) * proporcionaisMonths),
    );

    const feriasProporcional = round(dailyRate * proporcionaisDays);
    const feriasProporcionalTerco = round(feriasProporcional / 3);

    return {
      feriasVencidas,
      feriasVencidasTerco,
      feriasProporcional,
      feriasProporcionalTerco,
      vencidasDays,
      proporcionaisDays,
      proporcionaisMonths,
      unjustifiedAbsences,
    };
  }

  /**
   * Sum `remainingDays` across all VacationPeriod rows for the employee that
   * (a) have remaining days (b) belong to an acquisition period already
   * closed by the termination date. Falls back to a hire-date heuristic when
   * the repository is not provided (legacy behaviour).
   */
  private async countExpiredVacationDays(
    tenantId: string,
    employeeId: UniqueEntityID,
    hireDate: Date,
    terminationDate: Date,
  ): Promise<number> {
    if (this.vacationPeriodsRepository) {
      const periods = await this.vacationPeriodsRepository.findManyByEmployee(
        employeeId,
        tenantId,
      );

      let totalRemaining = 0;
      for (const period of periods) {
        const acquisitionClosed = period.acquisitionEnd < terminationDate;
        if (!acquisitionClosed) continue;
        if (period.remainingDays <= 0) continue;

        totalRemaining += period.remainingDays;
      }

      return totalRemaining;
    }

    // Fallback: assume 30 dias por ano aquisitivo completo, sem usufruto.
    const totalMonths =
      (terminationDate.getFullYear() - hireDate.getFullYear()) * 12 +
      (terminationDate.getMonth() - hireDate.getMonth());
    const completeYears = Math.floor(totalMonths / 12);
    const fallbackPeriods = Math.max(0, completeYears - 1);
    return fallbackPeriods * 30;
  }

  /**
   * Compute the start of the open acquisition period for the employee.
   * If the employee has been hired for 0–11 months, the whole employment is
   * the open window; otherwise the most recent complete 12-month cycle
   * defines the window.
   */
  private computeOpenAcquisitionStart(
    hireDate: Date,
    terminationDate: Date,
  ): Date {
    const totalMonths =
      (terminationDate.getFullYear() - hireDate.getFullYear()) * 12 +
      (terminationDate.getMonth() - hireDate.getMonth());
    const completeYears = Math.floor(totalMonths / 12);

    if (completeYears === 0) return new Date(hireDate);

    const openStart = new Date(hireDate);
    openStart.setFullYear(openStart.getFullYear() + completeYears);
    return openStart;
  }

  /**
   * Sum the number of unjustified absence days within a date range.
   *
   * "Unjustified" here means the absence is unpaid (`isPaid=false`) AND not
   * `MATERNITY_LEAVE`, `PATERNITY_LEAVE`, `WORK_ACCIDENT`, `SICK_LEAVE` or any
   * legally justified absence — the canonical set is implemented via `isPaid`
   * since every legally justified absence on CLT Art. 473 is paid and every
   * `UNPAID_LEAVE` is, by definition, unpaid and unjustified for vacation
   * purposes (CLT Art. 131).
   *
   * Only APPROVED or COMPLETED absences count; pending/cancelled/rejected are
   * excluded.
   */
  private async countUnjustifiedAbsenceDays(
    tenantId: string,
    employeeId: UniqueEntityID,
    windowStart: Date,
    windowEnd: Date,
  ): Promise<number> {
    if (!this.absencesRepository) return 0;

    const absences =
      await this.absencesRepository.findManyByEmployeeAndDateRange(
        employeeId,
        windowStart,
        windowEnd,
        tenantId,
      );

    let unjustifiedDays = 0;
    for (const absence of absences) {
      if (absence.isPaid) continue;
      if (absence.isRejected() || absence.isCancelled()) continue;
      if (absence.isPending()) continue;

      // Clip absence range into the acquisition window.
      const overlapStart =
        absence.startDate > windowStart ? absence.startDate : windowStart;
      const overlapEnd =
        absence.endDate < windowEnd ? absence.endDate : windowEnd;

      if (overlapStart > overlapEnd) continue;

      const oneDayMs = 1000 * 60 * 60 * 24;
      const days =
        Math.round((overlapEnd.getTime() - overlapStart.getTime()) / oneDayMs) +
        1;
      unjustifiedDays += Math.max(0, days);
    }

    return unjustifiedDays;
  }

  /**
   * Count how many months inside the window had 15+ days effectively
   * worked (CLT Art. 132). Months with less than 15 worked days are dropped.
   *
   * Worked days are computed as days-in-window within that month — faltas
   * reduzem dias do mês, mas o critério oficial do Art. 132 fala em "fração
   * superior a 14 dias" do mês trabalhado, ou seja, 15+ dias (presença
   * administrativa na empresa). Aqui usamos a janela para checar se o mês
   * teve 15+ dias no período aquisitivo (não desconta faltas do mês — faltas
   * entram em Art. 130 via `calculateVacationDays`).
   */
  private countEligibleAcquisitionMonths(
    windowStart: Date,
    windowEnd: Date,
  ): number {
    if (windowEnd < windowStart) return 0;

    let months = 0;
    const cursor = new Date(
      windowStart.getFullYear(),
      windowStart.getMonth(),
      1,
    );

    while (cursor <= windowEnd) {
      const monthFirstDay = new Date(
        cursor.getFullYear(),
        cursor.getMonth(),
        1,
      );
      const monthLastDay = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        0,
      );

      const monthStart =
        monthFirstDay < windowStart ? windowStart : monthFirstDay;
      const monthEnd = monthLastDay > windowEnd ? windowEnd : monthLastDay;

      const oneDayMs = 1000 * 60 * 60 * 24;
      const daysInMonth =
        Math.round((monthEnd.getTime() - monthStart.getTime()) / oneDayMs) + 1;

      if (daysInMonth >= 15) months++;

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
  }

  /**
   * Calculate the number of months worked in the current year for 13th salary
   * purposes. A month counts when the employee worked 15+ days in it
   * (Lei 4.090/62 + Art. 132 CLT analogous rule).
   */
  private calculateMonthsWorkedThisYear(
    hireDate: Date,
    terminationDate: Date,
  ): number {
    const year = terminationDate.getFullYear();
    const startOfYear = new Date(year, 0, 1);

    const effectiveStart =
      hireDate.getFullYear() === year ? hireDate : startOfYear;

    const startMonth = effectiveStart.getMonth();
    const endMonth = terminationDate.getMonth();

    let months = 0;

    for (let m = startMonth; m <= endMonth; m++) {
      if (m === startMonth && effectiveStart.getDate() > 15) continue;
      if (m === endMonth && terminationDate.getDate() < 15) continue;
      months++;
    }

    return months;
  }

  // ─── Tabelas fiscais ───────────────────────────────────────────────────

  private calculateINSS(grossAmount: number, year: number): number {
    if (grossAmount <= 0) return 0;

    const table = getINSSTable(year);
    let inss = 0;
    let remaining = grossAmount;
    let previousLimit = 0;

    for (const bracket of table.brackets) {
      if (remaining <= 0) break;

      const bracketRange = bracket.limit - previousLimit;
      const taxableInBracket = Math.min(remaining, bracketRange);

      inss += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
      previousLimit = bracket.limit;
    }

    return round(Math.min(inss, table.maxContribution));
  }

  private calculateIRRF(taxableBase: number, year: number): number {
    if (taxableBase <= 0) return 0;

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
