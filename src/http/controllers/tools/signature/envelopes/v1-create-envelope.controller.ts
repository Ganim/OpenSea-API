import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { signatureEnvelopeToDTO } from '@/mappers/signature';
import { makeCreateEnvelopeUseCase } from '@/use-cases/signature/envelopes/factories/make-create-envelope-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const signerSchema = z.object({
  userId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  externalName: z.string().optional(),
  externalEmail: z.string().email().optional(),
  externalPhone: z.string().optional(),
  externalDocument: z.string().optional(),
  order: z.number().int().min(1),
  group: z.number().int().min(1),
  role: z.enum(['SIGNER', 'APPROVER', 'WITNESS', 'REVIEWER']),
  signatureLevel: z.enum(['SIMPLE', 'ADVANCED', 'QUALIFIED']),
  certificateId: z.string().uuid().optional(),
});

export async function createEnvelopeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/signature/envelopes',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.ENVELOPES.REGISTER,
        resource: 'signature-envelopes',
      }),
    ],
    schema: {
      tags: ['Signature - Envelopes'],
      summary: 'Create a new signature envelope',
      body: z.object({
        title: z.string().min(1).max(256),
        description: z.string().optional(),
        signatureLevel: z.enum(['SIMPLE', 'ADVANCED', 'QUALIFIED']),
        minSignatureLevel: z.enum(['SIMPLE', 'ADVANCED', 'QUALIFIED']).optional(),
        documentFileId: z.string().uuid(),
        documentHash: z.string().max(64),
        documentType: z.string().max(16).optional(),
        sourceModule: z.string().max(32),
        sourceEntityType: z.string().max(64),
        sourceEntityId: z.string(),
        routingType: z.enum(['SEQUENTIAL', 'PARALLEL', 'HYBRID']),
        expiresAt: z.string().datetime().optional(),
        reminderDays: z.number().int().min(1).optional(),
        autoExpireDays: z.number().int().min(1).optional(),
        tags: z.array(z.string()).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        signers: z.array(signerSchema).min(1),
      }),
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const useCase = makeCreateEnvelopeUseCase();
      const { envelope } = await useCase.execute({
        tenantId,
        title: body.title,
        description: body.description,
        signatureLevel: body.signatureLevel,
        minSignatureLevel: body.minSignatureLevel,
        documentFileId: body.documentFileId,
        documentHash: body.documentHash,
        documentType: body.documentType,
        sourceModule: body.sourceModule,
        sourceEntityType: body.sourceEntityType,
        sourceEntityId: body.sourceEntityId,
        routingType: body.routingType,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        reminderDays: body.reminderDays,
        autoExpireDays: body.autoExpireDays,
        createdByUserId: userId,
        tags: body.tags,
        metadata: body.metadata,
        signers: body.signers,
      });

      return reply.status(201).send({
        envelope: signatureEnvelopeToDTO(envelope),
      });
    },
  });
}
