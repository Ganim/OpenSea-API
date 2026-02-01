import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeCreateTenantUseCase } from '@/use-cases/core/tenants/factories/make-create-tenant-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createTenantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/tenants',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Core - Tenants'],
      summary: 'Create a new tenant',
      description:
        'Creates a new tenant organization. The authenticated user becomes the owner of the tenant.',
      body: z.object({
        name: z.string().min(2).max(100),
        slug: z
          .string()
          .min(2)
          .max(50)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
            message:
              'Slug must contain only lowercase letters, numbers, and hyphens',
          })
          .optional(),
      }),
      response: {
        201: z.object({
          tenant: z.object({
            id: z.string(),
            name: z.string(),
            slug: z.string(),
            status: z.string(),
            createdAt: z.coerce.date(),
          }),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { name, slug } = request.body;

      try {
        const createTenantUseCase = makeCreateTenantUseCase();
        const { tenant } = await createTenantUseCase.execute({
          name,
          slug,
          userId,
        });

        return reply.status(201).send({ tenant });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
