import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import type { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import type { PosTerminal } from '@/entities/sales/pos-terminal';
import type { PosTerminalZone } from '@/entities/sales/pos-terminal-zone';
import type { VariantPromotion } from '@/entities/sales/variant-promotion';
import type { Item } from '@/entities/stock/item';
import type { Product } from '@/entities/stock/product';
import type { Variant } from '@/entities/stock/variant';
import type { Zone } from '@/entities/stock/zone';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PosFiscalConfigsRepository } from '@/repositories/sales/pos-fiscal-configs-repository';
import type { PosTerminalOperatorsRepository } from '@/repositories/sales/pos-terminal-operators-repository';
import type { PosTerminalZonesRepository } from '@/repositories/sales/pos-terminal-zones-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';
import type { VariantPromotionsRepository } from '@/repositories/sales/variant-promotions-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';
import type { ProductsRepository } from '@/repositories/stock/products-repository';
import type { VariantsRepository } from '@/repositories/stock/variants-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

export interface GetCatalogDeltaRequest {
  tenantId: string;
  terminalId: string;
  /**
   * When provided, only catalog rows updated at or after `sinceDate` are
   * returned (incremental sync). When omitted, the use case performs a full
   * sync of the terminal's zone scope.
   */
  sinceDate?: Date;
}

export interface CatalogDeltaTerminalZoneLink {
  id: string;
  zoneId: string;
  tier: 'PRIMARY' | 'SECONDARY';
}

export interface GetCatalogDeltaResponse {
  /**
   * Server-side timestamp captured at the start of the use case. POS clients
   * persist this value and pass it back as `since` on the next sync — using
   * the server clock avoids the drift that comes from each terminal trusting
   * its own clock (Emporion ADR — sync timeline is server-authoritative).
   */
  currentTimestamp: Date;
  terminalZoneLinks: CatalogDeltaTerminalZoneLink[];
  zones: Zone[];
  products: Product[];
  variants: Variant[];
  items: Item[];
  promotions: VariantPromotion[];
  operators: Employee[];
  fiscalConfig: PosFiscalConfig | null;
  terminal: PosTerminal;
}

/**
 * Builds an incremental catalog snapshot for a paired POS device.
 *
 * Scope and behavior:
 *  - The terminal is identified by `terminalId` (extracted from the device
 *    pairing token by the `verifyDeviceToken` middleware). Throws
 *    `ResourceNotFoundError` if the terminal is not present in the tenant —
 *    defense-in-depth, since the middleware already rejects revoked pairings.
 *  - All catalog reads are scoped to the zones currently linked to the
 *    terminal via `pos_terminal_zones`. A terminal with no zones gets an
 *    empty payload (which is intentional — selling tools must not see items
 *    they cannot reach).
 *  - When `sinceDate` is provided, products/variants/items are filtered by
 *    `updatedAt >= sinceDate`. The promotion query ignores `sinceDate` and
 *    always ships the *currently valid* promotions for the variant set —
 *    promotion timing windows are absolute and a client that misses an
 *    activation transition would otherwise apply stale prices.
 *  - Operator metadata is shipped as `Employee` entities so the device can
 *    render "select operator" pickers; only operators currently active on
 *    the terminal are returned.
 *  - `fiscalConfig` is null when the tenant has not yet configured fiscal
 *    emission — the device is expected to fall back to non-fiscal mode.
 *
 * Used by `GET /v1/pos/catalog/delta?since=ISO`. Authentication is
 * device-token only; this use case never accepts a JWT/userId.
 */
export class GetCatalogDeltaUseCase {
  constructor(
    private readonly posTerminalsRepository: PosTerminalsRepository,
    private readonly posTerminalZonesRepository: PosTerminalZonesRepository,
    private readonly zonesRepository: ZonesRepository,
    private readonly itemsRepository: ItemsRepository,
    private readonly variantsRepository: VariantsRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly variantPromotionsRepository: VariantPromotionsRepository,
    private readonly posTerminalOperatorsRepository: PosTerminalOperatorsRepository,
    private readonly employeesRepository: EmployeesRepository,
    private readonly posFiscalConfigsRepository: PosFiscalConfigsRepository,
  ) {}

  async execute(
    request: GetCatalogDeltaRequest,
  ): Promise<GetCatalogDeltaResponse> {
    const { tenantId, terminalId, sinceDate } = request;
    const terminalUniqueId = new UniqueEntityID(terminalId);

    const currentTimestamp = new Date();

    const terminal = await this.posTerminalsRepository.findById(
      terminalUniqueId,
      tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('POS terminal not found');
    }

    const terminalZoneLinkEntities =
      await this.posTerminalZonesRepository.findByTerminalId(
        terminalUniqueId,
        tenantId,
      );

    const terminalZoneLinks = terminalZoneLinkEntities.map(
      (link: PosTerminalZone): CatalogDeltaTerminalZoneLink => ({
        id: link.id.toString(),
        zoneId: link.zoneId.toString(),
        tier: link.tier.value,
      }),
    );

    const zoneIds = terminalZoneLinks.map((link) => link.zoneId);

    if (zoneIds.length === 0) {
      // Terminal has no zones assigned — short-circuit with an empty catalog
      // payload. Operators and fiscalConfig still ship since they are not
      // zone-scoped.
      const operators = await this.loadActiveOperators(
        terminalUniqueId,
        tenantId,
      );
      const fiscalConfig =
        await this.posFiscalConfigsRepository.findByTenantId(tenantId);

      return {
        currentTimestamp,
        terminalZoneLinks,
        zones: [],
        products: [],
        variants: [],
        items: [],
        promotions: [],
        operators,
        fiscalConfig,
        terminal,
      };
    }

    const zoneUniqueIds = zoneIds.map((id) => new UniqueEntityID(id));

    const zones = await this.zonesRepository.findManyByIds(
      zoneUniqueIds,
      tenantId,
    );

    const items = await this.itemsRepository.findManyByZoneIds(
      zoneIds,
      tenantId,
      sinceDate,
    );

    const variantIdSet = new Set<string>();
    for (const item of items) {
      variantIdSet.add(item.variantId.toString());
    }
    const variantUniqueIds = Array.from(variantIdSet).map(
      (id) => new UniqueEntityID(id),
    );

    const variants = await this.variantsRepository.findManyByIds(
      variantUniqueIds,
      tenantId,
      sinceDate,
    );

    const productIdSet = new Set<string>();
    for (const variant of variants) {
      productIdSet.add(variant.productId.toString());
    }
    const productUniqueIds = Array.from(productIdSet).map(
      (id) => new UniqueEntityID(id),
    );

    const products = await this.productsRepository.findManyByIds(
      productUniqueIds,
      tenantId,
      sinceDate,
    );

    const promotions =
      await this.variantPromotionsRepository.findActiveForVariants(
        variantUniqueIds,
      );

    const operators = await this.loadActiveOperators(
      terminalUniqueId,
      tenantId,
    );

    const fiscalConfig =
      await this.posFiscalConfigsRepository.findByTenantId(tenantId);

    return {
      currentTimestamp,
      terminalZoneLinks,
      zones,
      products,
      variants,
      items,
      promotions,
      operators,
      fiscalConfig,
      terminal,
    };
  }

  private async loadActiveOperators(
    terminalUniqueId: UniqueEntityID,
    tenantId: string,
  ): Promise<Employee[]> {
    const activeOperators =
      await this.posTerminalOperatorsRepository.findActiveByTerminalId(
        terminalUniqueId,
        tenantId,
      );

    if (activeOperators.length === 0) return [];

    const employeeUniqueIds = activeOperators.map(
      (operator) => operator.employeeId,
    );
    return this.employeesRepository.findManyByIds(employeeUniqueIds, tenantId);
  }
}
