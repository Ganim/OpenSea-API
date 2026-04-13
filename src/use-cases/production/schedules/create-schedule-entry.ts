import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { ProductionScheduleEntry } from '@/entities/production/schedule-entry';
import { SchedulesRepository } from '@/repositories/production/schedules-repository';

interface CreateScheduleEntryUseCaseRequest {
  scheduleId: string;
  productionOrderId?: string;
  workstationId?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color?: string;
  notes?: string;
}

interface CreateScheduleEntryUseCaseResponse {
  entry: ProductionScheduleEntry;
}

export class CreateScheduleEntryUseCase {
  constructor(private schedulesRepository: SchedulesRepository) {}

  async execute({
    scheduleId,
    productionOrderId,
    workstationId,
    title,
    startDate,
    endDate,
    color,
    notes,
  }: CreateScheduleEntryUseCaseRequest): Promise<CreateScheduleEntryUseCaseResponse> {
    if (endDate <= startDate) {
      throw new BadRequestError('End date must be after start date.');
    }

    const entry = await this.schedulesRepository.createEntry({
      scheduleId,
      productionOrderId,
      workstationId,
      title,
      startDate,
      endDate,
      color,
      notes,
    });

    return { entry };
  }
}
