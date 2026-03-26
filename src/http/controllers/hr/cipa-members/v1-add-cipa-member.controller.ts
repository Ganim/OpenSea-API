import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  addCipaMemberSchema,
  cipaMemberResponseSchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas';
import { cipaMemberToDTO } from '@/mappers/hr/cipa-member';
import { makeAddCipaMemberUseCase } from '@/use-cases/hr/cipa-members/factories/make-add-cipa-member-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1AddCipaMemberController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/cipa-mandates/:mandateId/members',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SAFETY.ADMIN,
        resource: 'cipa-members',
      }),
    ],
    schema: {
      tags: ['HR - CIPA'],
      summary: 'Add CIPA member',
      description:
        'Adds a new member to a CIPA mandate. Elected members (type=EMPREGADO) automatically receive job stability.',
      params: z.object({
        mandateId: idSchema,
      }),
      body: addCipaMemberSchema,
      response: {
        201: z.object({
          cipaMember: cipaMemberResponseSchema,
        }),
        400: z.object({
          message: z.string(),
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
        const useCase = makeAddCipaMemberUseCase();
        const { cipaMember } = await useCase.execute({
          tenantId,
          mandateId,
          ...data,
        });

        return reply
          .status(201)
          .send({ cipaMember: cipaMemberToDTO(cipaMember) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
