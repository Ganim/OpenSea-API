import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  contractTemplateIdParamSchema,
  contractTemplateResponseSchema,
  updateContractTemplateBodySchema,
} from '@/http/schemas/hr';
import { contractTemplateToDTO } from '@/mappers/hr/contract-template';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeUpdateContractTemplateUseCase } from '@/use-cases/hr/contracts/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1UpdateContractTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/contract-templates/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.CONTRACTS.MODIFY,
        resource: 'contract-templates',
      }),
    ],
    schema: {
      tags: ['HR - Contracts'],
      summary: 'Update a contract template',
      description:
        'Patches an existing contract template. Sending isDefault=true will demote any other default template of the same type.',
      params: contractTemplateIdParamSchema,
      body: updateContractTemplateBodySchema,
      response: {
        200: z.object({ template: contractTemplateResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;
      const body = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : (user.username ?? user.email);

        const updateContractTemplateUseCase =
          makeUpdateContractTemplateUseCase();
        const { template } = await updateContractTemplateUseCase.execute({
          tenantId,
          templateId: id,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.CONTRACT_TEMPLATE_UPDATE,
          entityId: template.id.toString(),
          placeholders: { userName, templateName: template.name },
          newData: body,
        });

        return reply
          .status(200)
          .send({ template: contractTemplateToDTO(template) });
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
