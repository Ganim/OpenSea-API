import type { ToolHandler, ToolExecutionContext } from '../tool-types';
import { TOOL_LIST_MAX_ITEMS } from '../tool-types';

// === Product Factories ===
import { makeListProductsUseCase } from '@/use-cases/stock/products/factories/make-list-products-use-case';
import { makeGetProductByIdUseCase } from '@/use-cases/stock/products/factories/make-get-product-by-id-use-case';
import { makeCreateProductUseCase } from '@/use-cases/stock/products/factories/make-create-product-use-case';
import { makeUpdateProductUseCase } from '@/use-cases/stock/products/factories/make-update-product-use-case';

// === Variant Factories ===
import { makeListVariantsUseCase } from '@/use-cases/stock/variants/factories/make-list-variants-use-case';
import { makeListVariantsByProductIdUseCase } from '@/use-cases/stock/variants/factories/make-list-variants-by-product-id-use-case';
import { makeCreateVariantUseCase } from '@/use-cases/stock/variants/factories/make-create-variant-use-case';
import { makeUpdateVariantUseCase } from '@/use-cases/stock/variants/factories/make-update-variant-use-case';

// === Item Factories ===
import { makeListItemsUseCase } from '@/use-cases/stock/items/factories/make-list-items-use-case';
import { makeRegisterItemEntryUseCase } from '@/use-cases/stock/items/factories/make-register-item-entry-use-case';
import { makeRegisterItemExitUseCase } from '@/use-cases/stock/items/factories/make-register-item-exit-use-case';
import { makeTransferItemUseCase } from '@/use-cases/stock/items/factories/make-transfer-item-use-case';
import { makeSearchItemLocationUseCase } from '@/use-cases/stock/items/factories/make-search-item-location-use-case';
import { makeCheckStockAlertsUseCase } from '@/use-cases/stock/items/factories/make-check-stock-alerts-use-case';

// === Category Factories ===
import { makeListCategoriesUseCase } from '@/use-cases/stock/categories/factories/make-list-categories-use-case';
import { makeCreateCategoryUseCase } from '@/use-cases/stock/categories/factories/make-create-category-use-case';

// === Template Factories ===
import { makeListTemplatesUseCase } from '@/use-cases/stock/templates/factories/make-list-templates-use-case';
import { makeCreateTemplateUseCase } from '@/use-cases/stock/templates/factories/make-create-template-use-case';

// === Supplier Factories ===
import { makeListSuppliersUseCase } from '@/use-cases/stock/suppliers/factories/make-list-suppliers-use-case';
import { makeCreateSupplierUseCase } from '@/use-cases/stock/suppliers/factories/make-create-supplier-use-case';

// === Manufacturer Factories ===
import { makeListManufacturersUseCase } from '@/use-cases/stock/manufacturers/factories/make-list-manufacturers-use-case';
import { makeCreateManufacturerUseCase } from '@/use-cases/stock/manufacturers/factories/make-create-manufacturer-use-case';

// === Tag Factories ===
import { makeListTagsUseCase } from '@/use-cases/stock/tags/factories/make-list-tags-use-case';
import { makeCreateTagUseCase } from '@/use-cases/stock/tags/factories/make-create-tag-use-case';

// === Warehouse / Zone / Bin Factories ===
import { makeListWarehousesUseCase } from '@/use-cases/stock/warehouses/factories/make-list-warehouses-use-case';
import { makeListZonesUseCase } from '@/use-cases/stock/zones/factories/make-list-zones-use-case';
import { makeListBinsUseCase } from '@/use-cases/stock/bins/factories/make-list-bins-use-case';

// === Movement Factories ===
import { makeListItemMovementsUseCase } from '@/use-cases/stock/item-movements/factories/make-list-item-movements-use-case';

// === Purchase Order Factories ===
import { makeListPurchaseOrdersUseCase } from '@/use-cases/stock/purchase-orders/factories/make-list-purchase-orders-use-case';
import { makeCreatePurchaseOrderUseCase } from '@/use-cases/stock/purchase-orders/factories/make-create-purchase-order-use-case';

// ─── Helpers ─────────────────────────────────────────────────────────

function clampLimit(limit: unknown, fallback = 10): number {
  const n = typeof limit === 'number' ? limit : fallback;
  return Math.min(Math.max(1, n), TOOL_LIST_MAX_ITEMS);
}

// ─── Export ──────────────────────────────────────────────────────────

export function getStockHandlers(): Record<string, ToolHandler> {
  return {
    // =========================================================
    // QUERY TOOLS (16)
    // =========================================================

    stock_list_products: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListProductsUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          search: args.search as string | undefined,
          categoryIds: args.categoryId
            ? [args.categoryId as string]
            : undefined,
          manufacturerIds: args.manufacturerId
            ? [args.manufacturerId as string]
            : undefined,
          page: (args.page as number) ?? 1,
          limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.pages,
          showing: result.products.length,
          products: result.products.slice(0, TOOL_LIST_MAX_ITEMS).map((p) => ({
            id: p.id.toString(),
            name: p.name,
            fullCode: p.fullCode,
            status: p.status.value,
            description: p.description?.slice(0, 100),
          })),
        };
      },
    },

    stock_get_product: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        // If productId provided, use get-by-id directly
        if (args.productId) {
          const useCase = makeGetProductByIdUseCase();
          const result = await useCase.execute({
            tenantId: context.tenantId,
            id: args.productId as string,
          });
          const p = result.product;
          return {
            id: p.id.toString(),
            name: p.name,
            fullCode: p.fullCode,
            status: p.status.value,
            description: p.description,
            templateId: p.templateId?.toString(),
            manufacturerId: p.manufacturerId?.toString(),
            supplierId: p.supplierId?.toString(),
            attributes: p.attributes,
            createdAt: p.createdAt.toISOString(),
          };
        }

        // If name provided, search by name
        if (args.name) {
          const listUseCase = makeListProductsUseCase();
          const result = await listUseCase.execute({
            tenantId: context.tenantId,
            search: args.name as string,
            page: 1,
            limit: 5,
          });
          if (result.products.length === 0) {
            return { error: 'Nenhum produto encontrado com esse nome.' };
          }
          if (result.products.length === 1) {
            const p = result.products[0];
            return {
              id: p.id.toString(),
              name: p.name,
              fullCode: p.fullCode,
              status: p.status.value,
              description: p.description,
              templateId: p.templateId?.toString(),
              manufacturerId: p.manufacturerId?.toString(),
              supplierId: p.supplierId?.toString(),
              attributes: p.attributes,
              createdAt: p.createdAt.toISOString(),
            };
          }
          return {
            message: `Encontrados ${result.products.length} produtos. Especifique o ID.`,
            products: result.products.map((p) => ({
              id: p.id.toString(),
              name: p.name,
              fullCode: p.fullCode,
            })),
          };
        }

        return { error: 'Informe o productId ou o nome do produto.' };
      },
    },

    stock_count_products: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListProductsUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          categoryIds: args.categoryId
            ? [args.categoryId as string]
            : undefined,
          page: 1,
          limit: 1,
        });
        return {
          total: result.meta.total,
          filters: {
            status: args.status ?? 'todos',
            categoryId: args.categoryId ?? null,
          },
        };
      },
    },

    stock_list_variants: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const limit = clampLimit(args.limit);

        // If productId provided, use the specialized use-case
        if (args.productId) {
          const useCase = makeListVariantsByProductIdUseCase();
          const result = await useCase.execute({
            tenantId: context.tenantId,
            productId: args.productId as string,
          });
          return {
            total: result.variants.length,
            variants: result.variants
              .slice(0, TOOL_LIST_MAX_ITEMS)
              .map((v) => ({
                id: v.variant.id.toString(),
                name: v.variant.name,
                sku: v.variant.sku,
                fullCode: v.variant.fullCode,
                price: v.variant.price,
                productName: v.productName,
                itemCount: v.itemCount,
                totalQuantity: v.totalCurrentQuantity,
              })),
          };
        }

        // Generic list
        const useCase = makeListVariantsUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          page: (args.page as number) ?? 1,
          limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.pages,
          showing: result.variants.length,
          variants: result.variants.slice(0, TOOL_LIST_MAX_ITEMS).map((v) => ({
            id: v.id.toString(),
            name: v.name,
            sku: v.sku,
            fullCode: v.fullCode,
            price: v.price,
            productId: v.productId.toString(),
            isActive: v.isActive,
          })),
        };
      },
    },

    stock_list_items: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListItemsUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          productId: args.productId as string | undefined,
          variantId: args.variantId as string | undefined,
          status: args.status as string | undefined,
          page: (args.page as number) ?? 1,
          limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.pages,
          showing: result.items.length,
          items: result.items.slice(0, TOOL_LIST_MAX_ITEMS).map((i) => ({
            id: i.id,
            uniqueCode: i.uniqueCode,
            fullCode: i.fullCode,
            productName: i.productName,
            variantName: i.variantName,
            status: i.status,
            currentQuantity: i.currentQuantity,
            unitCost: i.unitCost,
            resolvedAddress: i.resolvedAddress,
          })),
        };
      },
    },

    stock_list_categories: {
      async execute(
        _args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListCategoriesUseCase();
        const result = await useCase.execute({ tenantId: context.tenantId });
        return {
          total: result.categories.length,
          categories: result.categories
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((c) => ({
              id: c.categoryId.toString(),
              name: c.name,
              slug: c.slug,
              description: c.description,
              parentId: c.parentId?.toString() ?? null,
              isActive: c.isActive,
              productCount: c.productCount,
            })),
        };
      },
    },

    stock_list_templates: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListTemplatesUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          search: args.search as string | undefined,
          page: (args.page as number) ?? 1,
          limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.pages,
          showing: result.templates.length,
          templates: result.templates
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((t) => ({
              id: t.id,
              name: t.name,
              code: t.code,
            })),
        };
      },
    },

    stock_list_suppliers: {
      async execute(
        _args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListSuppliersUseCase();
        const result = await useCase.execute({ tenantId: context.tenantId });
        return {
          total: result.suppliers.length,
          suppliers: result.suppliers
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((s) => ({
              id: s.id,
              name: s.name,
              cnpj: s.cnpj,
              email: s.email,
              phone: s.phone,
              isActive: s.isActive,
            })),
        };
      },
    },

    stock_list_manufacturers: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListManufacturersUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          search: args.search as string | undefined,
          page: (args.page as number) ?? 1,
          limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.pages,
          showing: result.manufacturers.length,
          manufacturers: result.manufacturers
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((m) => ({
              id: m.manufacturerId.toString(),
              name: m.name,
              code: m.code,
              country: m.country,
              isActive: m.isActive,
            })),
        };
      },
    },

    stock_list_tags: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListTagsUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          search: args.search as string | undefined,
          page: (args.page as number) ?? 1,
          limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.pages,
          showing: result.tags.length,
          tags: result.tags.slice(0, TOOL_LIST_MAX_ITEMS).map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            color: t.color,
          })),
        };
      },
    },

    stock_list_warehouses: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListWarehousesUseCase();
        const activeOnly = args.active === true;
        const result = await useCase.execute({
          tenantId: context.tenantId,
          activeOnly,
        });
        return {
          total: result.warehouses.length,
          warehouses: result.warehouses
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((w) => ({
              id: w.warehouseId.toString(),
              code: w.code,
              name: w.name,
              description: w.description,
              address: w.address,
              isActive: w.isActive,
            })),
        };
      },
    },

    stock_list_zones: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListZonesUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          warehouseId: args.warehouseId as string | undefined,
        });
        return {
          total: result.zones.length,
          zones: result.zones.slice(0, TOOL_LIST_MAX_ITEMS).map((z) => ({
            id: z.zoneId.toString(),
            code: z.code,
            name: z.name,
            description: z.description,
            warehouseId: z.warehouseId.toString(),
            isActive: z.isActive,
          })),
        };
      },
    },

    stock_list_bins: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListBinsUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          zoneId: args.zoneId as string | undefined,
          addressPattern: args.search as string | undefined,
        });
        const bins = result.bins.slice(0, TOOL_LIST_MAX_ITEMS);
        return {
          total: result.bins.length,
          showing: bins.length,
          bins: bins.map((b) => ({
            id: b.binId.toString(),
            address: b.address,
            aisle: b.aisle,
            shelf: b.shelf,
            position: b.position,
            capacity: b.capacity,
            currentOccupancy: b.currentOccupancy,
            isActive: b.isActive,
            isBlocked: b.isBlocked,
          })),
        };
      },
    },

    stock_list_movements: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListItemMovementsUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          movementType: args.type as string | undefined,
          page: (args.page as number) ?? 1,
          limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.pages,
          showing: result.movements.length,
          movements: result.movements
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((m) => ({
              id: m.id,
              type: m.movementType,
              quantity: m.quantity,
              itemId: m.itemId,
              notes: m.notes?.slice(0, 100),
              createdAt: m.createdAt,
            })),
        };
      },
    },

    stock_list_purchase_orders: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListPurchaseOrdersUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          supplierId: args.supplierId as string | undefined,
          status: args.status as string | undefined,
          page: (args.page as number) ?? 1,
          perPage: clampLimit(args.limit),
        });
        return {
          total: result.purchaseOrders.length,
          purchaseOrders: result.purchaseOrders
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((po) => ({
              id: po.id,
              orderNumber: po.orderNumber,
              supplierId: po.supplierId,
              status: po.status,
              expectedDate: po.expectedDate,
              totalCost: po.totalCost,
              notes: po.notes?.slice(0, 100),
            })),
        };
      },
    },

    stock_get_item_location: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const query = (args.itemId ?? args.sku ?? '') as string;
        if (!query) {
          return {
            error: 'Informe o itemId ou SKU para buscar a localização.',
          };
        }
        const useCase = makeSearchItemLocationUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          query,
          limit: 5,
        });
        if (result.items.length === 0) {
          return { message: 'Nenhum item encontrado com essa referência.' };
        }
        return {
          total: result.items.length,
          items: result.items.map((i) => ({
            itemId: i.itemId,
            productName: i.productName,
            variantName: i.variantName,
            sku: i.sku,
            quantity: i.quantity,
            warehouse: i.warehouse,
            zone: i.zone,
            bin: i.bin,
          })),
        };
      },
    },

    // =========================================================
    // ACTION TOOLS (13)
    // =========================================================

    stock_create_product: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateProductUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          name: args.name as string,
          description: args.description as string | undefined,
          status: args.status as string | undefined,
          templateId: (args.templateId as string) ?? '',
          manufacturerId: args.manufacturerId as string | undefined,
          categoryIds: args.categoryId
            ? [args.categoryId as string]
            : undefined,
        });
        const p = result.product;
        return {
          success: true,
          message: `Produto "${p.name}" criado com sucesso.`,
          product: {
            id: p.id.toString(),
            name: p.name,
            fullCode: p.fullCode,
            status: p.status.value,
          },
        };
      },
    },

    stock_update_product: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeUpdateProductUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          id: args.productId as string,
          userId: context.userId,
          name: args.name as string | undefined,
          description: args.description as string | undefined,
          status: args.status as string | undefined,
          manufacturerId: args.manufacturerId as string | undefined,
          categoryIds: args.categoryId
            ? [args.categoryId as string]
            : undefined,
        });
        const p = result.product;
        return {
          success: true,
          message: `Produto "${p.name}" atualizado com sucesso.`,
          product: {
            id: p.id.toString(),
            name: p.name,
            fullCode: p.fullCode,
            status: p.status.value,
          },
        };
      },
    },

    stock_create_variant: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateVariantUseCase();
        const variant = await useCase.execute({
          tenantId: context.tenantId,
          productId: args.productId as string,
          name: args.name as string,
          sku: args.sku as string | undefined,
          price: args.price as number | undefined,
          costPrice: args.costPrice as number | undefined,
          attributes: args.attributes as Record<string, unknown> | undefined,
        });
        return {
          success: true,
          message: `Variante "${variant.name}" criada com sucesso.`,
          variant: {
            id: variant.id.toString(),
            name: variant.name,
            sku: variant.sku,
            fullCode: variant.fullCode,
            price: variant.price,
          },
        };
      },
    },

    stock_update_variant: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeUpdateVariantUseCase();
        const variant = await useCase.execute({
          tenantId: context.tenantId,
          id: args.variantId as string,
          name: args.name as string | undefined,
          sku: args.sku as string | undefined,
          price: args.price as number | undefined,
          costPrice: args.costPrice as number | undefined,
        });
        return {
          success: true,
          message: `Variante "${variant.name}" atualizada com sucesso.`,
          variant: {
            id: variant.id.toString(),
            name: variant.name,
            sku: variant.sku,
            fullCode: variant.fullCode,
            price: variant.price,
          },
        };
      },
    },

    stock_register_entry: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeRegisterItemEntryUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          variantId: args.variantId as string,
          binId: args.binId as string | undefined,
          quantity: args.quantity as number,
          userId: context.userId,
          unitCost: args.unitCost as number | undefined,
          notes: args.notes as string | undefined,
        });
        return {
          success: true,
          message: `Entrada de ${args.quantity} unidade(s) registrada com sucesso.`,
          item: {
            id: result.item.id,
            fullCode: result.item.fullCode,
            currentQuantity: result.item.currentQuantity,
            status: result.item.status,
          },
          movementId: result.movement.id,
        };
      },
    },

    stock_register_exit: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        // The exit use-case needs an itemId, not variantId.
        // We first find the item for this variant+warehouse.
        const listItemsUseCase = makeListItemsUseCase();
        const itemsResult = await listItemsUseCase.execute({
          tenantId: context.tenantId,
          variantId: args.variantId as string,
          status: 'AVAILABLE',
          page: 1,
          limit: 1,
        });

        if (itemsResult.items.length === 0) {
          return {
            error: 'Nenhum item disponível encontrado para esta variante.',
          };
        }

        const itemId = itemsResult.items[0].id;
        const reasonToMovementType: Record<string, string> = {
          SALE: 'SALE',
          LOSS: 'LOSS',
          DAMAGE: 'LOSS',
          CONSUMPTION: 'PRODUCTION',
          RETURN_TO_SUPPLIER: 'SUPPLIER_RETURN',
          OTHER: 'INVENTORY_ADJUSTMENT',
        };

        const useCase = makeRegisterItemExitUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          itemId,
          quantity: args.quantity as number,
          userId: context.userId,
          movementType: (reasonToMovementType[args.reason as string] ??
            'SALE') as
            | 'SALE'
            | 'PRODUCTION'
            | 'SAMPLE'
            | 'LOSS'
            | 'SUPPLIER_RETURN'
            | 'INVENTORY_ADJUSTMENT',
          notes: args.notes as string | undefined,
        });
        return {
          success: true,
          message: `Saída de ${args.quantity} unidade(s) registrada com sucesso.`,
          item: {
            id: result.item.id,
            fullCode: result.item.fullCode,
            currentQuantity: result.item.currentQuantity,
            status: result.item.status,
          },
          movementId: result.movement.id,
        };
      },
    },

    stock_transfer_item: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        // The transfer use-case works on itemId + destinationBinId
        // We need to find an item from the specified variant+warehouse
        const listItemsUseCase = makeListItemsUseCase();
        const itemsResult = await listItemsUseCase.execute({
          tenantId: context.tenantId,
          variantId: args.variantId as string,
          status: 'AVAILABLE',
          page: 1,
          limit: 1,
        });

        if (itemsResult.items.length === 0) {
          return {
            error: 'Nenhum item disponível encontrado para transferência.',
          };
        }

        const itemId = itemsResult.items[0].id;

        if (!args.toBinId) {
          return {
            error:
              'É necessário informar o toBinId (bin de destino) para transferência.',
          };
        }

        const useCase = makeTransferItemUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          itemId,
          destinationBinId: args.toBinId as string,
          userId: context.userId,
          notes: args.notes as string | undefined,
        });
        return {
          success: true,
          message: `Item transferido com sucesso para o bin de destino.`,
          item: {
            id: result.item.id,
            fullCode: result.item.fullCode,
            resolvedAddress: result.item.resolvedAddress,
          },
          movementId: result.movement.id,
        };
      },
    },

    stock_create_category: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateCategoryUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          name: args.name as string,
          description: args.description as string | undefined,
          parentId: args.parentId as string | undefined,
        });
        const c = result.category;
        return {
          success: true,
          message: `Categoria "${c.name}" criada com sucesso.`,
          category: {
            id: c.categoryId.toString(),
            name: c.name,
            slug: c.slug,
          },
        };
      },
    },

    stock_create_template: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateTemplateUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          name: args.name as string,
        });
        return {
          success: true,
          message: `Template "${result.template.name}" criado com sucesso.`,
          template: {
            id: result.template.id,
            name: result.template.name,
            code: result.template.code,
          },
        };
      },
    },

    stock_create_supplier: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateSupplierUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          name: args.name as string,
          cnpj: args.cnpj as string | undefined,
          email: args.email as string | undefined,
          phone: args.phone as string | undefined,
          notes: args.notes as string | undefined,
        });
        return {
          success: true,
          message: `Fornecedor "${result.supplier.name}" cadastrado com sucesso.`,
          supplier: {
            id: result.supplier.id,
            name: result.supplier.name,
          },
        };
      },
    },

    stock_create_manufacturer: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateManufacturerUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          name: args.name as string,
          country: (args.country as string) ?? 'BR',
          website: args.website as string | undefined,
          notes: args.notes as string | undefined,
        });
        const m = result.manufacturer;
        return {
          success: true,
          message: `Fabricante "${m.name}" cadastrado com sucesso.`,
          manufacturer: {
            id: m.manufacturerId.toString(),
            name: m.name,
            code: m.code,
          },
        };
      },
    },

    stock_create_purchase_order: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const items =
          (args.items as Array<{
            variantId: string;
            quantity: number;
            unitCost?: number;
          }>) ?? [];
        if (items.length === 0) {
          return { error: 'A ordem de compra precisa de ao menos um item.' };
        }

        // Generate order number: PO-<timestamp>
        const orderNumber = `PO-${Date.now()}`;

        const useCase = makeCreatePurchaseOrderUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          orderNumber,
          supplierId: args.supplierId as string,
          createdBy: context.userId,
          expectedDate: args.expectedDate
            ? new Date(args.expectedDate as string)
            : undefined,
          notes: args.notes as string | undefined,
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            unitCost: i.unitCost ?? 0,
          })),
        });
        return {
          success: true,
          message: `Ordem de compra ${result.purchaseOrder.orderNumber} criada com sucesso.`,
          purchaseOrder: {
            id: result.purchaseOrder.id,
            orderNumber: result.purchaseOrder.orderNumber,
            status: result.purchaseOrder.status,
            totalCost: result.purchaseOrder.totalCost,
          },
        };
      },
    },

    stock_create_tag: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateTagUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          name: args.name as string,
          color: args.color as string | undefined,
        });
        return {
          success: true,
          message: `Tag "${result.tag.name}" criada com sucesso.`,
          tag: {
            id: result.tag.id,
            name: result.tag.name,
            slug: result.tag.slug,
            color: result.tag.color,
          },
        };
      },
    },

    // =========================================================
    // REPORT TOOLS (4)
    // =========================================================

    stock_summary: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        // Compose multiple use-case calls for a summary
        const [productsResult, warehousesResult, itemsResult] =
          await Promise.all([
            makeListProductsUseCase().execute({
              tenantId: context.tenantId,
              page: 1,
              limit: 1,
            }),
            makeListWarehousesUseCase().execute({
              tenantId: context.tenantId,
            }),
            makeListItemsUseCase().execute({
              tenantId: context.tenantId,
              page: 1,
              limit: 1,
            }),
          ]);

        // Get stock alerts
        let alertCount = 0;
        try {
          const alertsResult = await makeCheckStockAlertsUseCase().execute({
            tenantId: context.tenantId,
          });
          alertCount = alertsResult.alerts.length;
        } catch {
          // alerts may fail silently
        }

        return {
          totalProducts: productsResult.meta.total,
          totalWarehouses: warehousesResult.warehouses.length,
          totalItems: itemsResult.meta.total,
          lowStockAlerts: alertCount,
          warehouses: warehousesResult.warehouses.slice(0, 10).map((w) => ({
            id: w.warehouseId.toString(),
            name: w.name,
            code: w.code,
            isActive: w.isActive,
          })),
        };
      },
    },

    stock_low_stock_report: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCheckStockAlertsUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
        });

        const limit = clampLimit(args.limit, 20);
        const alerts = result.alerts.slice(0, limit);

        return {
          totalAlerts: result.alerts.length,
          showing: alerts.length,
          alerts: alerts.map((a) => ({
            variantId: a.variantId,
            variantName: a.variantName,
            fullCode: a.fullCode,
            currentQuantity: a.currentQuantity,
            reorderPoint: a.reorderPoint,
            deficit: a.deficit,
          })),
        };
      },
    },

    stock_movement_report: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListItemMovementsUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          movementType: args.type as string | undefined,
          page: 1,
          limit: TOOL_LIST_MAX_ITEMS,
        });

        // Group movements by type
        const byType: Record<string, { count: number; totalQuantity: number }> =
          {};
        for (const m of result.movements) {
          const t = m.movementType;
          if (!byType[t]) byType[t] = { count: 0, totalQuantity: 0 };
          byType[t].count++;
          byType[t].totalQuantity += m.quantity;
        }

        return {
          period: {
            startDate: args.startDate,
            endDate: args.endDate,
          },
          totalMovements: result.meta.total,
          byType,
          recentMovements: result.movements.slice(0, 10).map((m) => ({
            id: m.id,
            type: m.movementType,
            quantity: m.quantity,
            itemId: m.itemId,
            createdAt: m.createdAt,
          })),
        };
      },
    },

    stock_valuation_report: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        // Compose: list items to calculate total valuation
        const useCase = makeListItemsUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          status: 'AVAILABLE',
          page: 1,
          limit: 100,
        });

        // Calculate totals
        let totalValue = 0;
        let totalItems = 0;
        const byProduct: Record<
          string,
          { name: string; quantity: number; value: number }
        > = {};

        for (const item of result.items) {
          const cost = item.unitCost ?? 0;
          const qty = item.currentQuantity;
          const value = cost * qty;
          totalValue += value;
          totalItems += qty;

          const key = item.productName;
          if (!byProduct[key]) {
            byProduct[key] = { name: key, quantity: 0, value: 0 };
          }
          byProduct[key].quantity += qty;
          byProduct[key].value += value;
        }

        const topProducts = Object.values(byProduct)
          .sort((a, b) => b.value - a.value)
          .slice(0, TOOL_LIST_MAX_ITEMS);

        return {
          referenceDate:
            (args.referenceDate as string) ??
            new Date().toISOString().split('T')[0],
          totalItems,
          totalValue: Math.round(totalValue * 100) / 100,
          distinctProducts: Object.keys(byProduct).length,
          topProducts: topProducts.map((p) => ({
            productName: p.name,
            totalQuantity: p.quantity,
            totalValue: Math.round(p.value * 100) / 100,
          })),
        };
      },
    },
  };
}
