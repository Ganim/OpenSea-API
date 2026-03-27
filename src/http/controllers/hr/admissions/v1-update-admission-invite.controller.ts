import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac/permission-codes';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  admissionInviteResponseSchema,
  updateAdmissionInviteSchema,
} from '@/http/schemas/hr/admission';
import { makeUpdateAdmissionInviteUseCase } from '@/use-cases/hr/admissions/factories/make-update-admission-invite-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateAdmissionInviteController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/admissions/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ADMISSIONS.MODIFY,
        resource: 'admissions',
      }),
    ],
    schema: {
      tags: ['HR - Admissions'],
      summary: 'Update admission invite',
      description: 'Updates an admission invite before it is sent or completed',
      params: z.object({ id: z.string().uuid() }),
      body: updateAdmissionInviteSchema,
      response: {
        200: z.object({ invite: admissionInviteResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeUpdateAdmissionInviteUseCase();
        const { invite } = await useCase.execute({
          tenantId,
          inviteId: id,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ADMISSION_INVITE_UPDATE,
          entityId: id,
          placeholders: {
            userName: request.user.sub,
            candidateName: invite.fullName,
          },
          newData: request.body as Record<string, unknown>,
        });

        return reply.status(200).send({ invite });
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
