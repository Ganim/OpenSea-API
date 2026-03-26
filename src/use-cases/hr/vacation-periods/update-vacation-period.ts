import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationPeriod } from '@/entities/hr/vacation-period';
import type { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface UpdateVacationPeriodRequest {
  tenantId: string;
  periodId: string;
  scheduledStart?: Date | null;
  scheduledEnd?: Date | null;
  totalDays?: number;
  notes?: string | null;
}

export interface UpdateVacationPeriodResponse {
  vacationPeriod: VacationPeriod;
}

export class UpdateVacationPeriodUseCase {
  constructor(private vacationPeriodsRepository: VacationPeriodsRepository) {}

  async execute(
    request: UpdateVacationPeriodRequest,
  ): Promise<UpdateVacationPeriodResponse> {
    const {
      tenantId,
      periodId,
      scheduledStart,
      scheduledEnd,
      totalDays,
      notes,
    } = request;

    const vacationPeriod = await this.vacationPeriodsRepository.findById(
      new UniqueEntityID(periodId),
      tenantId,
    );

    if (!vacationPeriod) {
      throw new ResourceNotFoundError('Período de férias não encontrado');
    }

    // Only PENDING or AVAILABLE vacation periods can be updated
    if (!vacationPeriod.isPending() && !vacationPeriod.isAvailable()) {
      throw new BadRequestError(
        'Somente períodos de férias pendentes ou disponíveis podem ser editados',
      );
    }

    // Validate scheduled dates if provided
    if (scheduledStart !== undefined && scheduledEnd !== undefined) {
      if (scheduledStart && scheduledEnd && scheduledEnd < scheduledStart) {
        throw new BadRequestError(
          'A data de término deve ser posterior à data de início',
        );
      }
    }

    // Validate totalDays
    if (totalDays !== undefined) {
      if (totalDays < 1 || totalDays > 30) {
        throw new BadRequestError('O total de dias deve ser entre 1 e 30');
      }
    }

    // Calculate remainingDays if totalDays changed
    const effectiveTotalDays = totalDays ?? vacationPeriod.totalDays;
    const remainingDays =
      totalDays !== undefined
        ? effectiveTotalDays - vacationPeriod.usedDays - vacationPeriod.soldDays
        : undefined;

    if (remainingDays !== undefined && remainingDays < 0) {
      throw new BadRequestError(
        'O total de dias não pode ser menor que os dias já utilizados e vendidos',
      );
    }

    const updatedVacationPeriod = await this.vacationPeriodsRepository.update({
      id: new UniqueEntityID(periodId),
      totalDays,
      remainingDays,
      scheduledStart: scheduledStart !== undefined ? scheduledStart : undefined,
      scheduledEnd: scheduledEnd !== undefined ? scheduledEnd : undefined,
      notes: notes !== undefined ? (notes ?? undefined) : undefined,
    });

    if (!updatedVacationPeriod) {
      throw new ResourceNotFoundError('Período de férias não encontrado');
    }

    return {
      vacationPeriod: updatedVacationPeriod,
    };
  }
}
