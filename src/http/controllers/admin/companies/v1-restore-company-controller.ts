import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas/common.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeRestoreCompanyUseCase } from '@/use-cases/admin/companies/factories/make-companies';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1RestoreCompanyAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/admin/companies/:id/restore',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.COMPANIES.RESTORE,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['Admin - Companies'],
      summary: 'Restore a deleted company',
      description: 'Restores a soft-deleted company (admin scope)',
      params: z.object({
        id: idSchema,
      }),
      response: {
        200: z.object({
          success: z.boolean(),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const restoreCompanyUseCase = makeRestoreCompanyUseCase();
        const result = await restoreCompanyUseCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.COMPANY_CREATE, // Using COMPANY_CREATE as closest audit message for restore
          entityId: id,
          placeholders: {
            userName,
            companyName: id,
            cnpj: '',
          },
          newData: { action: 'restore', id },
        });

        return reply.status(200).send({ success: result.success });
      } catch (error) {
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
