import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminalZonesRepository } from '@/repositories/sales/pos-terminal-zones-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

export interface ListTerminalZonesRequest {
  tenantId: string;
  terminalId: string;
}

export interface TerminalZoneEnrichedRow {
  id: string;
  terminalId: string;
  zoneId: string;
  tier: 'PRIMARY' | 'SECONDARY';
  tenantId: string;
  createdAt: string;
  updatedAt: string | null;
  zone: {
    id: string;
    code: string;
    name: string;
    allowsFractionalSale: boolean;
    warehouseId: string;
    warehouseName: string;
  };
}

export interface ListTerminalZonesResponse {
  zones: TerminalZoneEnrichedRow[];
}

/**
 * Lists the zones assigned to a POS terminal, enriched with the Zone metadata
 * (`code`, `name`, `allowsFractionalSale`) and the parent warehouse name.
 *
 * Used by the RP web frontend (Plan B F-02) to render the Zones tab of the POS
 * terminal configure page without N+1 queries.
 *
 * Returns `ResourceNotFoundError` when the terminal does not exist within the
 * tenant. Empty links yield an empty `zones` array (200, not 404).
 */
export class ListTerminalZonesUseCase {
  constructor(
    private posTerminalsRepository: PosTerminalsRepository,
    private posTerminalZonesRepository: PosTerminalZonesRepository,
    private zonesRepository: ZonesRepository,
    private warehousesRepository: WarehousesRepository,
  ) {}

  async execute(
    request: ListTerminalZonesRequest,
  ): Promise<ListTerminalZonesResponse> {
    const { tenantId, terminalId } = request;

    const terminal = await this.posTerminalsRepository.findById(
      new UniqueEntityID(terminalId),
      tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('Terminal not found.');
    }

    const links = await this.posTerminalZonesRepository.findByTerminalId(
      new UniqueEntityID(terminalId),
      tenantId,
    );

    if (links.length === 0) {
      return { zones: [] };
    }

    const uniqueZoneIds = Array.from(
      new Set(links.map((link) => link.zoneId.toString())),
    );

    const zones = await this.zonesRepository.findManyByIds(
      uniqueZoneIds.map((id) => new UniqueEntityID(id)),
      tenantId,
    );

    const zoneById = new Map(
      zones.map((zone) => [zone.zoneId.toString(), zone]),
    );

    const uniqueWarehouseIds = Array.from(
      new Set(zones.map((zone) => zone.warehouseId.toString())),
    );

    const warehouses = await this.warehousesRepository.findManyByIds(
      uniqueWarehouseIds.map((id) => new UniqueEntityID(id)),
      tenantId,
    );

    const warehouseNameById = new Map(
      warehouses.map((w) => [w.warehouseId.toString(), w.name]),
    );

    const enriched: TerminalZoneEnrichedRow[] = links.flatMap((link) => {
      const zone = zoneById.get(link.zoneId.toString());
      if (!zone) return [];

      return [
        {
          id: link.id.toString(),
          terminalId: link.terminalId.toString(),
          zoneId: link.zoneId.toString(),
          tier: link.tier.value,
          tenantId: link.tenantId,
          createdAt: link.createdAt.toISOString(),
          updatedAt: link.updatedAt?.toISOString() ?? null,
          zone: {
            id: zone.zoneId.toString(),
            code: zone.code,
            name: zone.name,
            allowsFractionalSale: zone.allowsFractionalSale,
            warehouseId: zone.warehouseId.toString(),
            warehouseName:
              warehouseNameById.get(zone.warehouseId.toString()) ?? '',
          },
        },
      ];
    });

    return { zones: enriched };
  }
}
