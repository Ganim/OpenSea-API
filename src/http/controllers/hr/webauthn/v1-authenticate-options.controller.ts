/**
 * POST /v1/hr/webauthn/authenticate-options
 *
 * Generates WebAuthn authentication options for an employee.
 * Auth: verifyPunchDeviceToken (agent caller — no JWT needed for kiosk punch flow).
 * Returns PublicKeyCredentialRequestOptionsJSON for the agent to pass to navigator.credentials.get.
 *
 * T-10-07-02: Challenge persisted in Redis 5min TTL (one-shot).
 * T-10-07-06: Rate-limited via punchBioRoutes mutation sub-app.
 *
 * Plan 10-07 Task 7.2 implementation.
 */
import { verifyPunchDeviceToken } from '@/http/middlewares/rbac/verify-punch-device-token';
import { makeGenerateAuthenticationOptionsUseCase } from '@/use-cases/hr/webauthn/factories/make-generate-authentication-options';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1WebAuthnAuthenticateOptionsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/webauthn/authenticate-options',
    preHandler: [verifyPunchDeviceToken],
    schema: {
      tags: ['HR - WebAuthn'],
      summary: 'Gerar opções de autenticação WebAuthn',
      description:
        'Gera opções de autenticação WebAuthn para um funcionário. ' +
        'O agente usa as opções para chamar navigator.credentials.get (Windows Hello). ' +
        'Auth: x-punch-device-token.',
      body: z
        .object({
          employeeId: z.string().uuid(),
        })
        .strict(),
      response: {
        200: z.any(),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { employeeId } = request.body;

      const useCase = makeGenerateAuthenticationOptionsUseCase();
      const options = await useCase.execute({ employeeId });
      return reply.send(options);
    },
  });
}
