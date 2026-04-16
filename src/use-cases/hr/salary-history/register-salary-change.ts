import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  SalaryChangeReason,
  SalaryHistory,
} from '@/entities/hr/salary-history';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { SalaryHistoryRepository } from '@/repositories/hr/salary-history-repository';

export interface RegisterSalaryChangeRequest {
  tenantId: string;
  employeeId: string;
  newSalary: number;
  reason: SalaryChangeReason;
  notes?: string;
  effectiveDate: Date;
  changedBy: string;
}

export interface RegisterSalaryChangeResponse {
  salaryHistory: SalaryHistory;
  appliedToEmployee: boolean;
  previousSalary: number | null;
}

export class RegisterSalaryChangeUseCase {
  constructor(
    private salaryHistoryRepository: SalaryHistoryRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: RegisterSalaryChangeRequest,
  ): Promise<RegisterSalaryChangeResponse> {
    const {
      tenantId,
      employeeId,
      newSalary,
      reason,
      notes,
      effectiveDate,
      changedBy,
    } = request;

    if (newSalary <= 0) {
      throw new BadRequestError('Salário deve ser maior que zero');
    }

    const employeeIdVO = new UniqueEntityID(employeeId);

    const employee = await this.employeesRepository.findById(
      employeeIdVO,
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    const previousSalary = employee.baseSalary ?? null;

    if (previousSalary !== null && previousSalary === newSalary) {
      throw new BadRequestError(
        'O novo salário deve ser diferente do salário atual',
      );
    }

    const salaryHistory = await this.salaryHistoryRepository.create({
      tenantId,
      employeeId: employeeIdVO,
      previousSalary: previousSalary ?? undefined,
      newSalary,
      reason,
      notes,
      effectiveDate,
      changedBy: new UniqueEntityID(changedBy),
    });

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const shouldApplyNow = effectiveDate.getTime() <= today.getTime();

    if (shouldApplyNow) {
      await this.employeesRepository.update({
        id: employeeIdVO,
        baseSalary: newSalary,
      });
    }

    return {
      salaryHistory,
      appliedToEmployee: shouldApplyNow,
      previousSalary,
    };
  }
}
