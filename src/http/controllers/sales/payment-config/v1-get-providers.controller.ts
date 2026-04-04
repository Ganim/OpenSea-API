import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  PAYMENT_PROVIDERS,
  type ProviderName,
} from '@/services/payment/provider-registry';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const configFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['text', 'password', 'file']),
  required: z.boolean(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
});

const providerSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  configFields: z.array(configFieldSchema),
});

export async function v1GetProvidersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/payment-config/providers',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.ADMIN,
        resource: 'payment-config',
      }),
    ],
    schema: {
      tags: ['Payment Gateway'],
      summary: 'List available payment gateway providers with config fields',
      response: {
        200: z.object({
          providers: z.array(providerSchema),
        }),
      },
    },
    handler: async (_request, reply) => {
      const providerEntries = Object.entries(PAYMENT_PROVIDERS) as [
        ProviderName,
        (typeof PAYMENT_PROVIDERS)[ProviderName],
      ][];

      const providers = providerEntries.map(([providerName, providerMeta]) => ({
        name: providerName,
        displayName: providerMeta.displayName,
        configFields: providerMeta.getConfigFields(),
      }));

      return reply.send({ providers });
    },
  });
}
