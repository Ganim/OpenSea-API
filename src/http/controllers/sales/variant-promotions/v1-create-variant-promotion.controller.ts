import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
    createVariantPromotionSchema,
    variantPromotionResponseSchema,
} from '@/http/schemas/sales.schema';
import { makeCreateVariantPromotionUseCase } from '@/use-cases/sales/variant-promotions/factories/make-create-variant-promotion-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createVariantPromotionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/variant-promotions',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PROMOTIONS.CREATE,
        resource: 'variant-promotions',
      }),
    ],
    schema: {
      tags: ['Sales - Variant Promotions'],
      summary: 'Create a new variant promotion',
      body: createVariantPromotionSchema,
      response: {
        201: z.object({ promotion: variantPromotionResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeCreateVariantPromotionUseCase();
        const { promotion } = await useCase.execute(request.body);
        return reply.status(201).send({ promotion });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
