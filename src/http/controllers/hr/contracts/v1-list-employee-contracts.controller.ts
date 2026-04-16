import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  employeeContractsParamSchema,
  employeeContractsResponseSchema,
} from '@/http/schemas/hr';
import { generatedEmploymentContractToDTO } from '@/mappers/hr/generated-employment-contract';
import { makeListEmployeeContractsUseCase } from '@/use-cases/hr/contracts/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListEmployeeContractsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/employees/:id/contracts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.CONTRACTS.ACCESS,
        resource: 'contracts',
      }),
    ],
    schema: {
      tags: ['HR - Contracts'],
      summary: 'List generated contracts for an employee',
      description:
        'Returns the history of generated employment contracts for the given employee, newest first.',
      params: employeeContractsParamSchema,
      response: {
        200: employeeContractsResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: employeeId } = request.params;

      try {
        const useCase = makeListEmployeeContractsUseCase();
        const { contracts } = await useCase.execute({ tenantId, employeeId });

        return reply.status(200).send({
          contracts: contracts.map(generatedEmploymentContractToDTO),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
