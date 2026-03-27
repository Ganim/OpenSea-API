import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac/permission-codes';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCancelAdmissionInviteUseCase } from '@/use-cases/hr/admissions/factories/make-cancel-admission-invite-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CancelAdmissionInviteController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/admissions/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ADMISSIONS.REMOVE,
        resource: 'admissions',
      }),
    ],
    schema: {
      tags: ['HR - Admissions'],
      summary: 'Cancel admission invite',
      params: z.object({ id: z.string().uuid() }),
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
        const useCase = makeCancelAdmissionInviteUseCase();
        const { invite } = await useCase.execute({
          tenantId,
          inviteId: id,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ADMISSION_INVITE_CANCEL,
          entityId: id,
          placeholders: {
            userName: request.user.sub,
            candidateName: invite.fullName,
          },
        });

        return reply
          .status(200)
          .send({ message: 'Admission invite cancelled' });
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
