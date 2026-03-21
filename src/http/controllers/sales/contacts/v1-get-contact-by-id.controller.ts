import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { contactResponseSchema } from '@/http/schemas';
import { contactToDTO } from '@/mappers/sales/contact/contact-to-dto';
import { makeGetContactByIdUseCase } from '@/use-cases/sales/contacts/factories/make-get-contact-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getContactByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/contacts/:contactId',
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
      summary: 'Get a contact by ID',
      params: z.object({
        contactId: z.string().uuid().describe('Contact UUID'),
      }),
      response: {
        200: z.object({
          contact: contactResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { contactId } = request.params;

      const getContactByIdUseCase = makeGetContactByIdUseCase();
      const { contact } = await getContactByIdUseCase.execute({
        id: contactId,
        tenantId,
      });

      return reply.status(200).send({ contact: contactToDTO(contact) });
    },
  });
}
