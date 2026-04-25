import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminalOperator } from '@/entities/sales/pos-terminal-operator';
import type { PosTerminalOperatorsRepository } from '@/repositories/sales/pos-terminal-operators-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

export interface RevokeOperatorRequest {
  tenantId: string;
  terminalId: string;
  employeeId: string;
  revokedByUserId: string;
}

export interface RevokeOperatorResponse {
  operator: PosTerminalOperator;
}

/**
 * Revokes an Employee's authorization as an operator of a POS Terminal.
 *
 * Performs a soft delete by flipping `isActive` to false and stamping the
 * `revokedAt` / `revokedByUserId` audit columns. The underlying row is kept
 * intact so that {@link AssignOperatorUseCase} can later reactivate it (the
 * UNIQUE(terminal_id, employee_id) constraint forbids duplicate rows).
 *
 * Behavior:
 *  - 404 if no link exists between this terminal and employee within the tenant
 *  - 400 if the link is already revoked (`isActive === false`)
 *  - On success, `operator.revoke()` updates the domain entity and the row is
 *    persisted via `operatorsRepository.save(operator)`; an audit log entry
 *    is emitted fire-and-forget.
 *
 * Used by the Emporion POS admin flow to de-authorize a previously assigned
 * operator. Protected by `sales.pos.admin` permission.
 */
export class RevokeOperatorUseCase {
  constructor(private operatorsRepository: PosTerminalOperatorsRepository) {}

  async execute(
    request: RevokeOperatorRequest,
  ): Promise<RevokeOperatorResponse> {
    const { tenantId, terminalId, employeeId, revokedByUserId } = request;

    const terminalUniqueId = new UniqueEntityID(terminalId);
    const employeeUniqueId = new UniqueEntityID(employeeId);
    const revokerUniqueId = new UniqueEntityID(revokedByUserId);

    const operator = await this.operatorsRepository.findByTerminalAndEmployee(
      terminalUniqueId,
      employeeUniqueId,
      tenantId,
    );

    if (!operator) {
      throw new ResourceNotFoundError('POS terminal operator link not found');
    }

    if (!operator.isActive) {
      throw new BadRequestError(
        'POS terminal operator link is already revoked',
      );
    }

    operator.revoke(revokerUniqueId);
    await this.operatorsRepository.save(operator);

    queueAuditLog({
      userId: revokedByUserId,
      action: 'POS_OPERATOR_REVOKE',
      entity: 'POS_TERMINAL_OPERATOR',
      entityId: operator.id.toString(),
      module: 'SALES',
      description: `Revoked employee ${employeeId} as operator of POS terminal ${terminalId}`,
      oldData: {
        terminalId,
        employeeId,
        isActive: true,
      },
      newData: {
        terminalId,
        employeeId,
        revokedByUserId,
        isActive: false,
      },
    }).catch(() => {});

    return { operator };
  }
}
