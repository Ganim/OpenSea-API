import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import { PosTerminalOperator } from '@/entities/sales/pos-terminal-operator';
import { PosTerminalZone } from '@/entities/sales/pos-terminal-zone';
import { PosFiscalDocumentType } from '@/entities/sales/value-objects/pos-fiscal-document-type';
import { PosFiscalEmissionMode } from '@/entities/sales/value-objects/pos-fiscal-emission-mode';
import { PosZoneTier } from '@/entities/sales/value-objects/pos-zone-tier';
import { VariantPromotion } from '@/entities/sales/variant-promotion';
import { DiscountType } from '@/entities/sales/value-objects/discount-type';
import { Item } from '@/entities/stock/item';
import { Product } from '@/entities/stock/product';
import { Slug } from '@/entities/stock/value-objects/slug';
import { Zone } from '@/entities/stock/zone';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPosFiscalConfigsRepository } from '@/repositories/sales/in-memory/in-memory-pos-fiscal-configs-repository';
import { InMemoryPosTerminalOperatorsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminal-operators-repository';
import { InMemoryPosTerminalZonesRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminal-zones-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { InMemoryVariantPromotionsRepository } from '@/repositories/sales/in-memory/in-memory-variant-promotions-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { makeEmployee } from '@/utils/tests/factories/hr/make-employee';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';
import { makeVariant } from '@/utils/tests/factories/stock/make-variant';

import { GetCatalogFullUseCase } from './get-catalog-full';

const tenantId = new UniqueEntityID().toString();

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let posTerminalZonesRepository: InMemoryPosTerminalZonesRepository;
let zonesRepository: InMemoryZonesRepository;
let itemsRepository: InMemoryItemsRepository;
let variantsRepository: InMemoryVariantsRepository;
let productsRepository: InMemoryProductsRepository;
let variantPromotionsRepository: InMemoryVariantPromotionsRepository;
let posTerminalOperatorsRepository: InMemoryPosTerminalOperatorsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let posFiscalConfigsRepository: InMemoryPosFiscalConfigsRepository;
let sut: GetCatalogFullUseCase;

function buildZone(
  override: {
    tenantId?: string;
    warehouseId?: UniqueEntityID;
    code?: string;
  } = {},
): Zone {
  return Zone.create({
    tenantId: new UniqueEntityID(override.tenantId ?? tenantId),
    warehouseId: override.warehouseId ?? new UniqueEntityID(),
    code: override.code ?? 'Z01',
    name: 'Test Zone',
    description: null,
    structure: ZoneStructure.empty(),
    layout: null,
  });
}

function buildProduct(override: { tenantId?: string } = {}): Product {
  return Product.create({
    tenantId: new UniqueEntityID(override.tenantId ?? tenantId),
    name: 'Test Product',
    slug: Slug.createFromText(`product-${new UniqueEntityID().toString()}`),
    fullCode: `001.001.${Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, '0')}`,
    barcode: `BC${new UniqueEntityID().toString().slice(0, 8)}`,
    eanCode: `E${Math.floor(Math.random() * 1e12)
      .toString()
      .padStart(12, '0')}`,
    upcCode: `U${Math.floor(Math.random() * 1e11)
      .toString()
      .padStart(11, '0')}`,
    templateId: new UniqueEntityID(),
  });
}

function buildItem(args: {
  variantId: UniqueEntityID;
  binId: UniqueEntityID;
  tenantIdOverride?: string;
}): Item {
  return Item.create({
    tenantId: new UniqueEntityID(args.tenantIdOverride ?? tenantId),
    slug: Slug.createFromText(`item-${new UniqueEntityID().toString()}`),
    fullCode: `001.001.0001.001-${Math.floor(Math.random() * 99999)
      .toString()
      .padStart(5, '0')}`,
    barcode: `IB${new UniqueEntityID().toString().slice(0, 8)}`,
    eanCode: `IE${Math.floor(Math.random() * 1e11)
      .toString()
      .padStart(11, '0')}`,
    upcCode: `IU${Math.floor(Math.random() * 1e10)
      .toString()
      .padStart(10, '0')}`,
    variantId: args.variantId,
    binId: args.binId,
    initialQuantity: 10,
    currentQuantity: 10,
    entryDate: new Date(),
  });
}

function registerBinInZone(
  binId: UniqueEntityID,
  zoneId: UniqueEntityID,
): void {
  itemsRepository.relatedData.bins.set(binId.toString(), {
    address: 'A1',
    zoneId: zoneId.toString(),
  });
}

describe('Get Catalog Full Use Case', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    posTerminalZonesRepository = new InMemoryPosTerminalZonesRepository();
    zonesRepository = new InMemoryZonesRepository();
    itemsRepository = new InMemoryItemsRepository();
    variantsRepository = new InMemoryVariantsRepository();
    productsRepository = new InMemoryProductsRepository();
    variantPromotionsRepository = new InMemoryVariantPromotionsRepository();
    posTerminalOperatorsRepository =
      new InMemoryPosTerminalOperatorsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    posFiscalConfigsRepository = new InMemoryPosFiscalConfigsRepository();

    sut = new GetCatalogFullUseCase(
      posTerminalsRepository,
      posTerminalZonesRepository,
      zonesRepository,
      itemsRepository,
      variantsRepository,
      productsRepository,
      variantPromotionsRepository,
      posTerminalOperatorsRepository,
      employeesRepository,
      posFiscalConfigsRepository,
    );
  });

  it('throws ResourceNotFoundError when terminal does not exist in tenant', async () => {
    const missingTerminalId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        terminalId: missingTerminalId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('returns empty catalog payload with nextCursor null when terminal has no zones assigned', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const response = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
    });

    expect(response.terminalZoneLinks).toEqual([]);
    expect(response.zones).toEqual([]);
    expect(response.items).toEqual([]);
    expect(response.variants).toEqual([]);
    expect(response.products).toEqual([]);
    expect(response.promotions).toEqual([]);
    expect(response.fiscalConfig).toBeNull();
    expect(response.nextCursor).toBeNull();
  });

  it('returns the full first page in a single response and sets nextCursor to null when all items fit', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const zone = buildZone();
    zonesRepository.zones.push(zone);
    posTerminalZonesRepository.items.push(
      PosTerminalZone.create({
        terminalId: terminal.id,
        zoneId: zone.zoneId,
        tier: PosZoneTier.PRIMARY(),
        tenantId,
      }),
    );

    const product = buildProduct();
    productsRepository.items.push(product);

    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      productId: product.id.toString(),
    });
    variantsRepository.items.push(variant);

    const bin = new UniqueEntityID();
    registerBinInZone(bin, zone.zoneId);

    const item = buildItem({ variantId: variant.id, binId: bin });
    itemsRepository.items.push(item);

    // promotion currently active for the variant
    const promotion = VariantPromotion.create({
      variantId: variant.id,
      name: 'Black Friday',
      discountType: DiscountType.create('PERCENTAGE'),
      discountValue: 10,
      startDate: new Date(Date.now() - 86_400_000),
      endDate: new Date(Date.now() + 86_400_000),
      isActive: true,
    });
    variantPromotionsRepository.items.push(promotion);

    // active operator
    const employee = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
    });
    employeesRepository.items.push(employee);
    posTerminalOperatorsRepository.items.push(
      PosTerminalOperator.create({
        terminalId: terminal.id,
        employeeId: employee.id,
        tenantId,
        assignedByUserId: new UniqueEntityID(),
      }),
    );

    // fiscal config
    const fiscalConfig = PosFiscalConfig.create({
      tenantId,
      enabledDocumentTypes: [PosFiscalDocumentType.create('NFC_E')],
      defaultDocumentType: PosFiscalDocumentType.create('NFC_E'),
      emissionMode: PosFiscalEmissionMode.create('ONLINE_SYNC'),
      certificatePath: null,
      nfceSeries: 1,
      nfceNextNumber: 1,
      satDeviceId: null,
    });
    await posFiscalConfigsRepository.upsert(fiscalConfig);

    const response = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      limit: 100,
    });

    expect(response.items.map((i) => i.id.toString())).toEqual([
      item.id.toString(),
    ]);
    expect(response.variants.map((v) => v.id.toString())).toEqual([
      variant.id.toString(),
    ]);
    expect(response.products.map((p) => p.id.toString())).toEqual([
      product.id.toString(),
    ]);
    expect(response.promotions.map((p) => p.id.toString())).toEqual([
      promotion.id.toString(),
    ]);
    expect(response.operators.map((o) => o.id.toString())).toEqual([
      employee.id.toString(),
    ]);
    expect(response.fiscalConfig?.tenantId).toBe(tenantId);
    expect(response.nextCursor).toBeNull();
  });

  it('paginates items across multiple pages — first page nextCursor is non-null and second page continues from it', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const zone = buildZone();
    zonesRepository.zones.push(zone);
    posTerminalZonesRepository.items.push(
      PosTerminalZone.create({
        terminalId: terminal.id,
        zoneId: zone.zoneId,
        tier: PosZoneTier.PRIMARY(),
        tenantId,
      }),
    );

    const product = buildProduct();
    productsRepository.items.push(product);

    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      productId: product.id.toString(),
    });
    variantsRepository.items.push(variant);

    const bin = new UniqueEntityID();
    registerBinInZone(bin, zone.zoneId);

    // 5 items in scope, page size 2 → expect 3 pages: [2, 2, 1]
    const items = [
      buildItem({ variantId: variant.id, binId: bin }),
      buildItem({ variantId: variant.id, binId: bin }),
      buildItem({ variantId: variant.id, binId: bin }),
      buildItem({ variantId: variant.id, binId: bin }),
      buildItem({ variantId: variant.id, binId: bin }),
    ];
    itemsRepository.items.push(...items);

    const sortedIds = items
      .map((item) => item.id.toString())
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const firstPage = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      limit: 2,
    });

    expect(firstPage.items.map((i) => i.id.toString())).toEqual(
      sortedIds.slice(0, 2),
    );
    expect(firstPage.nextCursor).toBe(sortedIds[1]);

    const secondPage = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      cursor: firstPage.nextCursor ?? undefined,
      limit: 2,
    });

    expect(secondPage.items.map((i) => i.id.toString())).toEqual(
      sortedIds.slice(2, 4),
    );
    expect(secondPage.nextCursor).toBe(sortedIds[3]);

    const thirdPage = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      cursor: secondPage.nextCursor ?? undefined,
      limit: 2,
    });

    expect(thirdPage.items.map((i) => i.id.toString())).toEqual([sortedIds[4]]);
    expect(thirdPage.nextCursor).toBeNull();
  });

  it('does not include items, variants or products from zones outside the terminal scope', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const linkedZone = buildZone({ code: 'IN' });
    const unlinkedZone = buildZone({ code: 'OUT' });
    zonesRepository.zones.push(linkedZone, unlinkedZone);

    posTerminalZonesRepository.items.push(
      PosTerminalZone.create({
        terminalId: terminal.id,
        zoneId: linkedZone.zoneId,
        tier: PosZoneTier.PRIMARY(),
        tenantId,
      }),
    );

    const productInScope = buildProduct();
    const productOutOfScope = buildProduct();
    productsRepository.items.push(productInScope, productOutOfScope);

    const variantInScope = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      productId: productInScope.id.toString(),
    });
    const variantOutOfScope = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      productId: productOutOfScope.id.toString(),
    });
    variantsRepository.items.push(variantInScope, variantOutOfScope);

    const binInScope = new UniqueEntityID();
    const binOutOfScope = new UniqueEntityID();
    registerBinInZone(binInScope, linkedZone.zoneId);
    registerBinInZone(binOutOfScope, unlinkedZone.zoneId);

    itemsRepository.items.push(
      buildItem({ variantId: variantInScope.id, binId: binInScope }),
      buildItem({
        variantId: variantOutOfScope.id,
        binId: binOutOfScope,
      }),
    );

    const response = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
    });

    expect(response.zones.map((z) => z.zoneId.toString())).toEqual([
      linkedZone.zoneId.toString(),
    ]);
    expect(response.variants.map((v) => v.id.toString())).toEqual([
      variantInScope.id.toString(),
    ]);
    expect(response.products.map((p) => p.id.toString())).toEqual([
      productInScope.id.toString(),
    ]);
  });

  it('clamps an out-of-range limit to the maximum page size', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const zone = buildZone();
    zonesRepository.zones.push(zone);
    posTerminalZonesRepository.items.push(
      PosTerminalZone.create({
        terminalId: terminal.id,
        zoneId: zone.zoneId,
        tier: PosZoneTier.PRIMARY(),
        tenantId,
      }),
    );

    const product = buildProduct();
    productsRepository.items.push(product);
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      productId: product.id.toString(),
    });
    variantsRepository.items.push(variant);

    const bin = new UniqueEntityID();
    registerBinInZone(bin, zone.zoneId);

    // 600 items > MAX_CATALOG_FULL_PAGE_SIZE (500)
    const created = Array.from({ length: 600 }, () =>
      buildItem({ variantId: variant.id, binId: bin }),
    );
    itemsRepository.items.push(...created);

    const response = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      // intentionally above the cap; the use case must clamp to 500
      limit: 1000,
    });

    expect(response.items).toHaveLength(500);
    expect(response.nextCursor).not.toBeNull();
  });
});
