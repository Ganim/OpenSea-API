import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  formSubmissionResponseSchema,
  submitFormSchema,
} from '@/http/schemas/sales/forms/form.schema';
import { makeSubmitFormUseCase } from '@/use-cases/sales/forms/factories/make-submit-form-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function submitFormController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/forms/:id/submit',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Sales - Forms'],
      summary: 'Submit data to a published form',
      params: z.object({ id: z.string().uuid() }),
      body: submitFormSchema,
      response: {
        201: z.object({ submission: formSubmissionResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const body = request.body;

      try {
        const useCase = makeSubmitFormUseCase();
        const { submission } = await useCase.execute({
          tenantId,
          formId: id,
          data: body.data,
          submittedBy: body.submittedBy ?? userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.FORM_SUBMISSION_CREATE,
          entityId: submission.id,
          placeholders: { formTitle: 'N/A' },
          newData: { formId: id },
        });

        return reply.status(201).send({ submission });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
