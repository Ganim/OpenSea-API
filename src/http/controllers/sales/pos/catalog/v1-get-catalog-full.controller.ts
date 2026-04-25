import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import {
  getCatalogFullQuerySchema,
  getCatalogFullResponseSchema,
} from '@/http/schemas/sales/pos/get-catalog-full.schema';
import { verifyDeviceToken } from '@/http/middlewares/verify-device-token';
import { makeGetCatalogFullUseCase } from '@/use-cases/sales/pos-catalog/factories/make-get-catalog-full-use-case';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import type { VerifiedDeviceContext } from '@/http/middlewares/verify-device-token';

type RequestWithDevice = FastifyRequest & { device?: VerifiedDeviceContext };

/**
 * GET /v1/pos/catalog/full?cursor=<uuid>&limit=<n>
 *
 * Cursor-paginated full catalog snapshot for a paired POS device.
 *
 * Use cases:
 *  - Initial sync — the device has no local catalog yet and bootstraps from
 *    page 0 (no `cursor`).
 *  - Recovery sync — the delta endpoint declined to ship because the
 *    incremental window grew too large; the device discards local state and
 *    re-bootstraps via this endpoint.
 *
 * Authentication is exclusively via the `Authorization: Bearer` device token
 * (paired through `POST /v1/pos/terminals/:id/pair-self`); this endpoint does
 * NOT accept a JWT and is NOT covered by RBAC permission codes.
 *
 * Response shape (see `getCatalogFullResponseSchema` for the full contract):
 *  - `currentTimestamp`: server-side timestamp the device should persist on
 *    the *last* page so the next sync can run in delta mode.
 *  - `nextCursor`: the last `Item.id` returned in this page when more pages
 *    remain, otherwise `null`. The device passes it back as `cursor` to fetch
 *    the next page.
 *  - `terminalConfig`, `terminalZoneLinks`, `zones`, `operators`,
 *    `fiscalConfig`: small bounded sets, shipped in full on every page so the
 *    UI can render before the catalog finishes paginating.
 *  - `products`, `variants`, `items`, `promotions`: scoped to the items in
 *    the current page. The device must merge by id across pages — the same
 *    merge strategy delta sync already requires.
 */
export async function v1GetCatalogFullController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/catalog/full',
    preHandler: [verifyDeviceToken],
    schema: {
      tags: ['POS - Catalog'],
      summary: 'Cursor-paginated full catalog sync for a paired POS device',
      description:
        'Returns the full catalog scoped to the authenticated terminal in cursor-paginated pages. Use this endpoint for initial sync (no local state) or recovery sync (delta window too large). Authenticated via `Authorization: Bearer <device-token>` (no JWT/RBAC). Pagination is over `Item.id ASC` (UUID lex order).',
      querystring: getCatalogFullQuerySchema,
      response: {
        200: getCatalogFullResponseSchema,
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

      const { cursor, limit } = request.query;

      try {
        const getCatalogFullUseCase = makeGetCatalogFullUseCase();
        const {
          currentTimestamp,
          nextCursor,
          terminal,
          terminalZoneLinks,
          zones,
          products,
          variants,
          items,
          promotions,
          operators,
          fiscalConfig,
        } = await getCatalogFullUseCase.execute({
          tenantId: device.tenantId,
          terminalId: device.terminalId,
          cursor,
          limit,
        });

        return reply.status(200).send({
          currentTimestamp,
          nextCursor,
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
