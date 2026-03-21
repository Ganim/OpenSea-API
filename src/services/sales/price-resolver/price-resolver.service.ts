import type { CampaignsRepository } from '@/repositories/sales/campaigns-repository';
import type { CouponsRepository } from '@/repositories/sales/coupons-repository';
import type { CustomerPricesRepository } from '@/repositories/sales/customer-prices-repository';
import type { PriceTableItemsRepository } from '@/repositories/sales/price-table-items-repository';
import type {
  PriceTablesRepository,
  PriceTableRuleData,
  PriceTableWithRules,
} from '@/repositories/sales/price-tables-repository';
import type {
  PriceResolverInput,
  PriceResolverOutput,
  PriceResolverService,
} from './price-resolver.interface';

export class PriceResolver implements PriceResolverService {
  constructor(
    private customerPricesRepository: CustomerPricesRepository,
    private campaignsRepository: CampaignsRepository,
    private couponsRepository: CouponsRepository,
    private priceTablesRepository: PriceTablesRepository,
    private priceTableItemsRepository: PriceTableItemsRepository,
  ) {}

  async resolve(input: PriceResolverInput): Promise<PriceResolverOutput> {
    const now = new Date();

    // 1. Customer-specific price (highest priority)
    if (input.customerId) {
      const customerPrice =
        await this.customerPricesRepository.findByCustomerAndVariant(
          input.customerId,
          input.variantId,
          input.tenantId,
        );

      if (customerPrice && this.isCustomerPriceValid(customerPrice, now)) {
        const basePrice = customerPrice.price;
        return this.buildOutput(basePrice, basePrice, 'CUSTOMER');
      }
    }

    // We need the base price (from default table) for discount calculations
    const basePrice = await this.getBasePrice(input);

    // 2. Active campaign discount
    const campaignResult = await this.resolveCampaign(
      input,
      basePrice,
      now,
    );
    if (campaignResult) {
      return campaignResult;
    }

    // 3. Coupon discount
    if (input.couponCode) {
      const couponResult = await this.resolveCoupon(
        input,
        basePrice,
        now,
      );
      if (couponResult) {
        return couponResult;
      }
    }

    // 4-7. Price tables by priority (quantity tier, customer type, channel, regional)
    const tableResult = await this.resolvePriceTable(input, now);
    if (tableResult) {
      return tableResult;
    }

    // 8. Default price table (fallback)
    const defaultTable = await this.priceTablesRepository.findDefault(
      input.tenantId,
    );

    if (defaultTable) {
      const item = await this.priceTableItemsRepository.findBestForVariantInTable(
        defaultTable.id.toString(),
        input.variantId,
        input.quantity,
      );

      if (item) {
        const result = this.buildOutput(
          item.price,
          item.price,
          'DEFAULT',
          defaultTable.id.toString(),
          defaultTable.name,
        );

        if (item.costPrice !== undefined) {
          result.margin = this.calculateMargin(item.price, item.costPrice);
        }

        return result;
      }
    }

    throw new Error('No price configured for this product');
  }

  private isCustomerPriceValid(
    cp: { validFrom?: Date; validUntil?: Date },
    now: Date,
  ): boolean {
    if (cp.validFrom && cp.validFrom > now) return false;
    if (cp.validUntil && cp.validUntil < now) return false;
    return true;
  }

  private async getBasePrice(input: PriceResolverInput): Promise<number> {
    const defaultTable = await this.priceTablesRepository.findDefault(
      input.tenantId,
    );

    if (!defaultTable) return 0;

    const item = await this.priceTableItemsRepository.findBestForVariantInTable(
      defaultTable.id.toString(),
      input.variantId,
      input.quantity,
    );

    return item?.price ?? 0;
  }

  private async resolveCampaign(
    input: PriceResolverInput,
    basePrice: number,
    now: Date,
  ): Promise<PriceResolverOutput | null> {
    const campaigns = await this.campaignsRepository.findActive(
      input.tenantId,
    );

    // Sort by priority DESC
    const sorted = [...campaigns].sort((a, b) => b.priority - a.priority);

    for (const campaign of sorted) {
      // Check date range
      if (campaign.startDate && campaign.startDate > now) continue;
      if (campaign.endDate && campaign.endDate < now) continue;

      // Check max usage
      if (
        campaign.maxUsageTotal !== undefined &&
        campaign.currentUsageTotal >= campaign.maxUsageTotal
      )
        continue;

      // Check if variant is applicable
      const isApplicable = this.isCampaignApplicableToVariant(
        campaign,
        input.variantId,
      );
      if (!isApplicable) continue;

      // Calculate discount
      if (
        campaign.type === 'PERCENTAGE' ||
        campaign.type === 'FIXED_AMOUNT'
      ) {
        const discountAmount =
          campaign.type === 'PERCENTAGE'
            ? basePrice * (campaign.discountValue / 100)
            : campaign.discountValue;

        const cappedDiscount =
          campaign.maxDiscountAmount !== undefined
            ? Math.min(discountAmount, campaign.maxDiscountAmount)
            : discountAmount;

        const finalPrice = Math.max(0, basePrice - cappedDiscount);

        return {
          basePrice,
          finalPrice,
          priceSource: 'CAMPAIGN',
          discount: {
            type:
              campaign.type === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED_VALUE',
            value: campaign.discountValue,
            amount: cappedDiscount,
            source: 'CAMPAIGN',
            sourceId: campaign.campaignId.toString(),
            sourceName: campaign.name,
          },
        };
      }
    }

    return null;
  }

  private isCampaignApplicableToVariant(
    campaign: {
      applicableTo: string;
      products: Array<{ variantId?: { toString(): string } }>;
    },
    variantId: string,
  ): boolean {
    if (campaign.applicableTo === 'ALL') return true;

    if (campaign.applicableTo === 'SPECIFIC_PRODUCTS') {
      return campaign.products.some(
        (p) => p.variantId?.toString() === variantId,
      );
    }

    return false;
  }

  private async resolveCoupon(
    input: PriceResolverInput,
    basePrice: number,
    now: Date,
  ): Promise<PriceResolverOutput | null> {
    if (!input.couponCode) return null;

    const coupon = await this.couponsRepository.findByCode(
      input.couponCode,
      input.tenantId,
    );

    if (!coupon) return null;
    if (!coupon.isActive) return null;
    if (coupon.startDate && coupon.startDate > now) return null;
    if (coupon.endDate && coupon.endDate < now) return null;

    // Check usage limits
    if (
      coupon.maxUsageTotal !== undefined &&
      coupon.currentUsageTotal >= coupon.maxUsageTotal
    )
      return null;

    // Check per-customer usage
    if (input.customerId && coupon.maxUsagePerCustomer !== undefined) {
      const customerUsages = coupon.getUsageCountForCustomer(input.customerId);
      if (customerUsages >= coupon.maxUsagePerCustomer) return null;
    }

    // Check applicability
    if (coupon.applicableTo === 'SPECIFIC_PRODUCTS') {
      if (!coupon.productIds.includes(input.variantId)) return null;
    }

    // Calculate discount
    if (coupon.discountType === 'FREE_SHIPPING') return null;

    const discountAmount =
      coupon.discountType === 'PERCENTAGE'
        ? basePrice * (coupon.discountValue / 100)
        : coupon.discountValue;

    const cappedDiscount =
      coupon.maxDiscountAmount !== undefined
        ? Math.min(discountAmount, coupon.maxDiscountAmount)
        : discountAmount;

    const finalPrice = Math.max(0, basePrice - cappedDiscount);

    return {
      basePrice,
      finalPrice,
      priceSource: 'COUPON',
      discount: {
        type: coupon.discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED_VALUE',
        value: coupon.discountValue,
        amount: cappedDiscount,
        source: 'COUPON',
        sourceId: coupon.couponId.toString(),
        sourceName: coupon.code,
      },
    };
  }

  private async resolvePriceTable(
    input: PriceResolverInput,
    now: Date,
  ): Promise<PriceResolverOutput | null> {
    const tablesWithRules =
      await this.priceTablesRepository.findActiveWithRulesByTenant(
        input.tenantId,
      );

    // Tables are already sorted by priority DESC from the repository
    for (const { table, rules } of tablesWithRules) {
      // Skip default table (handled as fallback)
      if (table.isDefault) continue;

      // Check validity period
      if (table.validFrom && table.validFrom > now) continue;
      if (table.validUntil && table.validUntil < now) continue;

      // Check if rules match
      if (rules.length > 0 && !this.doRulesMatch(rules, input)) continue;

      // Find price item for this variant + quantity
      const item =
        await this.priceTableItemsRepository.findBestForVariantInTable(
          table.id.toString(),
          input.variantId,
          input.quantity,
        );

      if (!item) continue;

      // Determine price source
      const isQuantityTier = item.minQuantity > 1;
      const priceSource = isQuantityTier ? 'QUANTITY_TIER' : 'TABLE';

      const result = this.buildOutput(
        item.price,
        item.price,
        priceSource,
        table.id.toString(),
        table.name,
      );

      if (item.costPrice !== undefined) {
        result.margin = this.calculateMargin(item.price, item.costPrice);
      }

      return result;
    }

    return null;
  }

  private doRulesMatch(
    rules: PriceTableRuleData[],
    input: PriceResolverInput,
  ): boolean {
    // All rules must match (AND logic)
    return rules.every((rule) => this.doesRuleMatch(rule, input));
  }

  private doesRuleMatch(
    rule: PriceTableRuleData,
    input: PriceResolverInput,
  ): boolean {
    switch (rule.ruleType) {
      case 'CHANNEL': {
        if (!input.channel) return false;
        if (rule.operator === 'EQUALS') {
          return input.channel === rule.value;
        }
        if (rule.operator === 'IN') {
          const values = rule.value.split(',').map((v) => v.trim());
          return values.includes(input.channel);
        }
        return false;
      }

      case 'REGION': {
        if (!input.destinationState) return false;
        if (rule.operator === 'EQUALS') {
          return input.destinationState === rule.value;
        }
        if (rule.operator === 'IN') {
          const values = rule.value.split(',').map((v) => v.trim());
          return values.includes(input.destinationState);
        }
        return false;
      }

      case 'MIN_QUANTITY': {
        const ruleQty = Number(rule.value);
        if (rule.operator === 'GREATER_THAN') {
          return input.quantity >= ruleQty;
        }
        if (rule.operator === 'EQUALS') {
          return input.quantity === ruleQty;
        }
        if (rule.operator === 'LESS_THAN') {
          return input.quantity < ruleQty;
        }
        return false;
      }

      case 'CUSTOMER_TYPE':
      case 'CUSTOMER_TAG':
        // These require customer metadata not available in the basic input
        // For now, return false (will be extended when customer context is provided)
        return false;

      default:
        return false;
    }
  }

  private buildOutput(
    basePrice: number,
    finalPrice: number,
    priceSource: PriceResolverOutput['priceSource'],
    priceTableId?: string,
    priceTableName?: string,
  ): PriceResolverOutput {
    return {
      basePrice,
      finalPrice,
      priceSource,
      priceTableId,
      priceTableName,
    };
  }

  private calculateMargin(
    price: number,
    costPrice: number,
  ): PriceResolverOutput['margin'] {
    const marginValue = price - costPrice;
    const marginPercent = costPrice > 0 ? (marginValue / costPrice) * 100 : 0;

    return {
      costPrice,
      marginPercent: Math.round(marginPercent * 100) / 100,
      marginValue: Math.round(marginValue * 100) / 100,
    };
  }
}
