import bcrypt from 'bcryptjs';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { WeakPinError } from '@/@errors/use-cases/weak-pin-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

/**
 * Explicit weak-PIN blocklist (Claude's Discretion C-11 / D-11):
 *   - All 10 six-digit repeating sequences (000000..999999)
 *   - `123456` — the notorious "weakest PIN ever"
 *
 * Kept as a small constant Set so membership is O(1). Intentionally NOT
 * configurable per tenant — these are universally guessable.
 */
export const WEAK_PINS_BLOCKLIST = new Set<string>([
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999',
  '123456',
]);

/** bcrypt cost factor for the PIN hash. Aligned with `User.accessPinHash`. */
const BCRYPT_COST = 10;

export interface SetPunchPinRequest {
  tenantId: string;
  employeeId: string;
  /** Exactly 6 decimal digits. Non-digit / wrong-length inputs are rejected. */
  pin: string;
}

export interface SetPunchPinResponse {
  /** ISO 8601 timestamp when the PIN was stored. */
  setAt: string;
}

/**
 * Admin use case: define or replace an employee's PIN of ponto (D-08).
 *
 * Flow:
 *   1. Validate `pin` matches `^\d{6}$` → {@link BadRequestError} otherwise.
 *   2. Reject against the blocklist → {@link WeakPinError}.
 *   3. Resolve employee inside the tenant → {@link ResourceNotFoundError}.
 *   4. bcrypt.hash(pin, 10) and persist via `updatePunchPin`.
 *   5. Always `clearPinLock` after a (re)set so the new PIN starts fresh.
 *
 * The plaintext `pin` NEVER leaves this method. It is not logged, not
 * persisted, not included in the response.
 */
export class SetPunchPinUseCase {
  constructor(private readonly employeesRepo: EmployeesRepository) {}

  async execute(input: SetPunchPinRequest): Promise<SetPunchPinResponse> {
    if (!/^\d{6}$/.test(input.pin)) {
      throw new BadRequestError('O PIN precisa ter exatamente 6 dígitos.');
    }
    if (WEAK_PINS_BLOCKLIST.has(input.pin)) {
      throw new WeakPinError();
    }

    const employee = await this.employeesRepo.findById(
      new UniqueEntityID(input.employeeId),
      input.tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    const hash = await bcrypt.hash(input.pin, BCRYPT_COST);
    const setAt = new Date();

    await this.employeesRepo.updatePunchPin(
      input.employeeId,
      input.tenantId,
      hash,
      setAt,
    );
    // Reset lockout state so the new PIN starts with a clean counter — D-11
    // guarantees the previous PIN's failed attempts cannot carry over.
    await this.employeesRepo.clearPinLock(input.employeeId, input.tenantId);

    return { setAt: setAt.toISOString() };
  }
}
