import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { generateQrPayloadBodySchema, qrPayloadResponseSchema } from '@/http/schemas';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GenerateQrPayloadController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/punch-config/generate-qr',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.TIME_CONTROL.ADMIN,
        resource: 'time-control',
      }),
    ],
    schema: {
      tags: ['HR - Punch Configuration'],
      summary: 'Generate QR code payload',
      description:
        'Generates a signed payload for QR code punch clock. The frontend renders the actual QR image.',
      body: generateQrPayloadBodySchema,
      response: {
        200: z.object({
          payload: qrPayloadResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { employeeId } = request.body;

      // Verify employee exists
      const employeesRepository = new PrismaEmployeesRepository();
      const employee = await employeesRepository.findById(
        new UniqueEntityID(employeeId),
        tenantId,
      );

      if (!employee) {
        return reply.status(404).send({ message: 'Employee not found' });
      }

      const expiresInSeconds = 300; // 5 minutes
      const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;

      const token = await reply.jwtSign(
        {
          sub: employeeId,
          tenantId,
          tokenType: 'qr-punch' as const,
        },
        { expiresIn: `${expiresInSeconds}s` },
      );

      const payload = {
        url: '/punch',
        tenantId,
        employeeId,
        name: employee.fullName,
        token,
        exp,
      };

      return reply.status(200).send({ payload });
    },
  });
}
