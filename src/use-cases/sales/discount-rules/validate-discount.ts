import { DiscountRulesRepository } from '@/repositories/sales/discount-rules-repository';

interface CartItem {
  productId: string;
  categoryId?: string;
  quantity: number;
  unitPrice: number;
}

interface ApplicableDiscount {
  ruleId: string;
  ruleName: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  calculatedDiscount: number;
}

interface ValidateDiscountUseCaseRequest {
  tenantId: string;
  customerId?: string;
  cartItems: CartItem[];
}

interface ValidateDiscountUseCaseResponse {
  applicableDiscounts: ApplicableDiscount[];
  totalDiscount: number;
}

export class ValidateDiscountUseCase {
  constructor(private discountRulesRepository: DiscountRulesRepository) {}

  async execute(
    input: ValidateDiscountUseCaseRequest,
  ): Promise<ValidateDiscountUseCaseResponse> {
    const activeRules = await this.discountRulesRepository.findActiveByTenant(
      input.tenantId,
    );

    const orderTotal = input.cartItems.reduce(
      (sum, cartItem) => sum + cartItem.quantity * cartItem.unitPrice,
      0,
    );

    const totalQuantity = input.cartItems.reduce(
      (sum, cartItem) => sum + cartItem.quantity,
      0,
    );

    const productIds = input.cartItems.map((cartItem) => cartItem.productId);
    const categoryIds = input.cartItems
      .map((cartItem) => cartItem.categoryId)
      .filter(Boolean) as string[];

    // Sort by priority descending (higher priority first)
    const sortedRules = [...activeRules].sort(
      (a, b) => b.priority - a.priority,
    );

    const applicableDiscounts: ApplicableDiscount[] = [];
    let hasNonStackableApplied = false;

    for (const rule of sortedRules) {
      // Skip non-stackable if we already have a non-stackable discount
      if (hasNonStackableApplied && !rule.isStackable) {
        continue;
      }

      // Check minimum order value
      if (rule.minOrderValue !== undefined && orderTotal < rule.minOrderValue) {
        continue;
      }

      // Check minimum quantity
      if (rule.minQuantity !== undefined && totalQuantity < rule.minQuantity) {
        continue;
      }

      // Check customer restriction
      if (rule.customerId && rule.customerId !== input.customerId) {
        continue;
      }

      // Check product restriction
      if (rule.productId && !productIds.includes(rule.productId)) {
        continue;
      }

      // Check category restriction
      if (rule.categoryId && !categoryIds.includes(rule.categoryId)) {
        continue;
      }

      // Calculate discount amount
      let calculatedDiscount = 0;
      if (rule.type === 'PERCENTAGE') {
        calculatedDiscount = orderTotal * (rule.value / 100);
      } else {
        calculatedDiscount = rule.value;
      }

      // Discount cannot exceed order total
      calculatedDiscount = Math.min(calculatedDiscount, orderTotal);

      applicableDiscounts.push({
        ruleId: rule.id.toString(),
        ruleName: rule.name,
        type: rule.type,
        value: rule.value,
        calculatedDiscount: Math.round(calculatedDiscount * 100) / 100,
      });

      if (!rule.isStackable) {
        hasNonStackableApplied = true;
      }
    }

    const totalDiscount = applicableDiscounts.reduce(
      (sum, discount) => sum + discount.calculatedDiscount,
      0,
    );

    return {
      applicableDiscounts,
      totalDiscount: Math.min(
        Math.round(totalDiscount * 100) / 100,
        orderTotal,
      ),
    };
  }
}
