import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import {
  getCatalogDeltaQuerySchema,
  getCatalogDeltaResponseSchema,
} from '@/http/schemas/sales/pos/get-catalog-delta.schema';
import { verifyDeviceToken } from '@/http/middlewares/verify-device-token';
import { makeGetCatalogDeltaUseCase } from '@/use-cases/sales/pos-catalog/factories/make-get-catalog-delta-use-case';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import type { VerifiedDeviceContext } from '@/http/middlewares/verify-device-token';

type RequestWithDevice = FastifyRequest & { device?: VerifiedDeviceContext };

/**
 * GET /v1/pos/catalog/delta?since=ISO
 *
 * Returns an incremental snapshot of the catalog scope for the authenticated
 * POS device. Authentication is exclusively via the `Authorization: Bearer`
 * device token (paired through `POST /v1/pos/terminals/:id/pair-self`); this
 * endpoint does NOT accept a JWT and is NOT covered by RBAC permission codes.
 *
 * Response shape (see `getCatalogDeltaResponseSchema` for the full contract):
 *  - `currentTimestamp`: server-side timestamp for the next `since` cursor.
 *  - `terminalConfig`: minimal terminal metadata the device needs to honor
 *    operator-session and coordination rules.
 *  - `terminalZoneLinks`: zoneId + tier (PRIMARY/SECONDARY) for every zone
 *    associated with the terminal.
 *  - `zones / products / variants / items`: the catalog rows scoped to the
 *    terminal's zones. When `since` is provided, only rows updated after the
 *    timestamp are returned.
 *  - `promotions`: currently-valid `VariantPromotion`s covering the variants
 *    in scope. Always shipped in full (timing windows are absolute).
 *  - `operators`: active employees authorized to operate this terminal.
 *  - `fiscalConfig`: tenant-wide fiscal emission config, or `null` when the
 *    tenant has not yet configured fiscal emission.
 */
export async function v1GetCatalogDeltaController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/catalog/delta',
    preHandler: [verifyDeviceToken],
    schema: {
      tags: ['POS - Catalog'],
      summary: 'Incremental catalog sync for a paired POS device',
      description:
        'Returns the catalog rows (zones, products, variants, items, promotions, operators and fiscal config) scoped to the authenticated terminal. When `since` is provided, only rows with `updatedAt >= since` are included. Authenticated via `Authorization: Bearer <device-token>` (no JWT/RBAC).',
      querystring: getCatalogDeltaQuerySchema,
      response: {
        200: getCatalogDeltaResponseSchema,
        401: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const device = (request as RequestWithDevice).device;
      if (!device) {
        throw new UnauthorizedError(
          'Device context missing — verifyDeviceToken did not run.',
        );
      }

      const { since } = request.query;

      try {
        const getCatalogDeltaUseCase = makeGetCatalogDeltaUseCase();
        const {
          currentTimestamp,
          terminal,
          terminalZoneLinks,
          zones,
          products,
          variants,
          items,
          promotions,
          operators,
          fiscalConfig,
        } = await getCatalogDeltaUseCase.execute({
          tenantId: device.tenantId,
          terminalId: device.terminalId,
          sinceDate: since,
        });

        return reply.status(200).send({
          currentTimestamp,
          terminalConfig: {
            id: terminal.id.toString(),
            terminalCode: terminal.terminalCode,
            terminalName: terminal.terminalName,
            mode: terminal.mode,
            operatorSessionMode: terminal.operatorSessionMode.value,
            operatorSessionTimeout: terminal.operatorSessionTimeout ?? null,
            autoCloseSessionAt: terminal.autoCloseSessionAt ?? null,
            coordinationMode: terminal.coordinationMode.value,
          },
          terminalZoneLinks,
          zones: zones.map((zone) => ({
            id: zone.zoneId.toString(),
            warehouseId: zone.warehouseId.toString(),
            code: zone.code,
            name: zone.name,
            description: zone.description,
            isActive: zone.isActive,
            allowsFractionalSale: zone.allowsFractionalSale,
            minFractionalSale: zone.minFractionalSale ?? null,
          })),
          products: products.map((product) => ({
            id: product.id.toString(),
            name: product.name,
            fullCode: product.fullCode,
            description: product.description,
            status: product.status.value,
            outOfLine: product.outOfLine,
            templateId: product.templateId.toString(),
            manufacturerId: product.manufacturerId?.toString(),
            attributes: product.attributes,
            updatedAt: product.updatedAt,
          })),
          variants: variants.map((variant) => ({
            id: variant.id.toString(),
            productId: variant.productId.toString(),
            sku: variant.sku,
            fullCode: variant.fullCode,
            name: variant.name,
            price: variant.price,
            barcode: variant.barcode,
            eanCode: variant.eanCode,
            upcCode: variant.upcCode,
            isActive: variant.isActive,
            fractionalAllowed: variant.fractionalAllowed,
            attributes: variant.attributes,
            updatedAt: variant.updatedAt,
          })),
          items: items.map((item) => ({
            id: item.id.toString(),
            variantId: item.variantId.toString(),
            binId: item.binId?.toString(),
            fullCode: item.fullCode,
            barcode: item.barcode,
            eanCode: item.eanCode,
            upcCode: item.upcCode,
            currentQuantity: item.currentQuantity,
            status: item.status.value,
            fractionalSaleEnabled: item.fractionalSaleEnabled,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            updatedAt: item.updatedAt,
          })),
          promotions: promotions.map((promotion) => ({
            id: promotion.id.toString(),
            variantId: promotion.variantId.toString(),
            name: promotion.name,
            discountType: promotion.discountType.value,
            discountValue: promotion.discountValue,
            startDate: promotion.startDate,
            endDate: promotion.endDate,
            isActive: promotion.isActive,
          })),
          operators: operators.map((employee) => ({
            id: employee.id.toString(),
            shortId: employee.shortId ?? null,
            fullName: employee.fullName,
            isActive: employee.isActive(),
          })),
          fiscalConfig: fiscalConfig
            ? {
                id: fiscalConfig.id.toString(),
                enabledDocumentTypes: fiscalConfig.enabledDocumentTypes.map(
                  (type) => type.value,
                ),
                defaultDocumentType: fiscalConfig.defaultDocumentType.value,
                emissionMode: fiscalConfig.emissionMode.value,
                certificatePath: fiscalConfig.certificatePath,
                nfceSeries: fiscalConfig.nfceSeries,
                nfceNextNumber: fiscalConfig.nfceNextNumber,
                satDeviceId: fiscalConfig.satDeviceId,
              }
            : null,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
