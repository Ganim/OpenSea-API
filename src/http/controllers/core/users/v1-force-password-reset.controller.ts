import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { userResponseSchema } from '@/http/schemas';
import { makeForcePasswordResetUseCase } from '@/use-cases/core/users/factories/make-force-password-reset-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function forcePasswordResetController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/users/:userId/force-password-reset',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.USERS.MANAGE,
        resource: 'users',
      }),
    ],
    schema: {
      tags: ['Auth - Users'],
      summary: 'Force password reset for a user (Admin)',
      description:
        'Admin endpoint to force a user to reset their password on next login. The user will be blocked from logging in until they reset their password.',
      params: z.object({
        userId: z.uuid(),
      }),
      body: z.object({
        reason: z
          .string()
          .max(255)
          .optional()
          .describe('Optional reason for the forced reset'),
        sendEmail: z
          .boolean()
          .default(false)
          .describe('Whether to send email notification'),
      }),
      response: {
        200: z.object({
          user: userResponseSchema,
          message: z.string(),
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
      const { userId } = request.params;
      const { reason, sendEmail } = request.body;
      const requestedByUserId = request.user.sub;

      try {
        const forcePasswordResetUseCase = makeForcePasswordResetUseCase();

        const { user, message } = await forcePasswordResetUseCase.execute({
          targetUserId: userId,
          requestedByUserId,
          reason,
          sendEmail,
        });

        return reply.status(200).send({ user, message });
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
