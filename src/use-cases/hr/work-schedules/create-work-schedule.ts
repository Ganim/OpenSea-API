import { WorkSchedule } from '@/entities/hr/work-schedule';
import { WorkSchedulesRepository } from '@/repositories/hr/work-schedules-repository';

export interface CreateWorkScheduleRequest {
  name: string;
  description?: string;
  mondayStart?: string;
  mondayEnd?: string;
  tuesdayStart?: string;
  tuesdayEnd?: string;
  wednesdayStart?: string;
  wednesdayEnd?: string;
  thursdayStart?: string;
  thursdayEnd?: string;
  fridayStart?: string;
  fridayEnd?: string;
  saturdayStart?: string;
  saturdayEnd?: string;
  sundayStart?: string;
  sundayEnd?: string;
  breakDuration: number;
}

export interface CreateWorkScheduleResponse {
  workSchedule: WorkSchedule;
}

export class CreateWorkScheduleUseCase {
  constructor(private workSchedulesRepository: WorkSchedulesRepository) {}

  async execute(
    request: CreateWorkScheduleRequest,
  ): Promise<CreateWorkScheduleResponse> {
    const {
      name,
      description,
      mondayStart,
      mondayEnd,
      tuesdayStart,
      tuesdayEnd,
      wednesdayStart,
      wednesdayEnd,
      thursdayStart,
      thursdayEnd,
      fridayStart,
      fridayEnd,
      saturdayStart,
      saturdayEnd,
      sundayStart,
      sundayEnd,
      breakDuration,
    } = request;

    // Check if schedule with same name already exists
    const existingSchedule =
      await this.workSchedulesRepository.findByName(name);
    if (existingSchedule) {
      throw new Error('Work schedule with this name already exists');
    }

    // Validate time format (HH:MM)
    const timeFields = [
      mondayStart,
      mondayEnd,
      tuesdayStart,
      tuesdayEnd,
      wednesdayStart,
      wednesdayEnd,
      thursdayStart,
      thursdayEnd,
      fridayStart,
      fridayEnd,
      saturdayStart,
      saturdayEnd,
      sundayStart,
      sundayEnd,
    ];

    for (const time of timeFields) {
      if (time && !this.isValidTimeFormat(time)) {
        throw new Error(`Invalid time format: ${time}. Expected HH:MM`);
      }
    }

    // Validate break duration
    if (breakDuration < 0 || breakDuration > 480) {
      throw new Error('Break duration must be between 0 and 480 minutes');
    }

    // Create work schedule
    const workSchedule = await this.workSchedulesRepository.create({
      name,
      description,
      mondayStart,
      mondayEnd,
      tuesdayStart,
      tuesdayEnd,
      wednesdayStart,
      wednesdayEnd,
      thursdayStart,
      thursdayEnd,
      fridayStart,
      fridayEnd,
      saturdayStart,
      saturdayEnd,
      sundayStart,
      sundayEnd,
      breakDuration,
      isActive: true,
    });

    return {
      workSchedule,
    };
  }

  private isValidTimeFormat(time: string): boolean {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }
}
