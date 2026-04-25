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

export const DEFAULT_CATALOG_FULL_PAGE_SIZE = 100;
export const MAX_CATALOG_FULL_PAGE_SIZE = 500;

export interface GetCatalogFullRequest {
  tenantId: string;
  terminalId: string;
  /**
   * Cursor returned by the previous call (the last `Item.id` of the previous
   * page). Omit on the first call. The next page returns rows with
   * `id > cursor`.
   */
  cursor?: string;
  /**
   * Page size for the items collection. Defaults to
   * `DEFAULT_CATALOG_FULL_PAGE_SIZE`. Capped at
   * `MAX_CATALOG_FULL_PAGE_SIZE` by the controller schema; the use case
   * trusts the caller to respect that cap.
   */
  limit?: number;
}

export interface CatalogFullTerminalZoneLink {
  id: string;
  zoneId: string;
  tier: 'PRIMARY' | 'SECONDARY';
}

export interface GetCatalogFullResponse {
  /**
   * Server-side timestamp captured at the start of the use case. Devices may
   * persist this value at the end of the *last* page so the next sync can
   * switch from full mode to delta mode (`since = currentTimestamp`).
   */
  currentTimestamp: Date;
  /**
   * Cursor for the next call. `null` indicates the device has reached the end
   * of the catalog and may stop paginating.
   */
  nextCursor: string | null;
  terminalZoneLinks: CatalogFullTerminalZoneLink[];
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
 * Builds a paginated, full catalog snapshot for a paired POS device.
 *
 * Used by `GET /v1/pos/catalog/full?cursor=&limit=` for two scenarios:
 *  1. Initial sync — the terminal has no local catalog yet.
 *  2. Recovery sync — the delta endpoint declined to ship because the
 *     incremental window grew unmanageable; the device re-bootstraps from
 *     scratch.
 *
 * Pagination model (cursor over `Item.id`):
 *  - The dominant collection by volume is `items`. Cursor pagination over
 *    `items.id ASC` gives a stable, monotonically advancing timeline that
 *    survives concurrent edits during sync (an item updated mid-sync stays at
 *    the same id, so it is neither skipped nor re-served).
 *  - Each page derives its `variants`, `products`, and `promotions` from the
 *    items in that page. As a result, downstream sets are not de-duplicated
 *    across pages — the device must merge by id when reconstructing local
 *    state. This is the same merge strategy the delta endpoint already
 *    requires, so no new client-side logic is introduced.
 *  - `zones`, `operators` and `fiscalConfig` are not zone- or item-paginated;
 *    they are small bounded sets and ship in full on every page so the
 *    device can render the operator picker and fiscal mode without waiting
 *    for the last page.
 *
 * Scope and validation:
 *  - The terminal is identified by `terminalId` (extracted from the device
 *    pairing token). Throws `ResourceNotFoundError` if the terminal is not
 *    present in the tenant.
 *  - All catalog reads are scoped to the zones currently linked to the
 *    terminal via `pos_terminal_zones`. A terminal with no zones gets an
 *    empty `items/variants/products/promotions` payload and `nextCursor: null`.
 *  - This use case never accepts a JWT/userId — authentication is exclusively
 *    by device token at the controller layer.
 */
export class GetCatalogFullUseCase {
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
    request: GetCatalogFullRequest,
  ): Promise<GetCatalogFullResponse> {
    const { tenantId, terminalId, cursor } = request;
    const limit = this.normalizeLimit(request.limit);
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
      (link: PosTerminalZone): CatalogFullTerminalZoneLink => ({
        id: link.id.toString(),
        zoneId: link.zoneId.toString(),
        tier: link.tier.value,
      }),
    );

    const zoneIds = terminalZoneLinks.map((link) => link.zoneId);

    const operators = await this.loadActiveOperators(
      terminalUniqueId,
      tenantId,
    );

    const fiscalConfig =
      await this.posFiscalConfigsRepository.findByTenantId(tenantId);

    if (zoneIds.length === 0) {
      // Terminal has no zones assigned — short-circuit with an empty catalog
      // payload. Operators and fiscalConfig still ship since they are not
      // zone-scoped; nextCursor must be null so the device knows pagination
      // is exhausted.
      return {
        currentTimestamp,
        nextCursor: null,
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

    const { items, nextCursor } =
      await this.itemsRepository.findManyByZoneIdsPaginated(zoneIds, tenantId, {
        cursor,
        limit,
      });

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
    );

    const promotions =
      await this.variantPromotionsRepository.findActiveForVariants(
        variantUniqueIds,
      );

    return {
      currentTimestamp,
      nextCursor,
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

  private normalizeLimit(rawLimit: number | undefined): number {
    if (rawLimit === undefined) return DEFAULT_CATALOG_FULL_PAGE_SIZE;
    if (rawLimit < 1) return DEFAULT_CATALOG_FULL_PAGE_SIZE;
    if (rawLimit > MAX_CATALOG_FULL_PAGE_SIZE)
      return MAX_CATALOG_FULL_PAGE_SIZE;
    return rawLimit;
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
