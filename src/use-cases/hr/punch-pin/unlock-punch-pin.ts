import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface UnlockPunchPinRequest {
  tenantId: string;
  employeeId: string;
}

export interface UnlockPunchPinResponse {
  /** ISO 8601 timestamp when the admin cleared the lockout. */
  unlockedAt: string;
}

/**
 * Admin override for the PIN lockout (D-11). Zeroes:
 *   - punchPinFailedAttempts
 *   - punchPinLockedUntil
 *   - punchPinLastFailedAt
 *
 * Idempotent: calling on an already-unlocked employee succeeds without
 * error so the admin can double-click the "Desbloquear" button without
 * surprise 500s.
 */
export class UnlockPunchPinUseCase {
  constructor(private readonly employeesRepo: EmployeesRepository) {}

  async execute(input: UnlockPunchPinRequest): Promise<UnlockPunchPinResponse> {
    const employee = await this.employeesRepo.findById(
      new UniqueEntityID(input.employeeId),
      input.tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    await this.employeesRepo.clearPinLock(input.employeeId, input.tenantId);

    return { unlockedAt: new Date().toISOString() };
  }
}
