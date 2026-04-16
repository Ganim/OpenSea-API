import { createHash } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export const ANONYMIZE_EMPLOYEE_CONFIRMATION = 'ANONIMIZAR';

export interface AnonymizeEmployeeRequest {
  tenantId: string;
  employeeId: string;
  /** Subject identifier of the user triggering the anonymization. */
  actorUserId: string;
  /** Textual confirmation — must equal {@link ANONYMIZE_EMPLOYEE_CONFIRMATION}. */
  confirmation: string;
  /** Optional reason recorded inside metadata.anonymizationReason. */
  reason?: string;
}

export interface AnonymizeEmployeeResponse {
  employee: Employee;
}

/**
 * Anonymizes an employee record (LGPD Art. 18 VI — conservative strategy).
 *
 * Replaces every PII field with placeholder/hashed values while preserving
 * fiscal-relevant data (payroll items, terminations, holerites and audit log
 * entries) so they remain available for the legal retention period (5+ years
 * — CLT Art. 11 §1 and Receita Federal IN 1.701/2017).
 *
 * The original CPF is replaced with `ANON:<sha256>` so the unique constraint
 * keeps holding and historical foreign keys continue to resolve.
 */
export class AnonymizeEmployeeUseCase {
  constructor(private readonly employeesRepository: EmployeesRepository) {}

  async execute(
    request: AnonymizeEmployeeRequest,
  ): Promise<AnonymizeEmployeeResponse> {
    const { tenantId, employeeId, actorUserId, confirmation, reason } = request;

    if (confirmation !== ANONYMIZE_EMPLOYEE_CONFIRMATION) {
      throw new BadRequestError(
        `A confirmação deve ser exatamente "${ANONYMIZE_EMPLOYEE_CONFIRMATION}".`,
      );
    }

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
      true,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    if (employee.isAnonymized) {
      throw new BadRequestError('Este funcionário já foi anonimizado.');
    }

    const cpfHashedValue = createHash('sha256')
      .update(employee.cpf.value)
      .digest('hex');

    const anonymizedEmployee = await this.employeesRepository.anonymize({
      id: employee.id,
      cpfHashedValue,
      anonymizedAt: new Date(),
      anonymizedByUserId: actorUserId,
      reason,
    });

    if (!anonymizedEmployee) {
      throw new BadRequestError('Failed to anonymize employee');
    }

    return { employee: anonymizedEmployee };
  }
}
