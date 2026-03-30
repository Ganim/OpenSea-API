import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import type { Shift, ShiftType } from '@/entities/hr/shift';
import { ShiftsRepository } from '@/repositories/hr/shifts-repository';

export interface CreateShiftRequest {
  tenantId: string;
  name: string;
  code?: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isNightShift?: boolean;
  color?: string;
}

export interface CreateShiftResponse {
  shift: Shift;
}

export class CreateShiftUseCase {
  constructor(private shiftsRepository: ShiftsRepository) {}

  async execute(request: CreateShiftRequest): Promise<CreateShiftResponse> {
    const {
      tenantId,
      name,
      code,
      type,
      startTime,
      endTime,
      breakMinutes,
      isNightShift,
      color,
    } = request;

    // Validate time format
    if (!this.isValidTimeFormat(startTime)) {
      throw new BadRequestError(
        `Invalid start time format: ${startTime}. Expected HH:MM`,
      );
    }

    if (!this.isValidTimeFormat(endTime)) {
      throw new BadRequestError(
        `Invalid end time format: ${endTime}. Expected HH:MM`,
      );
    }

    // Validate break duration
    if (breakMinutes < 0 || breakMinutes > 480) {
      throw new BadRequestError(
        'Break duration must be between 0 and 480 minutes',
      );
    }

    // Check duplicate name
    const existingByName = await this.shiftsRepository.findByName(
      name,
      tenantId,
    );
    if (existingByName) {
      throw new ConflictError('A shift with this name already exists');
    }

    // Check duplicate code
    if (code) {
      const existingByCode = await this.shiftsRepository.findByCode(
        code,
        tenantId,
      );
      if (existingByCode) {
        throw new ConflictError('A shift with this code already exists');
      }
    }

    // Validate shift type
    const validTypes: ShiftType[] = [
      'FIXED',
      'ROTATING',
      'FLEXIBLE',
      'ON_CALL',
    ];
    if (!validTypes.includes(type)) {
      throw new BadRequestError(
        `Invalid shift type: ${type}. Must be one of: ${validTypes.join(', ')}`,
      );
    }

    const shift = await this.shiftsRepository.create({
      tenantId,
      name,
      code,
      type,
      startTime,
      endTime,
      breakMinutes,
      isNightShift,
      color,
      isActive: true,
    });

    return { shift };
  }

  private isValidTimeFormat(time: string): boolean {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }
}
