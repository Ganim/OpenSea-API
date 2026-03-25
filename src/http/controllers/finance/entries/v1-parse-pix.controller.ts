import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { parsePixSchema, parsePixResponseSchema } from '@/http/schemas/finance';
import { makeParsePixUseCase } from '@/use-cases/finance/entries/factories/make-parse-pix-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function parsePixController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/parse-pix',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.REGISTER,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Parse a Pix code (Copia e Cola or key)',
      security: [{ bearerAuth: [] }],
      body: parsePixSchema,
      response: {
        200: z.object({ pix: parsePixResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { code } = request.body as { code: string };

      try {
        const useCase = makeParsePixUseCase();
        const result = await useCase.execute({ code });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
