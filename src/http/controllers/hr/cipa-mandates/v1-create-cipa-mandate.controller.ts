import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createCipaMandateSchema,
  cipaMandateResponseSchema,
} from '@/http/schemas';
import { cipaMandateToDTO } from '@/mappers/hr/cipa-mandate';
import { makeCreateCipaMandateUseCase } from '@/use-cases/hr/cipa-mandates/factories/make-create-cipa-mandate-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateCipaMandateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/cipa-mandates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SAFETY.ADMIN,
        resource: 'cipa-mandates',
      }),
    ],
    schema: {
      tags: ['HR - CIPA'],
      summary: 'Create CIPA mandate',
      description: 'Creates a new CIPA mandate',
      body: createCipaMandateSchema,
      response: {
        201: z.object({
          cipaMandate: cipaMandateResponseSchema,
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
        const useCase = makeCreateCipaMandateUseCase();
        const { cipaMandate } = await useCase.execute({
          tenantId,
          ...data,
        });

        return reply
          .status(201)
          .send({ cipaMandate: cipaMandateToDTO(cipaMandate) });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
