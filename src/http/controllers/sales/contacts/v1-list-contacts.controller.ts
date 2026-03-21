import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { contactResponseSchema, listContactsQuerySchema } from '@/http/schemas';
import { contactToDTO } from '@/mappers/sales/contact/contact-to-dto';
import { makeListContactsUseCase } from '@/use-cases/sales/contacts/factories/make-list-contacts-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listContactsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/contacts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CONTACTS.ACCESS,
        resource: 'contacts',
      }),
    ],
    schema: {
      tags: ['Sales - Contacts'],
      summary: 'List all contacts',
      querystring: listContactsQuerySchema,
      response: {
        200: z.object({
          contacts: z.array(contactResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const {
        page,
        limit,
        search,
        customerId,
        lifecycleStage,
        leadTemperature,
        assignedToUserId,
        sortBy,
        sortOrder,
      } = request.query;

      const listContactsUseCase = makeListContactsUseCase();
      const { contacts, total, totalPages } =
        await listContactsUseCase.execute({
          tenantId,
          page,
          limit,
          search,
          customerId,
          lifecycleStage,
          leadTemperature,
          assignedToUserId,
          sortBy,
          sortOrder,
        });

      return reply.status(200).send({
        contacts: contacts.map(contactToDTO),
        meta: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      });
    },
  });
}
