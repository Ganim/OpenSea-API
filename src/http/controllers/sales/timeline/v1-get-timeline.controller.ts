import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { timelineItemResponseSchema } from '@/http/schemas/sales/timeline';
import { makeGetTimelineUseCase } from '@/use-cases/sales/timeline/factories/make-get-timeline-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getTimelineController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/timeline',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ACTIVITIES.ACCESS,
        resource: 'activities',
      }),
    ],
    schema: {
      tags: ['Sales - Timeline'],
      summary: 'Get merged timeline (activities + events)',
      querystring: z.object({
        page: z.coerce
          .number()
          .int()
          .positive()
          .default(1)
          .describe('Page number (starts at 1)'),
        limit: z.coerce
          .number()
          .int()
          .positive()
          .max(100)
          .default(20)
          .describe('Items per page (max 100)'),
        contactId: z
          .string()
          .uuid()
          .optional()
          .describe('Filter by contact ID'),
        customerId: z
          .string()
          .uuid()
          .optional()
          .describe('Filter by customer ID'),
        dealId: z
          .string()
          .uuid()
          .optional()
          .describe('Filter by deal ID'),
      }),
      response: {
        200: z.object({
          items: z.array(timelineItemResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            totalPages: z.number(),
          }),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, contactId, customerId, dealId } = request.query;

      // Validate at least one entity ID is provided
      if (!contactId && !customerId && !dealId) {
        return reply.status(400).send({
          message:
            'At least one entity ID (contactId, customerId, or dealId) is required',
        });
      }

      const useCase = makeGetTimelineUseCase();
      const { items, meta } = await useCase.execute({
        tenantId,
        contactId,
        customerId,
        dealId,
        page,
        limit,
      });

      return reply.status(200).send({ items, meta });
    },
  });
}
