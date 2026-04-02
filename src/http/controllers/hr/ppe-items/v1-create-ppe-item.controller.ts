import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createPPEItemSchema,
  ppeItemResponseSchema,
} from '@/http/schemas/hr/safety';
import { ppeItemToDTO } from '@/mappers/hr/ppe-item';
import { makeCreatePPEItemUseCase } from '@/use-cases/hr/ppe-items/factories/make-create-ppe-item-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreatePPEItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/ppe-items',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PPE.REGISTER,
        resource: 'ppe-items',
      }),
    ],
    schema: {
      tags: ['HR - PPE (EPI)'],
      summary: 'Create PPE item',
      description:
        'Creates a new PPE item (Equipamento de Proteção Individual)',
      body: createPPEItemSchema,
      response: {
        201: z.object({
          ppeItem: ppeItemResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeCreatePPEItemUseCase();
        const { ppeItem } = await useCase.execute({
          tenantId,
          ...data,
        });

        return reply.status(201).send({ ppeItem: ppeItemToDTO(ppeItem) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
