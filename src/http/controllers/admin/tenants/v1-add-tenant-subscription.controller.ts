import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeAddTenantSubscriptionUseCase } from '@/use-cases/admin/subscriptions/factories/make-add-tenant-subscription';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { presentTenantSubscription } from './presenters';

export async function v1AddTenantSubscriptionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/tenants/:tenantId/subscription',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenant Subscriptions'],
      summary: 'Add tenant subscription (super admin)',
      description:
        'Adds a new skill subscription to a tenant. Validates that the skill exists and the tenant does not already have an active subscription for it.',
      params: z.object({
        tenantId: z.string().uuid(),
      }),
      body: z.object({
        skillCode: z.string().min(1),
        quantity: z.number().int().positive().optional(),
        customPrice: z.number().min(0).optional(),
        discountPercent: z.number().min(0).max(100).optional(),
        notes: z.string().max(500).optional(),
      }),
      response: {
        201: z.object({
          subscription: z.record(z.string(), z.unknown()),
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
        409: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { tenantId } = request.params;
      const { skillCode, quantity, customPrice, discountPercent, notes } =
        request.body;

      try {
        const addTenantSubscriptionUseCase = makeAddTenantSubscriptionUseCase();
        const { subscription } = await addTenantSubscriptionUseCase.execute({
          tenantId,
          skillCode,
          quantity,
          customPrice,
          discountPercent,
          notes,
          grantedBy: request.user.sub,
        });

        return reply.status(201).send({
          subscription: presentTenantSubscription(subscription),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ConflictError) {
          return reply.status(409).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
