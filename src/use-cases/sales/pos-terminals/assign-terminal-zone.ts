import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminalZone } from '@/entities/sales/pos-terminal-zone';
import {
  PosZoneTier,
  type PosZoneTierValue,
} from '@/entities/sales/value-objects/pos-zone-tier';
import type { PosTerminalZonesRepository } from '@/repositories/sales/pos-terminal-zones-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

export interface AssignTerminalZoneRequest {
  tenantId: string;
  terminalId: string;
  zoneId: string;
  tier: PosZoneTierValue;
  assignedByUserId: string;
}

export interface AssignTerminalZoneResponse {
  terminalZone: PosTerminalZone;
}

/**
 * Assigns (or re-tiers) a Zone to a POS Terminal.
 *
 * Behavior:
 *  - 404 if the terminal does not exist within the tenant.
 *  - 404 if the zone does not exist within the tenant (cross-tenant lookups
 *    are rejected via the repository's `findById(zoneId, tenantId)` contract).
 *  - Idempotent for `(terminalId, zoneId)` thanks to the
 *    `pos_terminal_zones_unique` constraint: when a link already exists, the
 *    `tier` is updated in-place via `posTerminalZonesRepository.save(...)`
 *    instead of creating a duplicate row.
 *  - Otherwise, a new `PosTerminalZone` entity is created with the requested
 *    tier and persisted via `create(...)`.
 *  - Emits a fire-and-forget `POS_TERMINAL_ZONE_ASSIGN` audit entry on
 *    success (audit failures never block the success response).
 *
 * Used by the Emporion POS admin flow (`PUT /v1/pos/terminals/:id/zones/:zoneId`).
 * Protected by `sales.pos.admin` permission.
 */
export class AssignTerminalZoneUseCase {
  constructor(
    private posTerminalsRepository: PosTerminalsRepository,
    private zonesRepository: ZonesRepository,
    private posTerminalZonesRepository: PosTerminalZonesRepository,
  ) {}

  async execute(
    request: AssignTerminalZoneRequest,
  ): Promise<AssignTerminalZoneResponse> {
    const { tenantId, terminalId, zoneId, tier, assignedByUserId } = request;

    const terminalUniqueId = new UniqueEntityID(terminalId);
    const zoneUniqueId = new UniqueEntityID(zoneId);

    const terminal = await this.posTerminalsRepository.findById(
      terminalUniqueId,
      tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('POS terminal not found');
    }

    const zone = await this.zonesRepository.findById(zoneUniqueId, tenantId);

    if (!zone) {
      throw new ResourceNotFoundError('Zone not found');
    }

    const tierVO = PosZoneTier.create(tier);

    const existingLink =
      await this.posTerminalZonesRepository.findByTerminalAndZone(
        terminalUniqueId,
        zoneUniqueId,
        tenantId,
      );

    let terminalZone: PosTerminalZone;
    let wasCreated: boolean;

    if (existingLink) {
      existingLink.tier = tierVO;
      await this.posTerminalZonesRepository.save(existingLink);
      terminalZone = existingLink;
      wasCreated = false;
    } else {
      terminalZone = PosTerminalZone.create({
        terminalId: terminalUniqueId,
        zoneId: zoneUniqueId,
        tier: tierVO,
        tenantId,
      });
      await this.posTerminalZonesRepository.create(terminalZone);
      wasCreated = true;
    }

    queueAuditLog({
      userId: assignedByUserId,
      action: 'POS_TERMINAL_ZONE_ASSIGN',
      entity: 'POS_TERMINAL_ZONE',
      entityId: terminalZone.id.toString(),
      module: 'SALES',
      description: `Assigned zone ${zoneId} to POS terminal ${terminalId} as ${tier}`,
      newData: {
        terminalId,
        zoneId,
        tier,
        assignedByUserId,
        created: wasCreated,
      },
    }).catch(() => {});

    return { terminalZone };
  }
}
