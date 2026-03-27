import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  cadenceEnrollmentResponseSchema,
  enrollContactSchema,
} from '@/http/schemas/sales/cadences/cadence.schema';
import { makeEnrollContactUseCase } from '@/use-cases/sales/cadence-sequences/factories/make-enroll-contact-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function enrollContactController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/cadences/:id/enroll',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CADENCES.EXECUTE,
        resource: 'cadences',
      }),
    ],
    schema: {
      tags: ['Sales - Cadences'],
      summary: 'Enroll a contact or deal in a cadence sequence',
      params: z.object({ id: z.string().uuid() }),
      body: enrollContactSchema,
      response: {
        201: z.object({
          enrollment: cadenceEnrollmentResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const body = request.body;

      try {
        const useCase = makeEnrollContactUseCase();
        const { enrollment } = await useCase.execute({
          sequenceId: id,
          tenantId,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CADENCE_ENROLL,
          entityId: enrollment.id,
          placeholders: { userName: userId, cadenceName: id },
          newData: {
            sequenceId: id,
            contactId: body.contactId,
            dealId: body.dealId,
          },
        });

        return reply.status(201).send({ enrollment });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
