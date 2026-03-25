import type { ToolHandler, ToolExecutionContext } from '../tool-types';
import { TOOL_LIST_MAX_ITEMS } from '../tool-types';

// === Customer Factories ===
import { makeListCustomersUseCase } from '@/use-cases/sales/customers/factories/make-list-customers-use-case';
import { makeGetCustomerByIdUseCase } from '@/use-cases/sales/customers/factories/make-get-customer-by-id-use-case';
import { makeCreateCustomerUseCase } from '@/use-cases/sales/customers/factories/make-create-customer-use-case';
import { makeUpdateCustomerUseCase } from '@/use-cases/sales/customers/factories/make-update-customer-use-case';

// === Order Factories ===
import { makeListOrdersUseCase } from '@/use-cases/sales/orders/factories/make-list-orders-use-case';
import { makeGetOrderByIdUseCase } from '@/use-cases/sales/orders/factories/make-get-order-by-id-use-case';
import { makeCreateOrderUseCase } from '@/use-cases/sales/orders/factories/make-create-order-use-case';
import { makeConfirmOrderUseCase } from '@/use-cases/sales/orders/factories/make-confirm-order-use-case';
import { makeCancelOrderUseCase } from '@/use-cases/sales/orders/factories/make-cancel-order-use-case';

// === Reservation Factories ===
import { makeListItemReservationsUseCase } from '@/use-cases/sales/item-reservations/factories/make-list-item-reservations-use-case';
import { makeCreateItemReservationUseCase } from '@/use-cases/sales/item-reservations/factories/make-create-item-reservation-use-case';
import { makeReleaseItemReservationUseCase } from '@/use-cases/sales/item-reservations/factories/make-release-item-reservation-use-case';

// === Promotion Factories ===
import { makeListVariantPromotionsUseCase } from '@/use-cases/sales/variant-promotions/factories/make-list-variant-promotions-use-case';
import { makeGetVariantPromotionByIdUseCase } from '@/use-cases/sales/variant-promotions/factories/make-get-variant-promotion-by-id-use-case';
import { makeCreateVariantPromotionUseCase } from '@/use-cases/sales/variant-promotions/factories/make-create-variant-promotion-use-case';

// === Coupon Factories ===
import { makeListCouponsUseCase } from '@/use-cases/sales/coupons/factories/make-list-coupons-use-case';
import { makeCreateCouponUseCase } from '@/use-cases/sales/coupons/factories/make-create-coupon-use-case';

// ─── Helpers ─────────────────────────────────────────────────────────

function clampLimit(limit: unknown, fallback = 10): number {
  const n = typeof limit === 'number' ? limit : fallback;
  return Math.min(Math.max(1, n), TOOL_LIST_MAX_ITEMS);
}

// ─── Export ──────────────────────────────────────────────────────────

export function getSalesHandlers(): Record<string, ToolHandler> {
  return {
    // =========================================================
    // QUERY TOOLS (8)
    // =========================================================

    sales_list_customers: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListCustomersUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          type: args.type as 'INDIVIDUAL' | 'BUSINESS' | undefined,
          isActive: args.isActive as boolean | undefined,
          page: (args.page as number) ?? 1,
          perPage: limit,
        });
        return {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          showing: result.customers.length,
          customers: result.customers
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((c) => ({
              id: c.id,
              name: c.name,
              type: c.type,
              document: c.document,
              email: c.email,
              phone: c.phone,
              city: c.city,
              state: c.state,
              isActive: c.isActive,
            })),
        };
      },
    },

    sales_get_customer: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        if (!args.customerId) {
          return { error: 'Informe o customerId do cliente.' };
        }
        const useCase = makeGetCustomerByIdUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          id: args.customerId as string,
        });
        const c = result.customer;
        return {
          id: c.id,
          name: c.name,
          type: c.type,
          document: c.document,
          email: c.email,
          phone: c.phone,
          address: c.address,
          city: c.city,
          state: c.state,
          zipCode: c.zipCode,
          country: c.country,
          notes: c.notes,
          isActive: c.isActive,
          createdAt: c.createdAt.toISOString(),
        };
      },
    },

    sales_list_orders: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListOrdersUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          search: args.search as string | undefined,
          type: args.type as string | undefined,
          channel: args.channel as string | undefined,
          customerId: args.customerId as string | undefined,
          stageId: args.stageId as string | undefined,
          pipelineId: args.pipelineId as string | undefined,
          page: (args.page as number) ?? 1,
          limit,
        });
        return {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          showing: result.orders.length,
          orders: result.orders.slice(0, TOOL_LIST_MAX_ITEMS).map((o) => ({
            id: o.id.toString(),
            orderNumber: o.orderNumber,
            type: o.type,
            channel: o.channel,
            customerId: o.customerId.toString(),
            stageId: o.stageId.toString(),
            subtotal: o.subtotal,
            grandTotal: o.grandTotal,
            currency: o.currency,
            createdAt: o.createdAt.toISOString(),
          })),
        };
      },
    },

    sales_get_order: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        if (!args.orderId) {
          return { error: 'Informe o orderId do pedido.' };
        }
        const useCase = makeGetOrderByIdUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          orderId: args.orderId as string,
        });
        const o = result.order;
        return {
          id: o.id.toString(),
          orderNumber: o.orderNumber,
          type: o.type,
          channel: o.channel,
          customerId: o.customerId.toString(),
          pipelineId: o.pipelineId.toString(),
          stageId: o.stageId.toString(),
          subtotal: o.subtotal,
          discountTotal: o.discountTotal,
          taxTotal: o.taxTotal,
          shippingTotal: o.shippingTotal,
          grandTotal: o.grandTotal,
          currency: o.currency,
          deliveryMethod: o.deliveryMethod,
          notes: o.notes,
          needsApproval: o.needsApproval,
          createdAt: o.createdAt.toISOString(),
          items: result.items.map((i) => ({
            id: i.id.toString(),
            variantId: i.variantId?.toString(),
            name: i.name,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountPercent: i.discountPercent,
            discountValue: i.discountValue,
          })),
        };
      },
    },

    sales_list_reservations: {
      async execute(
        args: Record<string, unknown>,
        _context: ToolExecutionContext,
      ) {
        const useCase = makeListItemReservationsUseCase();
        const result = await useCase.execute({
          itemId: args.itemId as string | undefined,
          userId: args.userId as string | undefined,
          activeOnly: (args.activeOnly as boolean) ?? true,
        });
        return {
          total: result.reservations.length,
          reservations: result.reservations
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((r) => ({
              id: r.id,
              itemId: r.itemId,
              userId: r.userId,
              quantity: r.quantity,
              reason: r.reason,
              reference: r.reference,
              expiresAt: r.expiresAt.toISOString(),
              isActive: r.isActive,
              isExpired: r.isExpired,
              isReleased: r.isReleased,
              createdAt: r.createdAt.toISOString(),
            })),
        };
      },
    },

    sales_list_promotions: {
      async execute(
        args: Record<string, unknown>,
        _context: ToolExecutionContext,
      ) {
        const useCase = makeListVariantPromotionsUseCase();
        const result = await useCase.execute({
          variantId: args.variantId as string | undefined,
          activeOnly: (args.activeOnly as boolean) ?? false,
        });
        return {
          total: result.promotions.length,
          promotions: result.promotions
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((p) => ({
              id: p.id,
              variantId: p.variantId,
              name: p.name,
              discountType: p.discountType,
              discountValue: p.discountValue,
              startDate: p.startDate.toISOString(),
              endDate: p.endDate.toISOString(),
              isActive: p.isActive,
              isCurrentlyValid: p.isCurrentlyValid,
              isExpired: p.isExpired,
              isUpcoming: p.isUpcoming,
            })),
        };
      },
    },

    sales_get_promotion: {
      async execute(
        args: Record<string, unknown>,
        _context: ToolExecutionContext,
      ) {
        if (!args.promotionId) {
          return { error: 'Informe o promotionId da promoção.' };
        }
        const useCase = makeGetVariantPromotionByIdUseCase();
        const result = await useCase.execute({
          id: args.promotionId as string,
        });
        const p = result.promotion;
        return {
          id: p.id,
          variantId: p.variantId,
          name: p.name,
          discountType: p.discountType,
          discountValue: p.discountValue,
          startDate: p.startDate.toISOString(),
          endDate: p.endDate.toISOString(),
          isActive: p.isActive,
          isCurrentlyValid: p.isCurrentlyValid,
          isExpired: p.isExpired,
          isUpcoming: p.isUpcoming,
          notes: p.notes,
          createdAt: p.createdAt.toISOString(),
        };
      },
    },

    sales_list_coupons: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListCouponsUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          search: args.search as string | undefined,
          isActive: args.isActive as boolean | undefined,
          page: (args.page as number) ?? 1,
          limit,
        });
        const coupons = result.coupons;
        return {
          total: coupons.total,
          page: coupons.page,
          totalPages: coupons.totalPages,
          showing: coupons.data.length,
          coupons: coupons.data.slice(0, TOOL_LIST_MAX_ITEMS).map((c) => ({
            id: c.id.toString(),
            code: c.code,
            description: c.description,
            discountType: c.discountType,
            discountValue: c.discountValue,
            applicableTo: c.applicableTo,
            isActive: c.isActive,
            usageCount: c.usages.length,
            maxUsageTotal: c.maxUsageTotal,
          })),
        };
      },
    },

    // =========================================================
    // ACTION TOOLS (10)
    // =========================================================

    sales_create_customer: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateCustomerUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          name: args.name as string,
          type: (args.type as 'INDIVIDUAL' | 'BUSINESS') ?? 'INDIVIDUAL',
          document: args.document as string | undefined,
          email: args.email as string | undefined,
          phone: args.phone as string | undefined,
          address: args.address as string | undefined,
          city: args.city as string | undefined,
          state: args.state as string | undefined,
          zipCode: args.zipCode as string | undefined,
          notes: args.notes as string | undefined,
        });
        const c = result.customer;
        return {
          success: true,
          message: `Cliente "${c.name}" cadastrado com sucesso.`,
          customer: {
            id: c.id,
            name: c.name,
            type: c.type,
            email: c.email,
          },
        };
      },
    },

    sales_update_customer: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeUpdateCustomerUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          id: args.customerId as string,
          name: args.name as string | undefined,
          type: args.type as 'INDIVIDUAL' | 'BUSINESS' | undefined,
          document: args.document as string | undefined,
          email: args.email as string | undefined,
          phone: args.phone as string | undefined,
          address: args.address as string | undefined,
          city: args.city as string | undefined,
          state: args.state as string | undefined,
          zipCode: args.zipCode as string | undefined,
          notes: args.notes as string | undefined,
          isActive: args.isActive as boolean | undefined,
        });
        const c = result.customer;
        return {
          success: true,
          message: `Cliente "${c.name}" atualizado com sucesso.`,
          customer: {
            id: c.id,
            name: c.name,
            type: c.type,
            isActive: c.isActive,
          },
        };
      },
    },

    sales_create_order: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const items =
          (args.items as Array<{
            variantId?: string;
            name: string;
            sku?: string;
            quantity: number;
            unitPrice: number;
            discountPercent?: number;
            discountValue?: number;
          }>) ?? [];

        if (items.length === 0) {
          return { error: 'O pedido precisa de ao menos um item.' };
        }

        // Calculate subtotal from items
        let subtotal = 0;
        for (const item of items) {
          const discount = item.discountValue ?? 0;
          subtotal += item.quantity * item.unitPrice - discount;
        }

        const useCase = makeCreateOrderUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          type: (args.type as 'QUOTE' | 'ORDER') ?? 'ORDER',
          customerId: args.customerId as string,
          pipelineId: args.pipelineId as string,
          stageId: args.stageId as string,
          channel:
            (args.channel as
              | 'PDV'
              | 'WEB'
              | 'WHATSAPP'
              | 'MARKETPLACE'
              | 'BID'
              | 'MANUAL'
              | 'API') ?? 'MANUAL',
          subtotal,
          sourceWarehouseId: args.sourceWarehouseId as string | undefined,
          deliveryMethod: args.deliveryMethod as string | undefined,
          notes: args.notes as string | undefined,
          items: items.map((i) => ({
            variantId: i.variantId,
            name: i.name,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountPercent: i.discountPercent,
            discountValue: i.discountValue,
          })),
        });
        const o = result.order;
        return {
          success: true,
          message: `Pedido ${o.orderNumber} criado com sucesso.`,
          order: {
            id: o.id.toString(),
            orderNumber: o.orderNumber,
            type: o.type,
            channel: o.channel,
            grandTotal: o.grandTotal,
            itemCount: result.items.length,
          },
        };
      },
    },

    sales_confirm_order: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeConfirmOrderUseCase();
        const result = await useCase.execute({
          orderId: args.orderId as string,
          tenantId: context.tenantId,
          userId: context.userId,
        });
        const o = result.order;
        return {
          success: true,
          message: `Pedido ${o.orderNumber} confirmado com sucesso.`,
          order: {
            id: o.id.toString(),
            orderNumber: o.orderNumber,
            stageId: o.stageId.toString(),
          },
        };
      },
    },

    sales_cancel_order: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCancelOrderUseCase();
        const result = await useCase.execute({
          orderId: args.orderId as string,
          tenantId: context.tenantId,
          reason: args.reason as string | undefined,
        });
        const o = result.order;
        return {
          success: true,
          message: `Pedido ${o.orderNumber} cancelado com sucesso.`,
          order: {
            id: o.id.toString(),
            orderNumber: o.orderNumber,
            stageId: o.stageId.toString(),
          },
        };
      },
    },

    sales_create_reservation: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const hoursToExpire = (args.expiresInHours as number) ?? 24;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + hoursToExpire);

        const useCase = makeCreateItemReservationUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          itemId: args.itemId as string,
          userId: context.userId,
          quantity: args.quantity as number,
          reason: args.reason as string | undefined,
          reference: args.reference as string | undefined,
          expiresAt,
        });
        const r = result.reservation;
        return {
          success: true,
          message: `Reserva de ${r.quantity} unidade(s) criada com sucesso. Expira em ${hoursToExpire}h.`,
          reservation: {
            id: r.id,
            itemId: r.itemId,
            quantity: r.quantity,
            expiresAt: r.expiresAt.toISOString(),
          },
        };
      },
    },

    sales_release_reservation: {
      async execute(
        args: Record<string, unknown>,
        _context: ToolExecutionContext,
      ) {
        const useCase = makeReleaseItemReservationUseCase();
        const result = await useCase.execute({
          id: args.reservationId as string,
        });
        const r = result.reservation;
        return {
          success: true,
          message: `Reserva liberada com sucesso.`,
          reservation: {
            id: r.id,
            itemId: r.itemId,
            quantity: r.quantity,
            isReleased: r.isReleased,
          },
        };
      },
    },

    sales_create_promotion: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateVariantPromotionUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          variantId: args.variantId as string,
          name: args.name as string,
          discountType: args.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT',
          discountValue: args.discountValue as number,
          startDate: new Date(args.startDate as string),
          endDate: new Date(args.endDate as string),
          notes: args.notes as string | undefined,
        });
        const p = result.promotion;
        return {
          success: true,
          message: `Promoção "${p.name}" criada com sucesso.`,
          promotion: {
            id: p.id,
            variantId: p.variantId,
            name: p.name,
            discountType: p.discountType,
            discountValue: p.discountValue,
            startDate: p.startDate.toISOString(),
            endDate: p.endDate.toISOString(),
          },
        };
      },
    },

    sales_create_coupon: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateCouponUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          code: args.code as string,
          description: args.description as string | undefined,
          discountType: args.discountType as
            | 'PERCENTAGE'
            | 'FIXED_AMOUNT'
            | 'FREE_SHIPPING',
          discountValue: args.discountValue as number,
          applicableTo: args.applicableTo as
            | 'ALL'
            | 'SPECIFIC_PRODUCTS'
            | 'SPECIFIC_CATEGORIES'
            | 'SPECIFIC_CUSTOMERS',
          minOrderValue: args.minOrderValue as number | undefined,
          maxDiscountAmount: args.maxDiscountAmount as number | undefined,
          maxUsageTotal: args.maxUsageTotal as number | undefined,
          maxUsagePerCustomer: args.maxUsagePerCustomer as number | undefined,
          startDate: args.startDate
            ? new Date(args.startDate as string)
            : undefined,
          endDate: args.endDate ? new Date(args.endDate as string) : undefined,
        });
        const c = result.coupon;
        return {
          success: true,
          message: `Cupom "${c.code}" criado com sucesso.`,
          coupon: {
            id: c.id.toString(),
            code: c.code,
            discountType: c.discountType,
            discountValue: c.discountValue,
            applicableTo: c.applicableTo,
          },
        };
      },
    },

    // =========================================================
    // REPORT TOOLS (4)
    // =========================================================

    sales_summary: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const [customersResult, ordersResult, promotionsResult, couponsResult] =
          await Promise.all([
            makeListCustomersUseCase().execute({
              tenantId: context.tenantId,
              page: 1,
              perPage: 1,
            }),
            makeListOrdersUseCase().execute({
              tenantId: context.tenantId,
              type: args.type as string | undefined,
              page: 1,
              limit: 100,
            }),
            makeListVariantPromotionsUseCase().execute({
              activeOnly: true,
            }),
            makeListCouponsUseCase().execute({
              tenantId: context.tenantId,
              isActive: true,
              page: 1,
              limit: 1,
            }),
          ]);

        // Calculate revenue from orders
        let totalRevenue = 0;
        let orderCount = 0;
        for (const order of ordersResult.orders) {
          totalRevenue += order.grandTotal;
          orderCount++;
        }

        const avgTicket = orderCount > 0 ? totalRevenue / orderCount : 0;

        return {
          totalCustomers: customersResult.total,
          totalOrders: ordersResult.total,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          averageTicket: Math.round(avgTicket * 100) / 100,
          activePromotions: promotionsResult.promotions.length,
          activeCoupons: couponsResult.coupons.total,
        };
      },
    },

    sales_top_customers: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const limit = clampLimit(args.limit);

        // Get orders to aggregate by customer
        const ordersResult = await makeListOrdersUseCase().execute({
          tenantId: context.tenantId,
          page: 1,
          limit: 100,
        });

        // Aggregate by customer
        const byCustomer: Record<
          string,
          { customerId: string; orderCount: number; totalValue: number }
        > = {};

        for (const order of ordersResult.orders) {
          const cId = order.customerId.toString();
          if (!byCustomer[cId]) {
            byCustomer[cId] = {
              customerId: cId,
              orderCount: 0,
              totalValue: 0,
            };
          }
          byCustomer[cId].orderCount++;
          byCustomer[cId].totalValue += order.grandTotal;
        }

        const topCustomers = Object.values(byCustomer)
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, limit);

        // Enrich with customer names
        const enriched = await Promise.all(
          topCustomers.map(async (tc) => {
            try {
              const customerResult = await makeGetCustomerByIdUseCase().execute(
                {
                  tenantId: context.tenantId,
                  id: tc.customerId,
                },
              );
              return {
                ...tc,
                customerName: customerResult.customer.name,
                totalValue: Math.round(tc.totalValue * 100) / 100,
              };
            } catch {
              return {
                ...tc,
                customerName: '(desconhecido)',
                totalValue: Math.round(tc.totalValue * 100) / 100,
              };
            }
          }),
        );

        return {
          totalCustomersWithOrders: Object.keys(byCustomer).length,
          showing: enriched.length,
          topCustomers: enriched,
        };
      },
    },

    sales_revenue_report: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const ordersResult = await makeListOrdersUseCase().execute({
          tenantId: context.tenantId,
          channel: args.channel as string | undefined,
          page: 1,
          limit: 100,
        });

        const startDate = args.startDate
          ? new Date(args.startDate as string)
          : null;
        const endDate = args.endDate ? new Date(args.endDate as string) : null;

        // Filter by date range
        const filteredOrders = ordersResult.orders.filter((o) => {
          if (startDate && o.createdAt < startDate) return false;
          if (endDate && o.createdAt > endDate) return false;
          return true;
        });

        // Calculate totals
        let totalRevenue = 0;
        let totalDiscount = 0;
        let totalTax = 0;
        let totalShipping = 0;
        const byChannel: Record<string, { count: number; revenue: number }> =
          {};

        for (const order of filteredOrders) {
          totalRevenue += order.grandTotal;
          totalDiscount += order.discountTotal;
          totalTax += order.taxTotal;
          totalShipping += order.shippingTotal;

          const ch = order.channel;
          if (!byChannel[ch]) byChannel[ch] = { count: 0, revenue: 0 };
          byChannel[ch].count++;
          byChannel[ch].revenue += order.grandTotal;
        }

        // Round values in byChannel
        for (const key of Object.keys(byChannel)) {
          byChannel[key].revenue =
            Math.round(byChannel[key].revenue * 100) / 100;
        }

        const avgTicket =
          filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

        return {
          period: {
            startDate: args.startDate,
            endDate: args.endDate,
          },
          totalOrders: filteredOrders.length,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalDiscount: Math.round(totalDiscount * 100) / 100,
          totalTax: Math.round(totalTax * 100) / 100,
          totalShipping: Math.round(totalShipping * 100) / 100,
          averageTicket: Math.round(avgTicket * 100) / 100,
          byChannel,
        };
      },
    },

    sales_active_promotions: {
      async execute(
        _args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const [promotionsResult, couponsResult] = await Promise.all([
          makeListVariantPromotionsUseCase().execute({
            activeOnly: true,
          }),
          makeListCouponsUseCase().execute({
            tenantId: context.tenantId,
            isActive: true,
            page: 1,
            limit: TOOL_LIST_MAX_ITEMS,
          }),
        ]);

        return {
          activePromotions: {
            total: promotionsResult.promotions.length,
            promotions: promotionsResult.promotions
              .slice(0, TOOL_LIST_MAX_ITEMS)
              .map((p) => ({
                id: p.id,
                variantId: p.variantId,
                name: p.name,
                discountType: p.discountType,
                discountValue: p.discountValue,
                startDate: p.startDate.toISOString(),
                endDate: p.endDate.toISOString(),
                isCurrentlyValid: p.isCurrentlyValid,
              })),
          },
          activeCoupons: {
            total: couponsResult.coupons.total,
            coupons: couponsResult.coupons.data
              .slice(0, TOOL_LIST_MAX_ITEMS)
              .map((c) => ({
                id: c.id.toString(),
                code: c.code,
                description: c.description,
                discountType: c.discountType,
                discountValue: c.discountValue,
                applicableTo: c.applicableTo,
                usageCount: c.usages.length,
                maxUsageTotal: c.maxUsageTotal,
              })),
          },
        };
      },
    },
  };
}
