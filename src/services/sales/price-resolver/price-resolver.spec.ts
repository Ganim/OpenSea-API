import { describe, it, expect, beforeEach } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Campaign } from '@/entities/sales/campaign';
import { Coupon } from '@/entities/sales/coupon';
import { InMemoryCampaignsRepository } from '@/repositories/sales/in-memory/in-memory-campaigns-repository';
import { InMemoryCouponsRepository } from '@/repositories/sales/in-memory/in-memory-coupons-repository';
import { InMemoryCustomerPricesRepository } from '@/repositories/sales/in-memory/in-memory-customer-prices-repository';
import { InMemoryPriceTableItemsRepository } from '@/repositories/sales/in-memory/in-memory-price-table-items-repository';
import { InMemoryPriceTablesRepository } from '@/repositories/sales/in-memory/in-memory-price-tables-repository';

import { PriceResolver } from './price-resolver.service';

// Shared IDs
const TENANT_ID = 'tenant-001';
const VARIANT_ID = 'variant-001';
const CUSTOMER_ID = 'customer-001';
const USER_ID = 'user-001';

let customerPricesRepo: InMemoryCustomerPricesRepository;
let campaignsRepo: InMemoryCampaignsRepository;
let couponsRepo: InMemoryCouponsRepository;
let priceTablesRepo: InMemoryPriceTablesRepository;
let priceTableItemsRepo: InMemoryPriceTableItemsRepository;
let sut: PriceResolver;

async function seedDefaultTable(price = 100, costPrice?: number) {
  const table = await priceTablesRepo.create({
    tenantId: TENANT_ID,
    name: 'Tabela Padrão',
    isDefault: true,
    isActive: true,
    priority: 0,
  });

  await priceTableItemsRepo.create({
    priceTableId: table.id.toString(),
    tenantId: TENANT_ID,
    variantId: VARIANT_ID,
    price,
    minQuantity: 1,
    costPrice,
  });

  return table;
}

async function seedCustomerPrice(
  price: number,
  validFrom?: Date,
  validUntil?: Date,
) {
  await customerPricesRepo.create({
    tenantId: TENANT_ID,
    customerId: CUSTOMER_ID,
    variantId: VARIANT_ID,
    price,
    validFrom,
    validUntil,
    createdByUserId: USER_ID,
  });
}

function createActiveCampaign(
  overrides: {
    type?: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue?: number;
    maxDiscountAmount?: number;
    priority?: number;
    applicableTo?: 'ALL' | 'SPECIFIC_PRODUCTS';
    productVariantId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {},
): Campaign {
  const id = new UniqueEntityID();
  const campaign = Campaign.create(
    {
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Campanha Teste',
      type: overrides.type ?? 'PERCENTAGE',
      status: 'ACTIVE',
      discountValue: overrides.discountValue ?? 10,
      applicableTo: overrides.applicableTo ?? 'ALL',
      maxDiscountAmount: overrides.maxDiscountAmount,
      priority: overrides.priority ?? 0,
      startDate: overrides.startDate ?? new Date('2020-01-01'),
      endDate: overrides.endDate ?? new Date('2030-12-31'),
      products:
        overrides.applicableTo === 'SPECIFIC_PRODUCTS' &&
        overrides.productVariantId
          ? [
              {
                id: new UniqueEntityID(),
                campaignId: id,
                productId: new UniqueEntityID(),
                variantId: new UniqueEntityID(overrides.productVariantId),
                createdAt: new Date(),
              },
            ]
          : [],
    },
    id,
  );

  return campaign;
}

function createActiveCoupon(
  overrides: {
    code?: string;
    discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue?: number;
    maxDiscountAmount?: number;
    maxUsageTotal?: number;
    maxUsagePerCustomer?: number;
    applicableTo?: 'ALL' | 'SPECIFIC_PRODUCTS';
    productIds?: string[];
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
  } = {},
): Coupon {
  return Coupon.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    code: overrides.code ?? 'DESCONTO10',
    discountType: overrides.discountType ?? 'PERCENTAGE',
    discountValue: overrides.discountValue ?? 10,
    applicableTo: overrides.applicableTo ?? 'ALL',
    maxDiscountAmount: overrides.maxDiscountAmount,
    maxUsageTotal: overrides.maxUsageTotal,
    maxUsagePerCustomer: overrides.maxUsagePerCustomer,
    startDate: overrides.startDate ?? new Date('2020-01-01'),
    endDate: overrides.endDate ?? new Date('2030-12-31'),
    isActive: overrides.isActive ?? true,
    productIds: overrides.productIds ?? [],
  });
}

describe('PriceResolver', () => {
  beforeEach(() => {
    customerPricesRepo = new InMemoryCustomerPricesRepository();
    campaignsRepo = new InMemoryCampaignsRepository();
    couponsRepo = new InMemoryCouponsRepository();
    priceTablesRepo = new InMemoryPriceTablesRepository();
    priceTableItemsRepo = new InMemoryPriceTableItemsRepository();

    sut = new PriceResolver(
      customerPricesRepo,
      campaignsRepo,
      couponsRepo,
      priceTablesRepo,
      priceTableItemsRepo,
    );
  });

  describe('Customer-specific price (priority 1)', () => {
    it('should return customer-specific price when it exists', async () => {
      await seedDefaultTable(100);
      await seedCustomerPrice(85);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        customerId: CUSTOMER_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('CUSTOMER');
      expect(result.finalPrice).toBe(85);
      expect(result.basePrice).toBe(85);
    });

    it('should skip expired customer price and fall through', async () => {
      await seedDefaultTable(100);
      await seedCustomerPrice(
        85,
        new Date('2020-01-01'),
        new Date('2020-12-31'), // expired
      );

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        customerId: CUSTOMER_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('DEFAULT');
      expect(result.finalPrice).toBe(100);
    });

    it('should use customer price with valid date range', async () => {
      await seedDefaultTable(100);
      await seedCustomerPrice(
        75,
        new Date('2020-01-01'),
        new Date('2030-12-31'),
      );

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        customerId: CUSTOMER_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('CUSTOMER');
      expect(result.finalPrice).toBe(75);
    });
  });

  describe('Campaign discount (priority 2)', () => {
    it('should return campaign percentage discount when active', async () => {
      await seedDefaultTable(100);

      const campaign = createActiveCampaign({
        type: 'PERCENTAGE',
        discountValue: 15,
      });
      campaignsRepo.items.push(campaign);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('CAMPAIGN');
      expect(result.basePrice).toBe(100);
      expect(result.finalPrice).toBe(85);
      expect(result.discount).toBeDefined();
      expect(result.discount!.type).toBe('PERCENTAGE');
      expect(result.discount!.value).toBe(15);
      expect(result.discount!.amount).toBe(15);
      expect(result.discount!.source).toBe('CAMPAIGN');
    });

    it('should return campaign fixed discount when active', async () => {
      await seedDefaultTable(100);

      const campaign = createActiveCampaign({
        type: 'FIXED_AMOUNT',
        discountValue: 20,
      });
      campaignsRepo.items.push(campaign);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('CAMPAIGN');
      expect(result.finalPrice).toBe(80);
      expect(result.discount!.type).toBe('FIXED_VALUE');
      expect(result.discount!.amount).toBe(20);
    });

    it('should cap campaign discount when maxDiscountAmount is set', async () => {
      await seedDefaultTable(100);

      const campaign = createActiveCampaign({
        type: 'PERCENTAGE',
        discountValue: 50, // 50% = R$50
        maxDiscountAmount: 30, // capped at R$30
      });
      campaignsRepo.items.push(campaign);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      });

      expect(result.finalPrice).toBe(70); // 100 - 30
      expect(result.discount!.amount).toBe(30);
    });

    it('should skip expired campaign and fall through', async () => {
      await seedDefaultTable(100);

      const campaign = createActiveCampaign({
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-12-31'), // expired
      });
      campaignsRepo.items.push(campaign);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('DEFAULT');
    });

    it('should only apply campaign to specific products when configured', async () => {
      await seedDefaultTable(100);

      const campaign = createActiveCampaign({
        applicableTo: 'SPECIFIC_PRODUCTS',
        productVariantId: 'variant-other', // not our variant
      });
      campaignsRepo.items.push(campaign);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('DEFAULT');
    });
  });

  describe('Coupon discount (priority 3)', () => {
    it('should return coupon percentage discount when valid code provided', async () => {
      await seedDefaultTable(100);

      const coupon = createActiveCoupon({
        code: 'SUMMER10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
      });
      couponsRepo.items.push(coupon);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
        couponCode: 'SUMMER10',
      });

      expect(result.priceSource).toBe('COUPON');
      expect(result.basePrice).toBe(100);
      expect(result.finalPrice).toBe(90);
      expect(result.discount!.type).toBe('PERCENTAGE');
      expect(result.discount!.source).toBe('COUPON');
      expect(result.discount!.sourceName).toBe('SUMMER10');
    });

    it('should return coupon fixed value discount', async () => {
      await seedDefaultTable(100);

      const coupon = createActiveCoupon({
        code: 'VALE25',
        discountType: 'FIXED_AMOUNT',
        discountValue: 25,
      });
      couponsRepo.items.push(coupon);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
        couponCode: 'VALE25',
      });

      expect(result.priceSource).toBe('COUPON');
      expect(result.finalPrice).toBe(75);
      expect(result.discount!.type).toBe('FIXED_VALUE');
    });

    it('should cap coupon discount when maxDiscountAmount is set', async () => {
      await seedDefaultTable(200);

      const coupon = createActiveCoupon({
        code: 'BIG50',
        discountType: 'PERCENTAGE',
        discountValue: 50, // 50% = R$100
        maxDiscountAmount: 40, // capped at R$40
      });
      couponsRepo.items.push(coupon);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
        couponCode: 'BIG50',
      });

      expect(result.finalPrice).toBe(160); // 200 - 40
      expect(result.discount!.amount).toBe(40);
    });

    it('should skip inactive coupon', async () => {
      await seedDefaultTable(100);

      const coupon = createActiveCoupon({
        code: 'INACTIVE',
        isActive: false,
      });
      couponsRepo.items.push(coupon);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
        couponCode: 'INACTIVE',
      });

      expect(result.priceSource).toBe('DEFAULT');
    });

    it('should skip coupon not applicable to this product', async () => {
      await seedDefaultTable(100);

      const coupon = createActiveCoupon({
        code: 'SPECIFIC',
        applicableTo: 'SPECIFIC_PRODUCTS',
        productIds: ['variant-other'],
      });
      couponsRepo.items.push(coupon);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
        couponCode: 'SPECIFIC',
      });

      expect(result.priceSource).toBe('DEFAULT');
    });
  });

  describe('Quantity tier pricing (priority 4)', () => {
    it('should return quantity tier price for matching quantity', async () => {
      // Create a wholesale table with quantity tiers
      const table = await priceTablesRepo.create({
        tenantId: TENANT_ID,
        name: 'Atacado Nacional',
        type: 'WHOLESALE',
        isDefault: false,
        isActive: true,
        priority: 10,
      });

      // Tier 1: qty 1-9 = R$10
      await priceTableItemsRepo.create({
        priceTableId: table.id.toString(),
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        price: 10,
        minQuantity: 1,
        maxQuantity: 9,
      });

      // Tier 2: qty 10-49 = R$8
      await priceTableItemsRepo.create({
        priceTableId: table.id.toString(),
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        price: 8,
        minQuantity: 10,
        maxQuantity: 49,
      });

      // Tier 3: qty 50+ = R$6
      await priceTableItemsRepo.create({
        priceTableId: table.id.toString(),
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        price: 6,
        minQuantity: 50,
      });

      // Also seed a default table
      await seedDefaultTable(12);

      // Test qty 1 -> R$10
      const result1 = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      });
      expect(result1.finalPrice).toBe(10);
      expect(result1.priceSource).toBe('TABLE');
      expect(result1.priceTableName).toBe('Atacado Nacional');

      // Test qty 10 -> R$8
      const result2 = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 10,
      });
      expect(result2.finalPrice).toBe(8);
      expect(result2.priceSource).toBe('QUANTITY_TIER');

      // Test qty 50 -> R$6
      const result3 = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 50,
      });
      expect(result3.finalPrice).toBe(6);
      expect(result3.priceSource).toBe('QUANTITY_TIER');

      // Test qty 100 -> R$6 (50+ tier)
      const result4 = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 100,
      });
      expect(result4.finalPrice).toBe(6);
    });
  });

  describe('Channel-specific table pricing (priority 5)', () => {
    it('should return channel-specific table price', async () => {
      await seedDefaultTable(100);

      const channelTable = await priceTablesRepo.create({
        tenantId: TENANT_ID,
        name: 'Marketplace',
        type: 'CHANNEL',
        isDefault: false,
        isActive: true,
        priority: 5,
      });

      // Add channel rule
      priceTablesRepo.rules.push({
        id: 'rule-001',
        priceTableId: channelTable.id.toString(),
        tenantId: TENANT_ID,
        ruleType: 'CHANNEL',
        operator: 'EQUALS',
        value: 'MARKETPLACE',
        createdAt: new Date(),
      });

      await priceTableItemsRepo.create({
        priceTableId: channelTable.id.toString(),
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        price: 90,
        minQuantity: 1,
      });

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
        channel: 'MARKETPLACE',
      });

      expect(result.priceSource).toBe('TABLE');
      expect(result.finalPrice).toBe(90);
      expect(result.priceTableName).toBe('Marketplace');
    });

    it('should not match channel table when channel differs', async () => {
      await seedDefaultTable(100);

      const channelTable = await priceTablesRepo.create({
        tenantId: TENANT_ID,
        name: 'Marketplace',
        type: 'CHANNEL',
        isDefault: false,
        isActive: true,
        priority: 5,
      });

      priceTablesRepo.rules.push({
        id: 'rule-002',
        priceTableId: channelTable.id.toString(),
        tenantId: TENANT_ID,
        ruleType: 'CHANNEL',
        operator: 'EQUALS',
        value: 'MARKETPLACE',
        createdAt: new Date(),
      });

      await priceTableItemsRepo.create({
        priceTableId: channelTable.id.toString(),
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        price: 90,
        minQuantity: 1,
      });

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
        channel: 'PDV', // different channel
      });

      expect(result.priceSource).toBe('DEFAULT');
      expect(result.finalPrice).toBe(100);
    });
  });

  describe('Regional table pricing (priority 6)', () => {
    it('should return regional table price for matching state', async () => {
      await seedDefaultTable(100);

      const regionalTable = await priceTablesRepo.create({
        tenantId: TENANT_ID,
        name: 'Sudeste',
        type: 'REGIONAL',
        isDefault: false,
        isActive: true,
        priority: 3,
      });

      priceTablesRepo.rules.push({
        id: 'rule-003',
        priceTableId: regionalTable.id.toString(),
        tenantId: TENANT_ID,
        ruleType: 'REGION',
        operator: 'IN',
        value: 'SP,RJ,MG,ES',
        createdAt: new Date(),
      });

      await priceTableItemsRepo.create({
        priceTableId: regionalTable.id.toString(),
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        price: 95,
        minQuantity: 1,
      });

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
        destinationState: 'SP',
      });

      expect(result.priceSource).toBe('TABLE');
      expect(result.finalPrice).toBe(95);
      expect(result.priceTableName).toBe('Sudeste');
    });
  });

  describe('Default table pricing (fallback)', () => {
    it('should return default table price as last resort', async () => {
      await seedDefaultTable(100);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('DEFAULT');
      expect(result.finalPrice).toBe(100);
      expect(result.basePrice).toBe(100);
    });
  });

  describe('Priority cascade', () => {
    it('customer price should win over campaign', async () => {
      await seedDefaultTable(100);
      await seedCustomerPrice(85);

      const campaign = createActiveCampaign({
        type: 'PERCENTAGE',
        discountValue: 20,
      });
      campaignsRepo.items.push(campaign);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        customerId: CUSTOMER_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('CUSTOMER');
      expect(result.finalPrice).toBe(85);
    });

    it('campaign should win over coupon', async () => {
      await seedDefaultTable(100);

      const campaign = createActiveCampaign({
        type: 'PERCENTAGE',
        discountValue: 15,
      });
      campaignsRepo.items.push(campaign);

      const coupon = createActiveCoupon({
        code: 'COUPON20',
        discountType: 'PERCENTAGE',
        discountValue: 20, // better discount, but lower priority
      });
      couponsRepo.items.push(coupon);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
        couponCode: 'COUPON20',
      });

      expect(result.priceSource).toBe('CAMPAIGN');
      expect(result.finalPrice).toBe(85); // campaign 15% off, not coupon 20% off
    });

    it('coupon should win over price table', async () => {
      await seedDefaultTable(100);

      // A non-default table with higher priority
      const table = await priceTablesRepo.create({
        tenantId: TENANT_ID,
        name: 'Wholesale',
        type: 'WHOLESALE',
        isDefault: false,
        isActive: true,
        priority: 10,
      });

      await priceTableItemsRepo.create({
        priceTableId: table.id.toString(),
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        price: 80,
        minQuantity: 1,
      });

      const coupon = createActiveCoupon({
        code: 'DEAL25',
        discountType: 'PERCENTAGE',
        discountValue: 25,
      });
      couponsRepo.items.push(coupon);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
        couponCode: 'DEAL25',
      });

      expect(result.priceSource).toBe('COUPON');
      expect(result.finalPrice).toBe(75); // 100 - 25%
    });
  });

  describe('Error handling', () => {
    it('should throw when no price configured at all', async () => {
      await expect(
        sut.resolve({
          tenantId: TENANT_ID,
          variantId: VARIANT_ID,
          quantity: 1,
        }),
      ).rejects.toThrow('No price configured for this product');
    });

    it('should throw when variant not found in any table', async () => {
      // Create default table but without the variant
      await priceTablesRepo.create({
        tenantId: TENANT_ID,
        name: 'Tabela Padrão',
        isDefault: true,
        isActive: true,
      });

      await expect(
        sut.resolve({
          tenantId: TENANT_ID,
          variantId: VARIANT_ID,
          quantity: 1,
        }),
      ).rejects.toThrow('No price configured for this product');
    });
  });

  describe('Margin calculation', () => {
    it('should calculate margin when costPrice is available', async () => {
      await seedDefaultTable(100, 60); // price=100, costPrice=60

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('DEFAULT');
      expect(result.margin).toBeDefined();
      expect(result.margin!.costPrice).toBe(60);
      expect(result.margin!.marginValue).toBe(40);
      expect(result.margin!.marginPercent).toBeCloseTo(66.67, 1);
    });

    it('should not include margin when costPrice is not available', async () => {
      await seedDefaultTable(100); // no costPrice

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      });

      expect(result.margin).toBeUndefined();
    });

    it('should calculate margin for non-default table items', async () => {
      await seedDefaultTable(100);

      const table = await priceTablesRepo.create({
        tenantId: TENANT_ID,
        name: 'Wholesale',
        type: 'WHOLESALE',
        isDefault: false,
        isActive: true,
        priority: 10,
      });

      await priceTableItemsRepo.create({
        priceTableId: table.id.toString(),
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        price: 80,
        minQuantity: 1,
        costPrice: 50,
      });

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('TABLE');
      expect(result.margin).toBeDefined();
      expect(result.margin!.costPrice).toBe(50);
      expect(result.margin!.marginValue).toBe(30);
      expect(result.margin!.marginPercent).toBe(60);
    });
  });

  describe('Price source tracking', () => {
    it('should return CUSTOMER source for negotiated price', async () => {
      await seedDefaultTable(100);
      await seedCustomerPrice(85);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        customerId: CUSTOMER_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('CUSTOMER');
    });

    it('should return CAMPAIGN source for campaign discount', async () => {
      await seedDefaultTable(100);
      campaignsRepo.items.push(createActiveCampaign());

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('CAMPAIGN');
    });

    it('should return COUPON source for coupon discount', async () => {
      await seedDefaultTable(100);
      couponsRepo.items.push(createActiveCoupon({ code: 'TEST' }));

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
        couponCode: 'TEST',
      });

      expect(result.priceSource).toBe('COUPON');
    });

    it('should return QUANTITY_TIER source for quantity-based pricing', async () => {
      await seedDefaultTable(100);

      const table = await priceTablesRepo.create({
        tenantId: TENANT_ID,
        name: 'Volume Discount',
        isDefault: false,
        isActive: true,
        priority: 5,
      });

      await priceTableItemsRepo.create({
        priceTableId: table.id.toString(),
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        price: 8,
        minQuantity: 10,
        maxQuantity: 49,
      });

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 10,
      });

      expect(result.priceSource).toBe('QUANTITY_TIER');
    });

    it('should return TABLE source for non-default table match', async () => {
      await seedDefaultTable(100);

      const table = await priceTablesRepo.create({
        tenantId: TENANT_ID,
        name: 'Custom Table',
        isDefault: false,
        isActive: true,
        priority: 5,
      });

      await priceTableItemsRepo.create({
        priceTableId: table.id.toString(),
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        price: 90,
        minQuantity: 1,
      });

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('TABLE');
    });

    it('should return DEFAULT source for fallback table', async () => {
      await seedDefaultTable(100);

      const result = await sut.resolve({
        tenantId: TENANT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      });

      expect(result.priceSource).toBe('DEFAULT');
    });
  });
});
