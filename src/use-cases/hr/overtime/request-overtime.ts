import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Overtime } from '@/entities/hr/overtime';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { OvertimeRepository } from '@/repositories/hr/overtime-repository';

export interface RequestOvertimeRequest {
  tenantId: string;
  employeeId: string;
  date: Date;
  hours: number;
  reason: string;
}

export interface RequestOvertimeResponse {
  overtime: Overtime;
}

export class RequestOvertimeUseCase {
  constructor(
    private overtimeRepository: OvertimeRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: RequestOvertimeRequest,
  ): Promise<RequestOvertimeResponse> {
    const { tenantId, employeeId, date, hours, reason } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Employee not found');
    }

    // Verify employee is active
    if (!employee.status.isActive()) {
      throw new BadRequestError('Employee is not active');
    }

    // Validate hours
    if (hours <= 0) {
      throw new BadRequestError('Horas devem ser maior que 0');
    }

    if (hours > 12) {
      throw new BadRequestError(
        'Horas não podem exceder 12 horas por solicitação',
      );
    }

    // CLT Art. 59: max 2 hours of overtime per day (unless collective agreement)
    const MAX_DAILY_OVERTIME_HOURS = 2;
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existingOvertime =
      await this.overtimeRepository.findManyByEmployeeAndDateRange(
        new UniqueEntityID(employeeId),
        dayStart,
        dayEnd,
        tenantId,
      );

    const totalExistingHours = existingOvertime.reduce(
      (sum, ot) => sum + ot.hours,
      0,
    );

    if (totalExistingHours + hours > MAX_DAILY_OVERTIME_HOURS) {
      const remaining = Math.max(
        0,
        MAX_DAILY_OVERTIME_HOURS - totalExistingHours,
      );
      throw new BadRequestError(
        `Limite CLT de ${MAX_DAILY_OVERTIME_HOURS}h extras/dia excedido. ` +
          `Já registrado: ${totalExistingHours}h. Disponível: ${remaining}h`,
      );
    }

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      throw new BadRequestError('Motivo deve ter pelo menos 10 caracteres');
    }

    // Create overtime request
    const overtime = await this.overtimeRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      date,
      hours,
      reason: reason.trim(),
    });

    return {
      overtime,
    };
  }
}
