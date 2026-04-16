import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { checkInlinePermission } from '@/http/helpers/check-inline-permission';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { oneOnOneMeetingIdParamsSchema } from '@/http/schemas/hr/one-on-ones';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { makeDeleteOneOnOneUseCase } from '@/use-cases/hr/one-on-ones/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteOneOnOneController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/one-on-ones/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ONE_ON_ONES.REMOVE,
        resource: 'one-on-ones',
      }),
    ],
    schema: {
      tags: ['HR - One-on-Ones'],
      summary: 'Remove uma reunião 1:1 (soft delete)',
      description:
        'Apenas o gestor da reunião ou usuários com hr.one-on-ones.admin podem remover.',
      params: oneOnOneMeetingIdParamsSchema,
      response: {
        204: z.null(),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee } = await getMyEmployeeUseCase.execute({
          tenantId,
          userId,
        });

        let canAdmin = false;
        try {
          await checkInlinePermission(
            request,
            PermissionCodes.HR.ONE_ON_ONES.ADMIN,
          );
          canAdmin = true;
        } catch {
          canAdmin = false;
        }

        const deleteOneOnOneUseCase = makeDeleteOneOnOneUseCase();
        await deleteOneOnOneUseCase.execute({
          tenantId,
          meetingId: id,
          viewerEmployeeId: employee.id.toString(),
          canAdmin,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ONE_ON_ONE_DELETE,
          entityId: id,
          placeholders: { userName: userId, counterpartName: '—' },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
