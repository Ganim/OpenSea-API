import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OneOnOneMeeting } from '@/entities/hr/one-on-one-meeting';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { OneOnOneMeetingsRepository } from '@/repositories/hr/one-on-one-meetings-repository';

export interface ScheduleOneOnOneRequest {
  tenantId: string;
  managerId: string;
  reportId: string;
  scheduledAt: Date;
  durationMinutes?: number;
}

export interface ScheduleOneOnOneResponse {
  meeting: OneOnOneMeeting;
}

export class ScheduleOneOnOneUseCase {
  constructor(
    private oneOnOneMeetingsRepository: OneOnOneMeetingsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: ScheduleOneOnOneRequest,
  ): Promise<ScheduleOneOnOneResponse> {
    const {
      tenantId,
      managerId,
      reportId,
      scheduledAt,
      durationMinutes = 30,
    } = request;

    if (managerId === reportId) {
      throw new BadRequestError(
        'Gestor e liderado devem ser pessoas diferentes',
      );
    }

    const manager = await this.employeesRepository.findById(
      new UniqueEntityID(managerId),
      tenantId,
    );

    if (!manager) {
      throw new ResourceNotFoundError('Manager');
    }

    const report = await this.employeesRepository.findById(
      new UniqueEntityID(reportId),
      tenantId,
    );

    if (!report) {
      throw new ResourceNotFoundError('Report');
    }

    const meeting = await this.oneOnOneMeetingsRepository.create({
      tenantId,
      managerId: new UniqueEntityID(managerId),
      reportId: new UniqueEntityID(reportId),
      scheduledAt,
      durationMinutes,
    });

    return { meeting };
  }
}
