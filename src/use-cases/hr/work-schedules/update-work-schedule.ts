import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkSchedule } from '@/entities/hr/work-schedule';
import { WorkSchedulesRepository } from '@/repositories/hr/work-schedules-repository';

export interface UpdateWorkScheduleRequest {
  id: string;
  name?: string;
  description?: string | null;
  mondayStart?: string | null;
  mondayEnd?: string | null;
  tuesdayStart?: string | null;
  tuesdayEnd?: string | null;
  wednesdayStart?: string | null;
  wednesdayEnd?: string | null;
  thursdayStart?: string | null;
  thursdayEnd?: string | null;
  fridayStart?: string | null;
  fridayEnd?: string | null;
  saturdayStart?: string | null;
  saturdayEnd?: string | null;
  sundayStart?: string | null;
  sundayEnd?: string | null;
  breakDuration?: number;
  isActive?: boolean;
}

export interface UpdateWorkScheduleResponse {
  workSchedule: WorkSchedule;
}

export class UpdateWorkScheduleUseCase {
  constructor(private workSchedulesRepository: WorkSchedulesRepository) {}

  async execute(
    request: UpdateWorkScheduleRequest,
  ): Promise<UpdateWorkScheduleResponse> {
    const { id, name, breakDuration, ...rest } = request;

    // Check if schedule exists
    const existingSchedule = await this.workSchedulesRepository.findById(
      new UniqueEntityID(id),
    );
    if (!existingSchedule) {
      throw new Error('Work schedule not found');
    }

    // Check if new name conflicts with another schedule
    if (name && name !== existingSchedule.name) {
      const scheduleWithSameName =
        await this.workSchedulesRepository.findByName(name);
      if (scheduleWithSameName) {
        throw new Error('Work schedule with this name already exists');
      }
    }

    // Validate time format for provided fields
    const timeFields = [
      rest.mondayStart,
      rest.mondayEnd,
      rest.tuesdayStart,
      rest.tuesdayEnd,
      rest.wednesdayStart,
      rest.wednesdayEnd,
      rest.thursdayStart,
      rest.thursdayEnd,
      rest.fridayStart,
      rest.fridayEnd,
      rest.saturdayStart,
      rest.saturdayEnd,
      rest.sundayStart,
      rest.sundayEnd,
    ];

    for (const time of timeFields) {
      if (time && !this.isValidTimeFormat(time)) {
        throw new Error(`Invalid time format: ${time}. Expected HH:MM`);
      }
    }

    // Validate break duration
    if (
      breakDuration !== undefined &&
      (breakDuration < 0 || breakDuration > 480)
    ) {
      throw new Error('Break duration must be between 0 and 480 minutes');
    }

    // Update work schedule
    const workSchedule = await this.workSchedulesRepository.update({
      id: new UniqueEntityID(id),
      name,
      breakDuration,
      ...rest,
    });

    if (!workSchedule) {
      throw new Error('Failed to update work schedule');
    }

    return {
      workSchedule,
    };
  }

  private isValidTimeFormat(time: string): boolean {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }
}
