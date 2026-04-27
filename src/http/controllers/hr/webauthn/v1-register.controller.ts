/**
 * POST /v1/hr/webauthn/register
 *
 * Verifies the WebAuthn registration response (attestation) from the agent
 * and persists the new WebAuthnCredential row.
 * Auth: verifyPunchDeviceToken (agent caller).
 *
 * Body: { employeeId, response: RegistrationResponseJSON }
 * Returns: { verified: true, credentialId: string (base64url) }
 *
 * T-10-07-02: Challenge consumed (DEL) by VerifyRegistrationUseCase.
 * T-10-07-03: No publicKey in response — use case only returns credentialId.
 * Body.strict(): rejects unknown fields — LGPD defense against biometric data injection.
 *
 * Plan 10-07 Task 7.2 implementation.
 */
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyPunchDeviceToken } from '@/http/middlewares/rbac/verify-punch-device-token';
import { makeVerifyRegistrationUseCase } from '@/use-cases/hr/webauthn/factories/make-verify-registration';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1WebAuthnRegisterController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/webauthn/register',
    preHandler: [verifyPunchDeviceToken],
    schema: {
      tags: ['HR - WebAuthn'],
      summary: 'Verificar e persistir credencial WebAuthn',
      description:
        'Verifica a resposta de registro WebAuthn e persiste a credencial. ' +
        'LGPD: nenhum template biométrico é aceito — apenas chave pública (opaque Bytes). ' +
        'Auth: x-punch-device-token.',
      body: z
        .object({
          employeeId: z.string().uuid(),
          response: z.any(), // RegistrationResponseJSON — validated by @simplewebauthn/server
        })
        .strict(),
      response: {
        200: z.object({
          verified: z.literal(true),
          credentialId: z.string(),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.punchDevice!.tenantId;
      const { employeeId, response } = request.body;

      try {
        const useCase = makeVerifyRegistrationUseCase();
        const result = await useCase.execute({
          tenantId,
          employeeId,
          response,
        });
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
