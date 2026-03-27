import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac/permission-codes';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { rejectAdmissionSchema } from '@/http/schemas/hr/admission';
import { makeRejectAdmissionUseCase } from '@/use-cases/hr/admissions/factories/make-reject-admission-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1RejectAdmissionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/admissions/:id/reject',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ADMISSIONS.ADMIN,
        resource: 'admissions',
      }),
    ],
    schema: {
      tags: ['HR - Admissions'],
      summary: 'Reject admission',
      params: z.object({ id: z.string().uuid() }),
      body: rejectAdmissionSchema,
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeRejectAdmissionUseCase();
        const { invite } = await useCase.execute({
          tenantId,
          inviteId: id,
          reason: request.body.reason,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ADMISSION_REJECT,
          entityId: id,
          placeholders: {
            userName: request.user.sub,
            candidateName: invite.fullName,
          },
        });

        return reply.status(200).send({ message: 'Admission rejected' });
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
