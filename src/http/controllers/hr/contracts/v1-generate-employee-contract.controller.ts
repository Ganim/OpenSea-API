import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  employeeContractsParamSchema,
  generateContractBodySchema,
  generateContractResponseSchema,
} from '@/http/schemas/hr';
import { generatedEmploymentContractToDTO } from '@/mappers/hr/generated-employment-contract';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import {
  makeGenerateContractPDFUseCase,
  makeGetContractTemplateUseCase,
} from '@/use-cases/hr/contracts/factories';
import { makeGetEmployeeByIdUseCase } from '@/use-cases/hr/employees/factories/make-get-employee-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GenerateEmployeeContractController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/:id/contracts/generate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.CONTRACTS.REGISTER,
        resource: 'contracts',
      }),
    ],
    schema: {
      tags: ['HR - Contracts'],
      summary: 'Generate a contract PDF for an employee',
      description:
        'Renders the chosen template against the employee data (plus any additionalVars supplied), produces an A4 PDF, uploads it to object storage and returns the persisted contract record together with the PDF URL and a base64 copy ready to download.',
      params: employeeContractsParamSchema,
      body: generateContractBodySchema,
      response: {
        201: generateContractResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const generatedByUserId = request.user.sub;
      const { id: employeeId } = request.params;
      const { templateId, additionalVars, companyName, companyCnpj } =
        request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({
          userId: generatedByUserId,
        });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : (user.username ?? user.email);

        // Fetch template + employee names up-front for the audit log.
        const getContractTemplateUseCase = makeGetContractTemplateUseCase();
        const { template } = await getContractTemplateUseCase.execute({
          tenantId,
          templateId,
        });

        const getEmployeeByIdUseCase = makeGetEmployeeByIdUseCase();
        const { employee } = await getEmployeeByIdUseCase.execute({
          employeeId,
          tenantId,
        });

        const generateContractPDFUseCase = makeGenerateContractPDFUseCase();
        const { contract, pdfUrl, base64 } =
          await generateContractPDFUseCase.execute({
            tenantId,
            employeeId,
            templateId,
            generatedByUserId,
            additionalVars,
            companyName,
            companyCnpj,
          });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.EMPLOYEE_CONTRACT_GENERATE,
          entityId: contract.id.toString(),
          placeholders: {
            userName,
            templateName: template.name,
            employeeName: employee.fullName,
          },
          newData: {
            templateId,
            employeeId,
            pdfKey: contract.pdfKey,
          },
        });

        return reply.status(201).send({
          contract: generatedEmploymentContractToDTO(contract),
          pdfUrl,
          base64,
        });
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
