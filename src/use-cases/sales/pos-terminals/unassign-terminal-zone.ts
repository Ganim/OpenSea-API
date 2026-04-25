import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminalZonesRepository } from '@/repositories/sales/pos-terminal-zones-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

export interface UnassignTerminalZoneRequest {
  tenantId: string;
  terminalId: string;
  zoneId: string;
  unassignedByUserId: string;
}

export interface UnassignTerminalZoneResponse {
  success: true;
}

/**
 * Removes the link between a POS Terminal and a Zone.
 *
 * Behavior:
 *  - 404 if no link exists for `(terminalId, zoneId)` within the tenant.
 *    Cross-tenant isolation is enforced by the repository's
 *    `findByTerminalAndZone(..., tenantId)` contract.
 *  - On success the row is hard-deleted via
 *    `posTerminalZonesRepository.remove(linkId)`. This join row carries no
 *    history of its own — the underlying Zone and PosTerminal are kept
 *    intact, so a hard delete is the correct lifecycle (mirrors the existing
 *    `pos_terminal_zones` schema, which has no `deletedAt` column).
 *  - Emits a fire-and-forget `POS_TERMINAL_ZONE_UNASSIGN` audit entry on
 *    success (audit failures never block the success response).
 *
 * Used by the Emporion POS admin flow
 * (`DELETE /v1/pos/terminals/:id/zones/:zoneId`). Protected by
 * `sales.pos.admin` permission.
 */
export class UnassignTerminalZoneUseCase {
  constructor(private posTerminalZonesRepository: PosTerminalZonesRepository) {}

  async execute(
    request: UnassignTerminalZoneRequest,
  ): Promise<UnassignTerminalZoneResponse> {
    const { tenantId, terminalId, zoneId, unassignedByUserId } = request;

    const terminalUniqueId = new UniqueEntityID(terminalId);
    const zoneUniqueId = new UniqueEntityID(zoneId);

    const existingLink =
      await this.posTerminalZonesRepository.findByTerminalAndZone(
        terminalUniqueId,
        zoneUniqueId,
        tenantId,
      );

    if (!existingLink) {
      throw new ResourceNotFoundError('POS terminal zone link not found');
    }

    await this.posTerminalZonesRepository.remove(existingLink.id);

    queueAuditLog({
      userId: unassignedByUserId,
      action: 'POS_TERMINAL_ZONE_UNASSIGN',
      entity: 'POS_TERMINAL_ZONE',
      entityId: existingLink.id.toString(),
      module: 'SALES',
      description: `Unassigned zone ${zoneId} from POS terminal ${terminalId}`,
      oldData: {
        terminalId,
        zoneId,
        tier: existingLink.tier.value,
      },
    }).catch(() => {});

    return { success: true };
  }
}
