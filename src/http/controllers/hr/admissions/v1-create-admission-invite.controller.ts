import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac/permission-codes';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  admissionInviteResponseSchema,
  createAdmissionInviteSchema,
} from '@/http/schemas/hr/admission';
import { makeCreateAdmissionInviteUseCase } from '@/use-cases/hr/admissions/factories/make-create-admission-invite-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateAdmissionInviteController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/admissions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ADMISSIONS.REGISTER,
        resource: 'admissions',
      }),
    ],
    schema: {
      tags: ['HR - Admissions'],
      summary: 'Create a new admission invite',
      description:
        'Creates a new digital admission invite that generates a public link for the candidate',
      body: createAdmissionInviteSchema,
      response: {
        201: z.object({ invite: admissionInviteResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const createdBy = request.user.sub;

      try {
        const useCase = makeCreateAdmissionInviteUseCase();
        const { invite } = await useCase.execute({
          tenantId,
          createdBy,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ADMISSION_INVITE_CREATE,
          entityId: invite.id,
          placeholders: {
            userName: request.user.sub,
            candidateName: invite.fullName,
          },
          newData: request.body as Record<string, unknown>,
        });

        return reply.status(201).send({ invite });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
