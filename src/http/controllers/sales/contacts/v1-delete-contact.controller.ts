import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteContactUseCase } from '@/use-cases/sales/contacts/factories/make-delete-contact-use-case';
import { makeGetContactByIdUseCase } from '@/use-cases/sales/contacts/factories/make-get-contact-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteContactController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/contacts/:contactId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CONTACTS.REMOVE,
        resource: 'contacts',
      }),
    ],
    schema: {
      tags: ['Sales - Contacts'],
      summary: 'Delete a contact',
      params: z.object({
        contactId: z.string().uuid().describe('Contact UUID'),
      }),
      response: {
        204: z.null(),
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

      const getContactByIdUseCase = makeGetContactByIdUseCase();
      const { contact } = await getContactByIdUseCase.execute({
        id: contactId,
        tenantId,
      });

      const deleteContactUseCase = makeDeleteContactUseCase();
      await deleteContactUseCase.execute({ id: contactId, tenantId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CONTACT_DELETE,
        entityId: contactId,
        placeholders: {
          userName: userId,
          contactName: contact.fullName,
        },
        oldData: {
          id: contact.id.toString(),
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
        },
      });

      return reply.status(204).send(null);
    },
  });
}
