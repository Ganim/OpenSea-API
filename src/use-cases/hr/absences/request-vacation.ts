import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Absence } from '@/entities/hr/absence';
import { AbsencesRepository } from '@/repositories/hr/absences-repository';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface RequestVacationRequest {
  employeeId: string;
  vacationPeriodId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
  requestedBy?: string;
}

export interface RequestVacationResponse {
  absence: Absence;
}

export class RequestVacationUseCase {
  constructor(
    private absencesRepository: AbsencesRepository,
    private employeesRepository: EmployeesRepository,
    private vacationPeriodsRepository: VacationPeriodsRepository,
  ) {}

  async execute(
    request: RequestVacationRequest,
  ): Promise<RequestVacationResponse> {
    const {
      employeeId,
      vacationPeriodId,
      startDate,
      endDate,
      reason,
      requestedBy,
    } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
    );
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify employee is active
    if (!employee.status.isActive()) {
      throw new Error('Funcionário não está ativo');
    }

    // Verify vacation period exists
    const vacationPeriod = await this.vacationPeriodsRepository.findById(
      new UniqueEntityID(vacationPeriodId),
    );
    if (!vacationPeriod) {
      throw new Error('VacationPeriod not found');
    }

    // Calculate total days
    const totalDays = this.calculateBusinessDays(startDate, endDate);

    // Validate minimum vacation period (5 days according to Brazilian law)
    if (totalDays < 5) {
      throw new Error('O período mínimo de férias é de 5 dias');
    }

    // Validate maximum vacation period (30 days)
    if (totalDays > 30) {
      throw new Error('O período máximo de férias é de 30 dias');
    }

    // Check for available days in the vacation period
    if (vacationPeriod.remainingDays < totalDays) {
      throw new Error('Não há dias de férias suficientes disponíveis');
    }

    // Check for overlapping absences
    const overlapping = await this.absencesRepository.findOverlapping(
      new UniqueEntityID(employeeId),
      startDate,
      endDate,
    );

    if (overlapping.length > 0) {
      throw new Error('Já existe uma ausência registrada para este período');
    }

    // Validate start date is at least 30 days in advance (Brazilian law)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minStartDate = new Date(today);
    minStartDate.setDate(minStartDate.getDate() + 30);

    if (startDate < minStartDate) {
      throw new Error(
        'As férias devem ser solicitadas com pelo menos 30 dias de antecedência',
      );
    }

    // Create vacation absence
    const absence = await this.absencesRepository.create({
      employeeId: new UniqueEntityID(employeeId),
      type: 'VACATION',
      startDate,
      endDate,
      totalDays,
      reason,
      isPaid: true,
      vacationPeriodId: new UniqueEntityID(vacationPeriodId),
      requestedBy: requestedBy ? new UniqueEntityID(requestedBy) : undefined,
    });

    return {
      absence,
    };
  }

  private calculateBusinessDays(startDate: Date, endDate: Date): number {
    // For simplicity, calculate calendar days (inclusive)
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 to include both start and end dates
  }
}
