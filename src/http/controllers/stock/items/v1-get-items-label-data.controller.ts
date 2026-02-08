import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * Label data presenter schema - dados completos para renderizar etiquetas
 */
const itemLabelDataSchema = z.object({
  item: z.object({
    id: z.string(),
    uniqueCode: z.string().nullable(),
    fullCode: z.string(),
    sequentialCode: z.number(),
    currentQuantity: z.number(),
    initialQuantity: z.number(),
    unitCost: z.number().nullable(),
    status: z.string(),
    entryDate: z.coerce.date(),
    resolvedAddress: z.string().nullable(),
    lastKnownAddress: z.string().nullable(),
    batchNumber: z.string().nullable(),
    manufacturingDate: z.coerce.date().nullable(),
    expiryDate: z.coerce.date().nullable(),
    barcode: z.string(),
    eanCode: z.string(),
    attributes: z.record(z.string(), z.unknown()),
  }),
  variant: z.object({
    id: z.string(),
    name: z.string(),
    sku: z.string().nullable(),
    fullCode: z.string().nullable(),
    price: z.number(),
    costPrice: z.number().nullable(),
    barcode: z.string().nullable(),
    reference: z.string().nullable(),
    colorHex: z.string().nullable(),
    attributes: z.record(z.string(), z.unknown()),
  }),
  product: z.object({
    id: z.string(),
    name: z.string(),
    fullCode: z.string().nullable(),
    description: z.string().nullable(),
    attributes: z.record(z.string(), z.unknown()),
  }),
  manufacturer: z
    .object({
      id: z.string(),
      name: z.string(),
      legalName: z.string().nullable(),
      cnpj: z.string().nullable(),
      country: z.string(),
    })
    .nullable(),
  supplier: z
    .object({
      id: z.string(),
      name: z.string(),
      cnpj: z.string().nullable(),
    })
    .nullable(),
  template: z.object({
    id: z.string(),
    name: z.string(),
    unitOfMeasure: z.string(),
    productAttributes: z.record(z.string(), z.unknown()).nullable(),
    variantAttributes: z.record(z.string(), z.unknown()).nullable(),
    itemAttributes: z.record(z.string(), z.unknown()).nullable(),
  }),
  location: z
    .object({
      binId: z.string(),
      binAddress: z.string(),
      zoneId: z.string(),
      zoneCode: z.string(),
      zoneName: z.string(),
      warehouseId: z.string(),
      warehouseCode: z.string(),
      warehouseName: z.string(),
    })
    .nullable(),
  tenant: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export async function getItemsLabelDataController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/items/label-data',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ITEMS.LIST,
        resource: 'items',
      }),
    ],
    schema: {
      tags: ['Stock - Items'],
      summary: 'Get label data for multiple items (presenter)',
      body: z.object({
        itemIds: z.array(z.uuid()).min(1).max(100),
      }),
      response: {
        200: z.object({
          labelData: z.array(itemLabelDataSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { itemIds } = request.body;

      const items = await prisma.item.findMany({
        where: {
          id: { in: itemIds },
          tenantId,
          deletedAt: null,
        },
        include: {
          variant: {
            include: {
              product: {
                include: {
                  manufacturer: true,
                  supplier: true,
                  template: true,
                },
              },
            },
          },
          bin: {
            include: {
              zone: {
                include: {
                  warehouse: true,
                },
              },
            },
          },
        },
      });

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true },
      });

      const labelData = items.map((item) => {
        const variant = item.variant;
        const product = variant.product;
        const manufacturer = product.manufacturer;
        const supplier = product.supplier;
        const template = product.template;
        const bin = item.bin;
        const zone = bin?.zone;
        const warehouse = zone?.warehouse;

        return {
          item: {
            id: item.id,
            uniqueCode: item.uniqueCode,
            fullCode: item.fullCode,
            sequentialCode: item.sequentialCode,
            currentQuantity: Number(item.currentQuantity),
            initialQuantity: Number(item.initialQuantity),
            unitCost: item.unitCost ? Number(item.unitCost) : null,
            status: item.status,
            entryDate: item.entryDate,
            resolvedAddress: bin?.address ?? null,
            lastKnownAddress: item.lastKnownAddress,
            batchNumber: item.batchNumber,
            manufacturingDate: item.manufacturingDate,
            expiryDate: item.expiryDate,
            barcode: item.barcode,
            eanCode: item.eanCode,
            attributes: (item.attributes as Record<string, unknown>) ?? {},
          },
          variant: {
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            fullCode: variant.fullCode,
            price: Number(variant.price),
            costPrice: variant.costPrice ? Number(variant.costPrice) : null,
            barcode: variant.barcode,
            reference: variant.reference,
            colorHex: variant.colorHex,
            attributes: (variant.attributes as Record<string, unknown>) ?? {},
          },
          product: {
            id: product.id,
            name: product.name,
            fullCode: product.fullCode,
            description: product.description,
            attributes: (product.attributes as Record<string, unknown>) ?? {},
          },
          manufacturer: manufacturer
            ? {
                id: manufacturer.id,
                name: manufacturer.name,
                legalName: manufacturer.legalName,
                cnpj: manufacturer.cnpj,
                country: manufacturer.country ?? '',
              }
            : null,
          supplier: supplier
            ? {
                id: supplier.id,
                name: supplier.name,
                cnpj: supplier.cnpj,
              }
            : null,
          template: {
            id: template.id,
            name: template.name,
            unitOfMeasure: template.unitOfMeasure,
            productAttributes:
              (template.productAttributes as Record<string, unknown>) ?? null,
            variantAttributes:
              (template.variantAttributes as Record<string, unknown>) ?? null,
            itemAttributes:
              (template.itemAttributes as Record<string, unknown>) ?? null,
          },
          location: bin
            ? {
                binId: bin.id,
                binAddress: bin.address,
                zoneId: zone!.id,
                zoneCode: zone!.code,
                zoneName: zone!.name,
                warehouseId: warehouse!.id,
                warehouseCode: warehouse!.code,
                warehouseName: warehouse!.name,
              }
            : null,
          tenant: {
            id: tenant?.id ?? tenantId,
            name: tenant?.name ?? '',
          },
        };
      });

      return reply.status(200).send({ labelData });
    },
  });
}
