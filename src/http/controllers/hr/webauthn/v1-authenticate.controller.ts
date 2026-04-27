/**
 * POST /v1/hr/webauthn/authenticate
 *
 * Verifies the WebAuthn authentication response (assertion) from the agent.
 * Auth: verifyPunchDeviceToken (agent caller — no JWT).
 *
 * Body: { response: AuthenticationResponseJSON }
 * Returns: { verified: true, employeeId: string, tenantId: string }
 *
 * After receiving a successful response, the agent should call
 * POST /v1/hr/punch/clock to register the time entry (separate step).
 *
 * T-10-07-01: Counter regression check — rejects 400 if newCounter <= storedCounter.
 * T-10-07-02: Challenge consumed (DEL) by VerifyAuthenticationUseCase.
 * Body.strict(): rejects unknown fields — defense in depth.
 *
 * Plan 10-07 Task 7.2 implementation.
 */
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyPunchDeviceToken } from '@/http/middlewares/rbac/verify-punch-device-token';
import { makeVerifyAuthenticationUseCase } from '@/use-cases/hr/webauthn/factories/make-verify-authentication';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1WebAuthnAuthenticateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/webauthn/authenticate',
    preHandler: [verifyPunchDeviceToken],
    schema: {
      tags: ['HR - WebAuthn'],
      summary: 'Verificar autenticação WebAuthn',
      description:
        'Verifica a resposta de autenticação WebAuthn (assertion). ' +
        'Detecta regressão de contador (possível replay ou credencial clonada). ' +
        'Em caso de sucesso, retorna employeeId para o agente registrar o ponto. ' +
        'Auth: x-punch-device-token.',
      body: z
        .object({
          response: z.any(), // AuthenticationResponseJSON — validated by @simplewebauthn/server
        })
        .strict(),
      response: {
        200: z.object({
          verified: z.literal(true),
          employeeId: z.string(),
          tenantId: z.string(),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { response } = request.body;

      try {
        const useCase = makeVerifyAuthenticationUseCase();
        const result = await useCase.execute({ response });
        return reply.send(result);
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
