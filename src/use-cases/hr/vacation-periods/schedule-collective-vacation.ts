import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';
import type { VacationSplitsRepository } from '@/repositories/hr/vacation-splits-repository';

export interface ScheduleCollectiveVacationRequest {
  tenantId: string;
  employeeIds: string[];
  startDate: Date;
  endDate: Date;
}

export interface CollectiveVacationResult {
  employeeId: string;
  employeeName: string;
  success: boolean;
  splitId?: string;
  error?: string;
}

export interface ScheduleCollectiveVacationResponse {
  results: CollectiveVacationResult[];
  totalScheduled: number;
  totalFailed: number;
}

export class ScheduleCollectiveVacationUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private vacationPeriodsRepository: VacationPeriodsRepository,
    private vacationSplitsRepository: VacationSplitsRepository,
  ) {}

  async execute(
    request: ScheduleCollectiveVacationRequest,
  ): Promise<ScheduleCollectiveVacationResponse> {
    const { tenantId, employeeIds, startDate, endDate } = request;

    // Validação: datas
    if (startDate >= endDate) {
      throw new BadRequestError(
        'A data de início deve ser anterior à data de fim',
      );
    }

    // Calcula dias
    const days =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    // CLT Art. 139: Mínimo 10 dias por período de férias coletivas
    if (days < 10) {
      throw new BadRequestError(
        'Férias coletivas devem ter no mínimo 10 dias corridos (CLT Art. 139)',
      );
    }

    if (employeeIds.length === 0) {
      throw new BadRequestError('É necessário informar ao menos um empregado');
    }

    const results: CollectiveVacationResult[] = [];
    let totalScheduled = 0;
    let totalFailed = 0;

    for (const employeeId of employeeIds) {
      try {
        // Busca o empregado
        const employee = await this.employeesRepository.findById(
          new UniqueEntityID(employeeId),
          tenantId,
        );

        if (!employee) {
          results.push({
            employeeId,
            employeeName: 'Não encontrado',
            success: false,
            error: 'Empregado não encontrado',
          });
          totalFailed++;
          continue;
        }

        if (!employee.isActive()) {
          results.push({
            employeeId,
            employeeName: employee.fullName,
            success: false,
            error: 'Empregado não está ativo',
          });
          totalFailed++;
          continue;
        }

        // Busca períodos disponíveis do empregado (AVAILABLE ou SCHEDULED com saldo)
        const availablePeriods =
          await this.vacationPeriodsRepository.findAvailableByEmployee(
            new UniqueEntityID(employeeId),
            tenantId,
          );

        if (availablePeriods.length === 0) {
          // Empregado sem período disponível — pode ser proporcional
          // Para férias coletivas, empregados sem direito adquirido
          // tiram férias proporcionais e iniciam novo período aquisitivo
          results.push({
            employeeId,
            employeeName: employee.fullName,
            success: false,
            error:
              'Sem período de férias disponível. Férias proporcionais devem ser tratadas manualmente.',
          });
          totalFailed++;
          continue;
        }

        // Usa o período mais antigo com saldo
        const period = availablePeriods[0];

        // Verifica quantas parcelas ativas já existem
        const activeSplits =
          await this.vacationSplitsRepository.findActiveByVacationPeriodId(
            period.id.toString(),
          );

        if (activeSplits.length >= 3) {
          results.push({
            employeeId,
            employeeName: employee.fullName,
            success: false,
            error: 'Já possui 3 parcelas ativas (máximo permitido)',
          });
          totalFailed++;
          continue;
        }

        // CLT Art. 139 §1º: Máximo 2 períodos de férias coletivas por ano
        const currentYear = startDate.getFullYear();
        const collectiveSplitsThisYear = activeSplits.filter((s) => {
          return s.startDate.getFullYear() === currentYear;
        });

        if (collectiveSplitsThisYear.length >= 2) {
          results.push({
            employeeId,
            employeeName: employee.fullName,
            success: false,
            error:
              'Já possui 2 períodos de férias coletivas neste ano (CLT Art. 139 §1º)',
          });
          totalFailed++;
          continue;
        }

        // Calcula dias disponíveis
        const usedSplitDays = activeSplits.reduce((sum, s) => sum + s.days, 0);
        const maxAvailable = period.totalDays - period.soldDays - usedSplitDays;

        // Para férias coletivas, usa o mínimo entre dias solicitados e disponíveis
        const effectiveDays = Math.min(days, maxAvailable);

        if (effectiveDays < 5) {
          results.push({
            employeeId,
            employeeName: employee.fullName,
            success: false,
            error: `Saldo insuficiente (${maxAvailable} dias disponíveis, mínimo 5)`,
          });
          totalFailed++;
          continue;
        }

        // Calcula endDate proporcional se necessário
        const effectiveEndDate = new Date(startDate);
        effectiveEndDate.setDate(
          effectiveEndDate.getDate() + effectiveDays - 1,
        );

        const splitNumber = activeSplits.length + 1;

        // Validação: primeira parcela deve ter >= 14 dias
        if (splitNumber === 1 && effectiveDays < 14) {
          results.push({
            employeeId,
            employeeName: employee.fullName,
            success: false,
            error:
              'Primeira parcela deve ter no mínimo 14 dias (CLT Art. 134 §1º)',
          });
          totalFailed++;
          continue;
        }

        const split = await this.vacationSplitsRepository.create({
          vacationPeriodId: period.id.toString(),
          splitNumber,
          startDate,
          endDate: effectiveEndDate,
          days: effectiveDays,
        });

        results.push({
          employeeId,
          employeeName: employee.fullName,
          success: true,
          splitId: split.id.toString(),
        });
        totalScheduled++;
      } catch (error) {
        results.push({
          employeeId,
          employeeName: employeeId,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
        totalFailed++;
      }
    }

    return { results, totalScheduled, totalFailed };
  }
}
