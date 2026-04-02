import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGenerateAFDUseCase } from '@/use-cases/hr/time-control/factories/make-generate-afd-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GenerateAFDController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/time-control/afd',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.TIME_CONTROL.EXPORT,
        resource: 'time-control',
      }),
    ],
    schema: {
      tags: ['HR - Time Control'],
      summary: 'Generate AFD file',
      description:
        'Generates an AFD (Arquivo Fonte de Dados) file according to Portaria 671 Anexo III',
      querystring: z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      }),
      response: {
        200: z.any(),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { startDate, endDate } = request.query;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGenerateAFDUseCase();
        const { content, filename } = await useCase.execute({
          tenantId,
          startDate,
          endDate,
        });

        return reply
          .status(200)
          .header('Content-Type', 'text/plain; charset=utf-8')
          .header('Content-Disposition', `attachment; filename="${filename}"`)
          .send(content);
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
