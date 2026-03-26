import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateCipaMandateSchema,
  cipaMandateResponseSchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas';
import { cipaMandateToDTO } from '@/mappers/hr/cipa-mandate';
import { makeUpdateCipaMandateUseCase } from '@/use-cases/hr/cipa-mandates/factories/make-update-cipa-mandate-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateCipaMandateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/cipa-mandates/:mandateId',
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
      summary: 'Update CIPA mandate',
      description: 'Updates an existing CIPA mandate',
      params: z.object({
        mandateId: idSchema,
      }),
      body: updateCipaMandateSchema,
      response: {
        200: z.object({
          cipaMandate: cipaMandateResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { mandateId } = request.params;
      const data = request.body;

      try {
        const useCase = makeUpdateCipaMandateUseCase();
        const { cipaMandate } = await useCase.execute({
          tenantId,
          mandateId,
          ...data,
        });

        return reply
          .status(200)
          .send({ cipaMandate: cipaMandateToDTO(cipaMandate) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
