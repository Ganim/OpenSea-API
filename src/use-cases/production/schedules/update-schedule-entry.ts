import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  ProductionScheduleEntry,
  ScheduleEntryStatus,
} from '@/entities/production/schedule-entry';
import { SchedulesRepository } from '@/repositories/production/schedules-repository';

interface UpdateScheduleEntryUseCaseRequest {
  id: string;
  title?: string;
  startDate?: Date;
  endDate?: Date;
  workstationId?: string | null;
  status?: ScheduleEntryStatus;
  color?: string | null;
  notes?: string | null;
}

interface UpdateScheduleEntryUseCaseResponse {
  entry: ProductionScheduleEntry;
}

export class UpdateScheduleEntryUseCase {
  constructor(private schedulesRepository: SchedulesRepository) {}

  async execute({
    id,
    title,
    startDate,
    endDate,
    workstationId,
    status,
    color,
    notes,
  }: UpdateScheduleEntryUseCaseRequest): Promise<UpdateScheduleEntryUseCaseResponse> {
    const existing = await this.schedulesRepository.findEntryById(
      new UniqueEntityID(id),
    );

    if (!existing) {
      throw new ResourceNotFoundError('Schedule entry not found.');
    }

    const entry = await this.schedulesRepository.updateEntry({
      id: new UniqueEntityID(id),
      title,
      startDate,
      endDate,
      workstationId,
      status,
      color,
      notes,
    });

    return { entry: entry! };
  }
}
