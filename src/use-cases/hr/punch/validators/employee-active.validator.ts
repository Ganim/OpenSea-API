import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

import type {
  PunchValidationContext,
  PunchValidationDecision,
  PunchValidator,
} from './punch-validator.interface';

/**
 * Step 1 of the pipeline: confirm the employee exists and is active.
 *
 * Rejection codes:
 * - `EMPLOYEE_NOT_FOUND`: no row in this tenant (also catches soft-deleted
 *   unless includeDeleted — we use the default strict query).
 * - `EMPLOYEE_INACTIVE`: exists but status is not ACTIVE (terminated,
 *   suspended, admission pending, on leave, etc.).
 *
 * Cheap first-pass: a single indexed lookup (tenantId, id) — keep it at
 * the front of the pipeline so we skip expensive vacation/absence/
 * geofence queries when the employee can't punch regardless.
 */
export class EmployeeActiveValidator implements PunchValidator {
  readonly name = 'EmployeeActiveValidator';

  constructor(private readonly employeesRepository: EmployeesRepository) {}

  async validate(
    ctx: PunchValidationContext,
  ): Promise<PunchValidationDecision> {
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(ctx.employeeId),
      ctx.tenantId,
    );

    if (!employee) {
      return {
        outcome: 'REJECT',
        code: 'EMPLOYEE_NOT_FOUND',
        reason: 'Funcionário não encontrado',
      };
    }

    if (!employee.status?.isActive?.()) {
      return {
        outcome: 'REJECT',
        code: 'EMPLOYEE_INACTIVE',
        reason: 'Funcionário inativo; batidas não são permitidas',
      };
    }

    return { outcome: 'ACCEPT' };
  }
}
