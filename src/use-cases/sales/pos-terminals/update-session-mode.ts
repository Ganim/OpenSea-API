import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminal } from '@/entities/sales/pos-terminal';
import {
  PosCoordinationMode,
  type PosCoordinationModeValue,
} from '@/entities/sales/value-objects/pos-coordination-mode';
import {
  PosOperatorSessionMode,
  type PosOperatorSessionModeValue,
} from '@/entities/sales/value-objects/pos-operator-session-mode';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

export interface UpdateSessionModeRequest {
  tenantId: string;
  terminalId: string;
  operatorSessionMode: PosOperatorSessionModeValue;
  operatorSessionTimeout?: number | null;
  autoCloseSessionAt?: string | null;
  coordinationMode?: PosCoordinationModeValue;
  updatedByUserId: string;
}

export interface UpdateSessionModeResponse {
  terminal: PosTerminal;
}

/**
 * Updates the operator-session and coordination configuration of a POS Terminal.
 *
 * Behavior:
 *  - 404 when the terminal does not exist within the tenant.
 *  - 400 when domain invariants are violated:
 *      • `STAY_LOGGED_IN` requires a positive `operatorSessionTimeout` (seconds).
 *      • `autoCloseSessionAt` must match the `HH:MM` 24h format when provided.
 *  - When the new mode is `PER_SALE`, the use case forces
 *    `operatorSessionTimeout` to `null` regardless of the request payload —
 *    PER_SALE closes the session at every sale, so a timeout is meaningless.
 *  - Mutations go through `PosTerminal.updateSessionConfig(...)` so all
 *    invariants are enforced inside the entity (single source of truth).
 *  - On success, persists via `posTerminalsRepository.save(terminal)` and
 *    emits a fire-and-forget `POS_TERMINAL_SESSION_MODE_UPDATE` audit entry
 *    capturing both old and new configuration snapshots.
 *
 * Used by the Emporion POS admin flow (`PATCH /v1/pos/terminals/:id/config`).
 * Protected by `sales.pos.admin` permission.
 */
export class UpdateSessionModeUseCase {
  constructor(private posTerminalsRepository: PosTerminalsRepository) {}

  async execute(
    request: UpdateSessionModeRequest,
  ): Promise<UpdateSessionModeResponse> {
    const {
      tenantId,
      terminalId,
      operatorSessionMode,
      operatorSessionTimeout,
      autoCloseSessionAt,
      coordinationMode,
      updatedByUserId,
    } = request;

    const terminal = await this.posTerminalsRepository.findById(
      new UniqueEntityID(terminalId),
      tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('POS terminal not found');
    }

    const previousConfigSnapshot = {
      operatorSessionMode: terminal.operatorSessionMode.value,
      operatorSessionTimeout: terminal.operatorSessionTimeout ?? null,
      autoCloseSessionAt: terminal.autoCloseSessionAt ?? null,
      coordinationMode: terminal.coordinationMode.value,
    };

    try {
      terminal.updateSessionConfig({
        operatorSessionMode: PosOperatorSessionMode.create(operatorSessionMode),
        operatorSessionTimeout,
        autoCloseSessionAt,
        coordinationMode:
          coordinationMode !== undefined
            ? PosCoordinationMode.create(coordinationMode)
            : undefined,
      });
    } catch (domainError) {
      const message =
        domainError instanceof Error
          ? domainError.message
          : 'Invalid POS terminal session config';
      throw new BadRequestError(message);
    }

    await this.posTerminalsRepository.save(terminal);

    queueAuditLog({
      userId: updatedByUserId,
      action: 'POS_TERMINAL_SESSION_MODE_UPDATE',
      entity: 'POS_TERMINAL',
      entityId: terminal.id.toString(),
      module: 'SALES',
      description: `Updated session mode of POS terminal ${terminalId}`,
      oldData: previousConfigSnapshot,
      newData: {
        operatorSessionMode: terminal.operatorSessionMode.value,
        operatorSessionTimeout: terminal.operatorSessionTimeout ?? null,
        autoCloseSessionAt: terminal.autoCloseSessionAt ?? null,
        coordinationMode: terminal.coordinationMode.value,
      },
    }).catch(() => {});

    return { terminal };
  }
}
