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

import { GetCatalogDeltaUseCase } from './get-catalog-delta';

const tenantId = new UniqueEntityID().toString();
const otherTenantId = new UniqueEntityID().toString();

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
let sut: GetCatalogDeltaUseCase;

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

function buildProduct(
  override: { tenantId?: string; updatedAt?: Date; createdAt?: Date } = {},
): Product {
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
    createdAt: override.createdAt ?? new Date(),
    updatedAt: override.updatedAt,
  });
}

function buildItem(args: {
  variantId: UniqueEntityID;
  binId: UniqueEntityID;
  tenantIdOverride?: string;
  updatedAt?: Date;
  createdAt?: Date;
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
    createdAt: args.createdAt ?? new Date(),
    updatedAt: args.updatedAt,
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

describe('Get Catalog Delta Use Case', () => {
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

    sut = new GetCatalogDeltaUseCase(
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

  it('returns empty catalog payload when terminal has no zones assigned', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const beforeCall = new Date();
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
    expect(response.operators).toEqual([]);
    expect(response.fiscalConfig).toBeNull();
    expect(response.terminal.id.toString()).toBe(terminal.id.toString());
    expect(response.currentTimestamp.getTime()).toBeGreaterThanOrEqual(
      beforeCall.getTime(),
    );
  });

  it('returns full sync covering zones, items, variants, products, promotions, operators and fiscal config', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const zoneA = buildZone({ code: 'ZA' });
    const zoneB = buildZone({ code: 'ZB' });
    zonesRepository.zones.push(zoneA, zoneB);

    posTerminalZonesRepository.items.push(
      PosTerminalZone.create({
        terminalId: terminal.id,
        zoneId: zoneA.zoneId,
        tier: PosZoneTier.PRIMARY(),
        tenantId,
      }),
      PosTerminalZone.create({
        terminalId: terminal.id,
        zoneId: zoneB.zoneId,
        tier: PosZoneTier.SECONDARY(),
        tenantId,
      }),
    );

    const product = buildProduct();
    productsRepository.items.push(product);

    const variantInZoneA = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      productId: product.id.toString(),
    });
    variantsRepository.items.push(variantInZoneA);

    const binInZoneA = new UniqueEntityID();
    registerBinInZone(binInZoneA, zoneA.zoneId);

    const itemInZoneA = buildItem({
      variantId: variantInZoneA.id,
      binId: binInZoneA,
    });
    itemsRepository.items.push(itemInZoneA);

    // promotion currently valid for the variant in scope
    const activePromotion = VariantPromotion.create({
      variantId: variantInZoneA.id,
      name: 'Black Friday',
      discountType: DiscountType.create('PERCENTAGE'),
      discountValue: 10,
      startDate: new Date(Date.now() - 86_400_000),
      endDate: new Date(Date.now() + 86_400_000),
      isActive: true,
    });
    variantPromotionsRepository.items.push(activePromotion);

    // employee assigned as active operator
    const employee = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      fullName: 'Operator Alpha',
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
    });

    expect(response.terminalZoneLinks).toHaveLength(2);
    expect(response.zones.map((z) => z.zoneId.toString()).sort()).toEqual(
      [zoneA.zoneId.toString(), zoneB.zoneId.toString()].sort(),
    );
    expect(response.items.map((i) => i.id.toString())).toEqual([
      itemInZoneA.id.toString(),
    ]);
    expect(response.variants.map((v) => v.id.toString())).toEqual([
      variantInZoneA.id.toString(),
    ]);
    expect(response.products.map((p) => p.id.toString())).toEqual([
      product.id.toString(),
    ]);
    expect(response.promotions.map((p) => p.id.toString())).toEqual([
      activePromotion.id.toString(),
    ]);
    expect(response.operators.map((o) => o.id.toString())).toEqual([
      employee.id.toString(),
    ]);
    expect(response.fiscalConfig?.tenantId).toBe(tenantId);

    const primaryLink = response.terminalZoneLinks.find(
      (link) => link.zoneId === zoneA.zoneId.toString(),
    );
    expect(primaryLink?.tier).toBe('PRIMARY');
  });

  it('filters items by sinceDate and propagates the filter to variants/products', async () => {
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

    const oldProduct = buildProduct({
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });
    const freshProduct = buildProduct({
      createdAt: new Date('2026-04-22T00:00:00Z'),
      updatedAt: new Date('2026-04-22T00:00:00Z'),
    });
    productsRepository.items.push(oldProduct, freshProduct);

    const oldVariant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      productId: oldProduct.id.toString(),
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });
    const freshVariant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      productId: freshProduct.id.toString(),
      createdAt: new Date('2026-04-22T00:00:00Z'),
      updatedAt: new Date('2026-04-22T00:00:00Z'),
    });
    variantsRepository.items.push(oldVariant, freshVariant);

    const binId = new UniqueEntityID();
    registerBinInZone(binId, zone.zoneId);

    const oldItem = buildItem({
      variantId: oldVariant.id,
      binId,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });
    const freshItem = buildItem({
      variantId: freshVariant.id,
      binId,
      createdAt: new Date('2026-04-22T00:00:00Z'),
      updatedAt: new Date('2026-04-22T00:00:00Z'),
    });
    itemsRepository.items.push(oldItem, freshItem);

    const sinceDate = new Date('2026-04-01T00:00:00Z');

    const response = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      sinceDate,
    });

    expect(response.items.map((i) => i.id.toString())).toEqual([
      freshItem.id.toString(),
    ]);
    expect(response.variants.map((v) => v.id.toString())).toEqual([
      freshVariant.id.toString(),
    ]);
    expect(response.products.map((p) => p.id.toString())).toEqual([
      freshProduct.id.toString(),
    ]);
  });

  it('does not include items, zones or variants from zones outside the terminal scope', async () => {
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
      buildItem({ variantId: variantOutOfScope.id, binId: binOutOfScope }),
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

  it('skips revoked operators and operators from other tenants', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const activeEmployee = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
    });
    const revokedEmployee = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
    });
    const otherTenantEmployee = makeEmployee({
      tenantId: new UniqueEntityID(otherTenantId),
    });
    employeesRepository.items.push(
      activeEmployee,
      revokedEmployee,
      otherTenantEmployee,
    );

    const adminUserId = new UniqueEntityID();

    const activeAssignment = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: activeEmployee.id,
      tenantId,
      assignedByUserId: adminUserId,
    });
    const revokedAssignment = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: revokedEmployee.id,
      tenantId,
      assignedByUserId: adminUserId,
    });
    revokedAssignment.revoke(adminUserId);

    const otherTenantAssignment = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: otherTenantEmployee.id,
      tenantId: otherTenantId,
      assignedByUserId: adminUserId,
    });

    posTerminalOperatorsRepository.items.push(
      activeAssignment,
      revokedAssignment,
      otherTenantAssignment,
    );

    const response = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
    });

    expect(response.operators.map((o) => o.id.toString())).toEqual([
      activeEmployee.id.toString(),
    ]);
  });
});
