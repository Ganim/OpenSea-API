import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationSplit } from '@/entities/hr/vacation-split';
import type { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';
import type { VacationSplitsRepository } from '@/repositories/hr/vacation-splits-repository';

export interface ScheduleVacationSplitRequest {
  tenantId: string;
  vacationPeriodId: string;
  startDate: Date;
  endDate: Date;
  days: number;
}

export interface ScheduleVacationSplitResponse {
  vacationSplit: VacationSplit;
}

export class ScheduleVacationSplitUseCase {
  constructor(
    private vacationPeriodsRepository: VacationPeriodsRepository,
    private vacationSplitsRepository: VacationSplitsRepository,
  ) {}

  async execute(
    request: ScheduleVacationSplitRequest,
  ): Promise<ScheduleVacationSplitResponse> {
    const { tenantId, vacationPeriodId, startDate, endDate, days } = request;

    // 1. Busca o período de férias
    const vacationPeriod = await this.vacationPeriodsRepository.findById(
      new UniqueEntityID(vacationPeriodId),
      tenantId,
    );

    if (!vacationPeriod) {
      throw new ResourceNotFoundError('VacationPeriod');
    }

    // 2. Verifica se o período permite agendamento
    if (!vacationPeriod.canSchedule()) {
      throw new BadRequestError(
        `Não é possível agendar parcela para período com status: ${vacationPeriod.status.value}`,
      );
    }

    // 3. Busca parcelas ativas existentes
    const activeSplits =
      await this.vacationSplitsRepository.findActiveByVacationPeriodId(
        vacationPeriodId,
      );

    // 4. Máximo 3 parcelas (CLT Art. 134 §1º)
    if (activeSplits.length >= 3) {
      throw new BadRequestError(
        'Máximo de 3 parcelas de férias permitido (CLT Art. 134 §1º)',
      );
    }

    const splitNumber = activeSplits.length + 1;

    // 5. Validação de dias mínimos
    //    - Primeira parcela: mínimo 14 dias
    //    - Demais parcelas: mínimo 5 dias
    if (splitNumber === 1 && days < 14) {
      throw new BadRequestError(
        'A primeira parcela de férias deve ter no mínimo 14 dias (CLT Art. 134 §1º)',
      );
    }

    if (splitNumber > 1 && days < 5) {
      throw new BadRequestError(
        'As demais parcelas de férias devem ter no mínimo 5 dias (CLT Art. 134 §1º)',
      );
    }

    // 6. Total de dias das parcelas não pode exceder (totalDays - soldDays)
    const usedSplitDays = activeSplits.reduce((sum, s) => sum + s.days, 0);
    const maxAvailable =
      vacationPeriod.totalDays - vacationPeriod.soldDays - usedSplitDays;

    if (days > maxAvailable) {
      throw new BadRequestError(
        `Dias insuficientes. Disponível: ${maxAvailable} dias. Solicitado: ${days} dias`,
      );
    }

    // 7. Validação de datas
    if (startDate >= endDate) {
      throw new BadRequestError(
        'A data de início deve ser anterior à data de fim',
      );
    }

    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff !== days - 1) {
      throw new BadRequestError(
        'O período informado não corresponde ao número de dias',
      );
    }

    // 8. Não pode iniciar nos 2 dias antes de feriado ou DSR (Art. 134 §3º)
    //    Verifica se startDate cai em sexta ou sábado (véspera de DSR domingo)
    const dayOfWeek = startDate.getDay(); // 0=Dom, 5=Sex, 6=Sáb
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      throw new BadRequestError(
        'Férias não podem iniciar nos 2 dias anteriores ao repouso semanal remunerado (CLT Art. 134 §3º)',
      );
    }

    // 9. Cria a parcela
    const vacationSplit = await this.vacationSplitsRepository.create({
      vacationPeriodId,
      splitNumber,
      startDate,
      endDate,
      days,
    });

    return { vacationSplit };
  }
}
