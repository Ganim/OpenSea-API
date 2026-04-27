/**
 * POST /v1/hr/webauthn/register-options
 *
 * Generates WebAuthn registration options for an employee.
 * Auth: verifyPunchDeviceToken (agent caller — NOT JWT; agent initiates registration).
 * Returns PublicKeyCredentialCreationOptionsJSON for the agent to pass to navigator.credentials.create.
 *
 * T-10-07-02: Challenge generated server-side + persisted Redis 5min one-shot.
 * T-10-07-06: Rate-limited via punchBioRoutes mutation sub-app.
 *
 * Plan 10-07 Task 7.2 implementation.
 */
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyPunchDeviceToken } from '@/http/middlewares/rbac/verify-punch-device-token';
import { makeGenerateRegistrationOptionsUseCase } from '@/use-cases/hr/webauthn/factories/make-generate-registration-options';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1WebAuthnRegisterOptionsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/webauthn/register-options',
    preHandler: [verifyPunchDeviceToken],
    schema: {
      tags: ['HR - WebAuthn'],
      summary: 'Gerar opções de registro WebAuthn',
      description:
        'Gera opções de registro WebAuthn para um funcionário. ' +
        'O agente usa as opções para chamar navigator.credentials.create (Windows Hello). ' +
        'Auth: x-punch-device-token (dispositivo pareado).',
      body: z
        .object({
          employeeId: z.string().uuid(),
        })
        .strict(),
      response: {
        200: z.any(),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.punchDevice!.tenantId;
      const { employeeId } = request.body;

      // Fetch employee name for rpOptions.userName
      const employee = await prisma.employee.findFirst({
        where: { id: employeeId, tenantId },
        select: { fullName: true },
      });

      if (!employee) {
        return reply
          .status(404)
          .send({ message: 'Funcionário não encontrado' });
      }

      try {
        const useCase = makeGenerateRegistrationOptionsUseCase();
        const options = await useCase.execute({
          tenantId,
          employeeId,
          employeeName: employee.fullName,
        });
        return reply.send(options);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
