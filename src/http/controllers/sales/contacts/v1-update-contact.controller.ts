import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { contactResponseSchema, updateContactSchema } from '@/http/schemas';
import { contactToDTO } from '@/mappers/sales/contact/contact-to-dto';
import { makeGetContactByIdUseCase } from '@/use-cases/sales/contacts/factories/make-get-contact-by-id-use-case';
import { makeUpdateContactUseCase } from '@/use-cases/sales/contacts/factories/make-update-contact-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateContactController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/contacts/:contactId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CONTACTS.MODIFY,
        resource: 'contacts',
      }),
    ],
    schema: {
      tags: ['Sales - Contacts'],
      summary: 'Update a contact',
      params: z.object({
        contactId: z.string().uuid().describe('Contact UUID'),
      }),
      body: updateContactSchema,
      response: {
        200: z.object({
          contact: contactResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { contactId } = request.params;
      const body = request.body;

      const getContactByIdUseCase = makeGetContactByIdUseCase();
      const { contact: oldContact } = await getContactByIdUseCase.execute({
        id: contactId,
        tenantId,
      });

      const updateContactUseCase = makeUpdateContactUseCase();
      const { contact } = await updateContactUseCase.execute({
        id: contactId,
        tenantId,
        ...body,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CONTACT_UPDATE,
        entityId: contact.id.toString(),
        placeholders: {
          userName: userId,
          contactName: contact.fullName,
        },
        oldData: {
          firstName: oldContact.firstName,
          lastName: oldContact.lastName,
          email: oldContact.email,
        },
        newData: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
        },
      });

      return reply.status(200).send({ contact: contactToDTO(contact) });
    },
  });
}
