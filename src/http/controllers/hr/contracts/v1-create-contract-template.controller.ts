import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  contractTemplateResponseSchema,
  createContractTemplateBodySchema,
} from '@/http/schemas/hr';
import { contractTemplateToDTO } from '@/mappers/hr/contract-template';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateContractTemplateUseCase } from '@/use-cases/hr/contracts/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CreateContractTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/contract-templates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.CONTRACTS.REGISTER,
        resource: 'contract-templates',
      }),
    ],
    schema: {
      tags: ['HR - Contracts'],
      summary: 'Create a contract template',
      description:
        'Creates a new HR contract template. Templates define the body of an employment contract with merge-field placeholders ({{employee.fullName}}, {{currency:employee.baseSalary}}, ...). When isDefault is true the previous default template of the same type is automatically demoted.',
      body: createContractTemplateBodySchema,
      response: {
        201: z.object({ template: contractTemplateResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { name, type, content, isActive, isDefault } = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : (user.username ?? user.email);

        const createContractTemplateUseCase =
          makeCreateContractTemplateUseCase();
        const { template } = await createContractTemplateUseCase.execute({
          tenantId,
          name,
          type,
          content,
          isActive,
          isDefault,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.CONTRACT_TEMPLATE_CREATE,
          entityId: template.id.toString(),
          placeholders: { userName, templateName: template.name },
          newData: {
            name: template.name,
            type: template.type,
            isActive: template.isActive,
            isDefault: template.isDefault,
          },
        });

        return reply
          .status(201)
          .send({ template: contractTemplateToDTO(template) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
