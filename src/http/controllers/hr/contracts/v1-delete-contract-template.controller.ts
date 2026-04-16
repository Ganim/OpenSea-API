import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { contractTemplateIdParamSchema } from '@/http/schemas/hr';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import {
  makeDeleteContractTemplateUseCase,
  makeGetContractTemplateUseCase,
} from '@/use-cases/hr/contracts/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1DeleteContractTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/contract-templates/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.CONTRACTS.REMOVE,
        resource: 'contract-templates',
      }),
    ],
    schema: {
      tags: ['HR - Contracts'],
      summary: 'Soft-delete a contract template',
      description:
        'Marks the contract template as deleted. Previously generated contracts referencing the template are preserved.',
      params: contractTemplateIdParamSchema,
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : (user.username ?? user.email);

        const getContractTemplateUseCase = makeGetContractTemplateUseCase();
        const { template } = await getContractTemplateUseCase.execute({
          tenantId,
          templateId: id,
        });

        const deleteContractTemplateUseCase =
          makeDeleteContractTemplateUseCase();
        await deleteContractTemplateUseCase.execute({
          tenantId,
          templateId: id,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.CONTRACT_TEMPLATE_DELETE,
          entityId: template.id.toString(),
          placeholders: { userName, templateName: template.name },
          oldData: { name: template.name, type: template.type },
        });

        return reply
          .status(200)
          .send({ message: 'Contract template deleted successfully' });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
