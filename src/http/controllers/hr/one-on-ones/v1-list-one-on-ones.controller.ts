import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listOneOnOneMeetingsQuerySchema,
  listOneOnOneMeetingsResponseSchema,
} from '@/http/schemas/hr/one-on-ones';
import { oneOnOneMeetingToDTO } from '@/mappers/hr/one-on-one-meeting';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { makeListOneOnOnesUseCase } from '@/use-cases/hr/one-on-ones/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListOneOnOnesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/one-on-ones',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ONE_ON_ONES.ACCESS,
        resource: 'one-on-ones',
      }),
    ],
    schema: {
      tags: ['HR - One-on-Ones'],
      summary: 'Lista as reuniões 1:1 do colaborador logado',
      description:
        'Retorna todas as reuniões 1:1 onde o usuário logado participa como gestor ou liderado.',
      querystring: listOneOnOneMeetingsQuerySchema,
      response: {
        200: listOneOnOneMeetingsResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { page, perPage, status, from, to, role } = request.query;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee } = await getMyEmployeeUseCase.execute({
          tenantId,
          userId,
        });

        const listOneOnOnesUseCase = makeListOneOnOnesUseCase();
        const result = await listOneOnOnesUseCase.execute({
          tenantId,
          participantEmployeeId: employee.id.toString(),
          page,
          perPage,
          status,
          from,
          to,
          role,
        });

        const meetings = result.meetings.map((meeting) =>
          oneOnOneMeetingToDTO(meeting, {
            viewerIsManager: meeting.isManager(employee.id),
            viewerIsReport: meeting.isReport(employee.id),
          }),
        );

        return reply.status(200).send({ meetings, meta: result.meta });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
