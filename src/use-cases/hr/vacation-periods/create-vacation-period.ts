import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationStatus } from '@/entities/hr/value-objects/vacation-status';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface CreateVacationPeriodRequest {
  employeeId: string;
  acquisitionStart: Date;
  acquisitionEnd: Date;
  concessionStart: Date;
  concessionEnd: Date;
  totalDays?: number;
  notes?: string;
}

export interface CreateVacationPeriodResponse {
  vacationPeriod: VacationPeriod;
}

export class CreateVacationPeriodUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private vacationPeriodsRepository: VacationPeriodsRepository,
  ) {}

  async execute(
    request: CreateVacationPeriodRequest,
  ): Promise<CreateVacationPeriodResponse> {
    const {
      employeeId,
      acquisitionStart,
      acquisitionEnd,
      concessionStart,
      concessionEnd,
      totalDays = 30, // CLT: 30 dias de férias por período aquisitivo
      notes,
    } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    const vacationPeriod = VacationPeriod.create({
      employeeId: new UniqueEntityID(employeeId),
      acquisitionStart,
      acquisitionEnd,
      concessionStart,
      concessionEnd,
      totalDays,
      usedDays: 0,
      soldDays: 0,
      remainingDays: totalDays,
      status: VacationStatus.create('AVAILABLE'),
      notes,
    });

    await this.vacationPeriodsRepository.create({
      employeeId: new UniqueEntityID(employeeId),
      acquisitionStart,
      acquisitionEnd,
      concessionStart,
      concessionEnd,
      totalDays,
      usedDays: 0,
      soldDays: 0,
      remainingDays: totalDays,
      status: 'AVAILABLE',
      notes,
    });

    return {
      vacationPeriod,
    };
  }
}
