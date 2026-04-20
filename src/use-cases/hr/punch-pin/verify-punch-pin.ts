import bcrypt from 'bcryptjs';

import { PinInvalidError } from '@/@errors/use-cases/pin-invalid-error';
import { PinLockedError } from '@/@errors/use-cases/pin-locked-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import {
  PUNCH_EVENTS,
  type PunchPinLockedData,
} from '@/lib/events/punch-events';
import { getTypedEventBus } from '@/lib/events/typed-event-bus';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

/** Max consecutive failed attempts before the PIN gets locked (D-11). */
export const MAX_ATTEMPTS = 5;
/** Lockout duration in minutes after MAX_ATTEMPTS failures (D-11). */
export const LOCKOUT_MINUTES = 15;
/**
 * Sliding-window hours used to auto-reset the failed-attempt counter. Old
 * failures that happened more than `ATTEMPT_WINDOW_HOURS` ago are discarded
 * on the next attempt so a lockout cannot be triggered by stale state (D-11).
 */
export const ATTEMPT_WINDOW_HOURS = 1;

export interface VerifyPunchPinRequest {
  tenantId: string;
  employeeId: string;
  pin: string;
}

export interface VerifyPunchPinResponse {
  valid: true;
  employee: Employee;
}

/**
 * Internal use case called by Plan 05-07's `ExecutePunchUseCase` when the
 * kiosk pin+matricula identification branch is taken (D-10). Never exposed
 * as a standalone HTTP endpoint — face match is still mandatory on success,
 * and the caller is the one that keeps the two-factor contract intact.
 *
 * State machine spec (D-11 verbatim) — see `05-05-PLAN.md §state_machine_spec`:
 *   1. employee missing / wrong tenant → ResourceNotFoundError
 *   2. no punchPinHash set              → PinInvalidError('PIN não configurado')
 *   3. lockedUntil > now                → PinLockedError (no counter mutation)
 *   4. lastFailedAt > 1h ago            → auto-reset counter to 0
 *   5. bcrypt ok                        → clear all lock state, return valid
 *   6. bcrypt fail + newAttempts >= 5   → LOCK, publish PIN_LOCKED event, throw PinLockedError
 *   7. bcrypt fail + newAttempts  < 5   → increment counter, throw PinInvalidError
 */
export class VerifyPunchPinUseCase {
  constructor(private readonly employeesRepo: EmployeesRepository) {}

  async execute(input: VerifyPunchPinRequest): Promise<VerifyPunchPinResponse> {
    const employee = await this.employeesRepo.findById(
      new UniqueEntityID(input.employeeId),
      input.tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    const hash = employee.punchPinHash;
    if (!hash) {
      throw new PinInvalidError('PIN não configurado', null);
    }

    const now = new Date();

    // Step 3 — already locked (server-authoritative timestamp).
    if (employee.punchPinLockedUntil && employee.punchPinLockedUntil > now) {
      throw new PinLockedError(employee.punchPinLockedUntil);
    }

    // Step 4 — auto-reset aged counter. If the last failure happened more
    // than 1h ago, discard the accumulated count so a current attempt is not
    // pushed over the lockout threshold by stale state.
    let currentAttempts = employee.punchPinFailedAttempts;
    const lastFailedAt = employee.punchPinLastFailedAt;
    if (
      lastFailedAt &&
      now.getTime() - lastFailedAt.getTime() >
        ATTEMPT_WINDOW_HOURS * 60 * 60 * 1000
    ) {
      currentAttempts = 0;
    }

    const ok = await bcrypt.compare(input.pin, hash);
    if (ok) {
      // Step 5 — success. Clear every lockout-related column so the next
      // attempt (future) starts from a fully-clean state.
      await this.employeesRepo.clearPinLock(input.employeeId, input.tenantId);
      return { valid: true, employee };
    }

    const newAttempts = currentAttempts + 1;

    // Step 6 — transition into lock.
    if (newAttempts >= MAX_ATTEMPTS) {
      const lockedUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
      await this.employeesRepo.updatePinLockState(
        input.employeeId,
        input.tenantId,
        {
          failedAttempts: 0, // D-11: reset counter to 0 AT the lockout moment
          lockedUntil,
          lastFailedAt: now,
        },
      );

      // Emit PIN_LOCKED event so `punchPinLockedDispatcherConsumer` (Plan
      // 05-02) can notify admins. Swallow downstream failures — the lockout
      // is already persisted and must not be invalidated by a broken bus.
      try {
        const payload: PunchPinLockedData = {
          employeeId: input.employeeId,
          tenantId: input.tenantId,
          employeeName: employee.fullName,
          lockedUntil: lockedUntil.toISOString(),
          failedAttempts: MAX_ATTEMPTS,
        };
        await getTypedEventBus().publish({
          type: PUNCH_EVENTS.PIN_LOCKED,
          version: 1,
          tenantId: input.tenantId,
          source: 'hr',
          sourceEntityType: 'employee',
          sourceEntityId: input.employeeId,
          data: payload as unknown as Record<string, unknown>,
        });
      } catch {
        // Fail-open: event bus hiccup does not undo the persisted lockout.
      }

      throw new PinLockedError(lockedUntil);
    }

    // Step 7 — increment counter, keep the account unlocked.
    await this.employeesRepo.updatePinLockState(
      input.employeeId,
      input.tenantId,
      {
        failedAttempts: newAttempts,
        lockedUntil: null,
        lastFailedAt: now,
      },
    );

    throw new PinInvalidError(
      `PIN incorreto. Tentativa ${newAttempts} de ${MAX_ATTEMPTS}.`,
      MAX_ATTEMPTS - newAttempts,
    );
  }
}
