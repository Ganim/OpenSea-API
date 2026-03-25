import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeUpdateOverdueEscalationUseCase } from '@/use-cases/finance/escalations/factories/make-update-overdue-escalation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const escalationStepSchema = z.object({
  daysOverdue: z.number().int().min(1),
  channel: z.enum(['EMAIL', 'WHATSAPP', 'INTERNAL_NOTE', 'SYSTEM_ALERT']),
  templateType: z.enum([
    'FRIENDLY_REMINDER',
    'FORMAL_NOTICE',
    'URGENT_NOTICE',
    'FINAL_NOTICE',
  ]),
  subject: z.string().max(256).optional(),
  message: z.string().min(1),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0),
});

export async function updateOverdueEscalationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/finance/escalations/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ADMIN,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Escalations'],
      summary: 'Update an overdue escalation template',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        name: z.string().min(1).max(128).optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
        steps: z.array(escalationStepSchema).min(1).optional(),
      }),
      response: {
        200: z.object({
          escalation: z.any(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const { name, isDefault, isActive, steps } = request.body;

      const useCase = makeUpdateOverdueEscalationUseCase();
      const result = await useCase.execute({
        id,
        tenantId,
        name,
        isDefault,
        isActive,
        steps,
      });

      return reply.status(200).send(result);
    },
  });
}
