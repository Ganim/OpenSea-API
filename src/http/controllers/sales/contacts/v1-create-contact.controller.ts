import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { contactResponseSchema, createContactSchema } from '@/http/schemas';
import { contactToDTO } from '@/mappers/sales/contact/contact-to-dto';
import { makeCreateContactUseCase } from '@/use-cases/sales/contacts/factories/make-create-contact-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createContactController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/contacts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      // TODO: Add createPlanLimitsMiddleware('contacts') when PlanResource supports 'contacts'
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CONTACTS.REGISTER,
        resource: 'contacts',
      }),
    ],
    schema: {
      tags: ['Sales - Contacts'],
      summary: 'Create a new contact',
      body: createContactSchema,
      response: {
        201: z.object({
          contact: contactResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const createContactUseCase = makeCreateContactUseCase();
      const { contact } = await createContactUseCase.execute({
        tenantId,
        customerId: body.customerId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
        role: body.role,
        jobTitle: body.jobTitle,
        department: body.department,
        lifecycleStage: body.lifecycleStage,
        leadScore: body.leadScore,
        leadTemperature: body.leadTemperature,
        source: body.source,
        lastInteractionAt: body.lastInteractionAt,
        lastChannelUsed: body.lastChannelUsed,
        socialProfiles: body.socialProfiles,
        tags: body.tags,
        customFields: body.customFields,
        avatarUrl: body.avatarUrl,
        assignedToUserId: body.assignedToUserId,
        isMainContact: body.isMainContact,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CONTACT_CREATE,
        entityId: contact.id.toString(),
        placeholders: {
          userName: userId,
          contactName: contact.fullName,
        },
        newData: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          customerId: body.customerId,
        },
      });

      return reply.status(201).send({ contact: contactToDTO(contact) });
    },
  });
}
