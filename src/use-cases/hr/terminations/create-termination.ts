import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Termination } from '@/entities/hr/termination';
import {
  NoticeType,
  TerminationType,
} from '@/entities/hr/termination';
import { EmployeeStatus } from '@/entities/hr/value-objects';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { TerminationsRepository } from '@/repositories/hr/terminations-repository';

export interface CreateTerminationRequest {
  tenantId: string;
  employeeId: string;
  type: TerminationType;
  terminationDate: Date;
  lastWorkDay: Date;
  noticeType: NoticeType;
  notes?: string;
}

export interface CreateTerminationResponse {
  termination: Termination;
}

export class CreateTerminationUseCase {
  constructor(
    private terminationsRepository: TerminationsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: CreateTerminationRequest,
  ): Promise<CreateTerminationResponse> {
    const {
      tenantId,
      employeeId,
      type,
      terminationDate,
      lastWorkDay,
      noticeType,
      notes,
    } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    // Check if employee is active
    if (employee.status.value === 'TERMINATED') {
      throw new BadRequestError('Funcionário já está desligado');
    }

    // Check if employee already has a termination record
    const existingTermination =
      await this.terminationsRepository.findByEmployeeId(
        new UniqueEntityID(employeeId),
        tenantId,
      );

    if (existingTermination) {
      throw new BadRequestError(
        'Funcionário já possui registro de rescisão',
      );
    }

    // Calculate aviso prévio days: 30 + (3 × complete years of service), max 90
    const hireDate = employee.hireDate;
    const yearsOfService = Math.floor(
      (terminationDate.getTime() - hireDate.getTime()) /
        (365.25 * 24 * 60 * 60 * 1000),
    );
    const noticeDays = Math.min(30 + 3 * yearsOfService, 90);

    // Payment deadline: terminationDate + 10 calendar days
    const paymentDeadline = new Date(terminationDate);
    paymentDeadline.setDate(paymentDeadline.getDate() + 10);

    // Create termination record
    const termination = await this.terminationsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      type,
      terminationDate,
      lastWorkDay,
      noticeType,
      noticeDays,
      paymentDeadline,
      notes,
    });

    // Update employee status to TERMINATED
    await this.employeesRepository.update({
      id: new UniqueEntityID(employeeId),
      status: EmployeeStatus.TERMINATED(),
      terminationDate,
      metadata: {
        ...employee.metadata,
        terminationReason: type,
        terminatedAt: new Date().toISOString(),
      },
    });

    return { termination };
  }
}
