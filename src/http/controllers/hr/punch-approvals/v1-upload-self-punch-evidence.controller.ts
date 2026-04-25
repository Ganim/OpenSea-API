import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeUploadSelfPunchEvidenceUseCase } from '@/use-cases/hr/punch-approvals/factories/make-upload-self-punch-evidence';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * POST /v1/hr/punch-approvals/self-evidence
 *
 * Phase 8 / Plan 08-03 / Task 2 — D-08-03-01.
 *
 * Owner-only multipart upload (1 arquivo por request, JPG/PNG/PDF até 5MB) —
 * usado pelo flow self-justify da PWA pessoal. Retorna `storageKey` que o
 * frontend acumula em `evidenceFileKeys[]` e passa ao endpoint
 * `POST /v1/hr/punch-approvals` (Plan 8-01) que valida via headObject.
 *
 * Diferenças vs `POST /v1/hr/punch-approvals/:id/evidence` (Phase 7-03 D-10
 * — gestor):
 *   - Sem PIN gate (D-08 ratificado).
 *   - Permissão `hr.punch-approvals.access` (DEFAULT_USER_PERMISSIONS — todo
 *     funcionário tem); não exige `.modify` ou `.admin`.
 *   - Aceita JPG/PNG/PDF (não apenas PDF).
 *   - 5MB cap (vs 10MB do gestor).
 *   - Sem :id na URL — upload é staging anterior ao create-self.
 *
 * O ownership real é validado em duas camadas downstream:
 *   1. `Employee.findByUserId(userId, tenantId)` resolve o employee do caller
 *      (use case lança `ResourceNotFoundError` 404 se não houver linkagem RH).
 *   2. `CreateSelfPunchApprovalUseCase` (Plan 8-01) valida `evidenceFileKeys`
 *      via `S3FileUploadService.headObject` antes de anexar.
 */
const uploadSelfPunchEvidenceResponseSchema = z.object({
  storageKey: z.string(),
  size: z.number().int().nonnegative(),
  uploadedAt: z.string(),
  filename: z.string(),
  mimeType: z.string(),
});

export async function v1UploadSelfPunchEvidenceController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/punch-approvals/self-evidence',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PUNCH_APPROVALS.ACCESS,
        resource: 'hr-punch-approvals',
      }),
    ],
    schema: {
      tags: ['HR - Punch Approvals'],
      summary:
        'Funcionário sobe evidência (foto/PDF) para self-justify (PWA — D-08)',
      description:
        'Multipart upload de 1 arquivo por request (campo `file`). ' +
        'Aceita image/jpeg, image/png e application/pdf — até 5MB. ' +
        'Retorna `storageKey` que deve ser passado em `evidenceFileKeys[]` ' +
        'no body do `POST /v1/hr/punch-approvals` (max 3 keys por approval).',
      response: {
        201: uploadSelfPunchEvidenceResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const data = await request.file();
        if (!data) {
          return reply.status(400).send({ message: 'Arquivo ausente' });
        }
        const buffer = await data.toBuffer();
        const filename = data.filename ?? 'evidence';
        const mimeType = data.mimetype ?? 'application/octet-stream';

        const useCase = makeUploadSelfPunchEvidenceUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          buffer,
          filename,
          mimeType,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
