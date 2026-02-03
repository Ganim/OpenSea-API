import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationPeriod } from '@/entities/hr/vacation-period';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface CalculateVacationBalanceRequest {
  tenantId: string;
  employeeId: string;
}

export interface VacationPeriodBalance {
  acquisitionPeriod: string;
  concessionDeadline: Date;
  totalDays: number;
  usedDays: number;
  soldDays: number;
  remainingDays: number;
  status: string;
  isExpired: boolean;
  daysUntilExpiration: number;
}

export interface CalculateVacationBalanceResponse {
  employeeId: string;
  employeeName: string;
  totalAvailableDays: number;
  totalUsedDays: number;
  totalSoldDays: number;
  periods: VacationPeriodBalance[];
}

export class CalculateVacationBalanceUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private vacationPeriodsRepository: VacationPeriodsRepository,
  ) {}

  async execute(
    request: CalculateVacationBalanceRequest,
  ): Promise<CalculateVacationBalanceResponse> {
    const { tenantId, employeeId } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    const vacationPeriods =
      await this.vacationPeriodsRepository.findManyByEmployee(
        new UniqueEntityID(employeeId),
        tenantId,
      );

    const now = new Date();

    const periods: VacationPeriodBalance[] = vacationPeriods.map(
      (period: VacationPeriod) => {
        const concessionEnd = period.concessionEnd;
        const isExpired = concessionEnd < now;
        const daysUntilExpiration = isExpired
          ? 0
          : Math.ceil(
              (concessionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );

        return {
          acquisitionPeriod: `${period.acquisitionStart.toLocaleDateString('pt-BR')} - ${period.acquisitionEnd.toLocaleDateString('pt-BR')}`,
          concessionDeadline: concessionEnd,
          totalDays: period.totalDays,
          usedDays: period.usedDays,
          soldDays: period.soldDays,
          remainingDays: period.remainingDays,
          status: period.status.value,
          isExpired,
          daysUntilExpiration,
        };
      },
    );

    const availablePeriods = periods.filter(
      (p) => !p.isExpired && p.remainingDays > 0,
    );

    const totalAvailableDays = availablePeriods.reduce(
      (sum, p) => sum + p.remainingDays,
      0,
    );
    const totalUsedDays = periods.reduce((sum, p) => sum + p.usedDays, 0);
    const totalSoldDays = periods.reduce((sum, p) => sum + p.soldDays, 0);

    return {
      employeeId: employee.id.toString(),
      employeeName: employee.fullName,
      totalAvailableDays,
      totalUsedDays,
      totalSoldDays,
      periods,
    };
  }
}
