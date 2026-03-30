import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Shift, ShiftType } from '@/entities/hr/shift';
import { ShiftsRepository } from '@/repositories/hr/shifts-repository';

export interface UpdateShiftRequest {
  shiftId: string;
  tenantId: string;
  name?: string;
  code?: string | null;
  type?: ShiftType;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  isNightShift?: boolean;
  color?: string | null;
  isActive?: boolean;
}

export interface UpdateShiftResponse {
  shift: Shift;
}

export class UpdateShiftUseCase {
  constructor(private shiftsRepository: ShiftsRepository) {}

  async execute(request: UpdateShiftRequest): Promise<UpdateShiftResponse> {
    const { shiftId, tenantId, name, code, startTime, endTime, breakMinutes } =
      request;

    const existingShift = await this.shiftsRepository.findById(
      new UniqueEntityID(shiftId),
      tenantId,
    );

    if (!existingShift) {
      throw new ResourceNotFoundError('Shift not found');
    }

    // Validate time format if provided
    if (startTime && !this.isValidTimeFormat(startTime)) {
      throw new BadRequestError(
        `Invalid start time format: ${startTime}. Expected HH:MM`,
      );
    }

    if (endTime && !this.isValidTimeFormat(endTime)) {
      throw new BadRequestError(
        `Invalid end time format: ${endTime}. Expected HH:MM`,
      );
    }

    // Validate break duration if provided
    if (
      breakMinutes !== undefined &&
      (breakMinutes < 0 || breakMinutes > 480)
    ) {
      throw new BadRequestError(
        'Break duration must be between 0 and 480 minutes',
      );
    }

    // Check duplicate name if changing
    if (name && name !== existingShift.name) {
      const existingByName = await this.shiftsRepository.findByName(
        name,
        tenantId,
      );
      if (existingByName) {
        throw new ConflictError('A shift with this name already exists');
      }
    }

    // Check duplicate code if changing
    if (code && code !== existingShift.code) {
      const existingByCode = await this.shiftsRepository.findByCode(
        code,
        tenantId,
      );
      if (existingByCode) {
        throw new ConflictError('A shift with this code already exists');
      }
    }

    const updatedShift = await this.shiftsRepository.update({
      id: new UniqueEntityID(shiftId),
      name: request.name,
      code: request.code,
      type: request.type,
      startTime: request.startTime,
      endTime: request.endTime,
      breakMinutes: request.breakMinutes,
      isNightShift: request.isNightShift,
      color: request.color,
      isActive: request.isActive,
    });

    if (!updatedShift) {
      throw new ResourceNotFoundError('Shift not found');
    }

    return { shift: updatedShift };
  }

  private isValidTimeFormat(time: string): boolean {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }
}
