import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import {
  configureFocusNfeRequestSchema,
  configureFocusNfeResponseSchema,
} from '@/http/schemas/sales/invoicing/invoicing.schema';
import { makeConfigureFocusNfeUseCase } from '@/use-cases/sales/invoicing/factories/make-invoicing-use-cases';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ConfigureFocusNfeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sales/invoicing/config',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Sales - Invoicing'],
      summary: 'Configure Focus NFe integration',
      description:
        'Configures or updates Focus NFe API settings (super admin only)',
      body: configureFocusNfeRequestSchema,
      response: {
        200: configureFocusNfeResponseSchema,
        400: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { apiKey, productionMode, autoIssueOnConfirm, defaultSeries } =
        request.body;

      try {
        const useCase = makeConfigureFocusNfeUseCase();
        const result = await useCase.execute({
          tenantId: request.user.tenantId || 'system', // TODO: usar tenant selecionado
          apiKey,
          productionMode,
          autoIssueOnConfirm,
          defaultSeries,
          userId,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Failed to connect')
        ) {
          return reply.status(400).send({ message: error.message });
        }

        return reply.status(500).send({
          message:
            error instanceof Error ? error.message : 'Internal server error',
        });
      }
    },
  });
}
