import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { makeInitializeTenantFoldersUseCase } from '@/use-cases/storage/auto-creation/factories/make-initialize-tenant-folders-use-case';
import { makeCreateEntityFoldersUseCase } from '@/use-cases/storage/auto-creation/factories/make-create-entity-folders-use-case';
import { makeUploadFileUseCase } from '@/use-cases/storage/files/factories/make-upload-file-use-case';
import sharp from 'sharp';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const AVATAR_SIZE = 256; // 256x256 output

function buildAvatarFilename(userName: string): string {
  const sanitized = userName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
  return `${sanitized}_photo_${Date.now()}.jpg`;
}

export async function uploadMyAvatarController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/me/avatar',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Auth - Me'],
      summary: 'Upload my avatar',
      description:
        'Upload and crop user avatar. Blocked if user is linked to an employee (HR must change photo). Photo is saved to the File Manager root.',
      consumes: ['multipart/form-data'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          avatarUrl: z.string(),
        }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        // Check if user is linked to an employee (any tenant)
        const linkedEmployee = await prisma.employee.findFirst({
          where: { userId, deletedAt: null },
          select: { id: true },
        });

        if (linkedEmployee) {
          throw new ForbiddenError(
            'Sua foto é gerenciada pelo RH. Entre em contato com o departamento de Recursos Humanos para alterá-la.',
          );
        }

        // Parse multipart
        const parts = request.parts();
        let fileBuffer: Buffer | null = null;
        let fileMimeType = '';
        let cropX = 0;
        let cropY = 0;
        let cropWidth = 0;
        let cropHeight = 0;

        for await (const part of parts) {
          if (part.type === 'file' && part.fieldname === 'file') {
            fileMimeType = part.mimetype;
            fileBuffer = await part.toBuffer();
          } else if (part.type === 'field') {
            const val = Number(part.value);
            if (part.fieldname === 'cropX') cropX = val;
            if (part.fieldname === 'cropY') cropY = val;
            if (part.fieldname === 'cropWidth') cropWidth = val;
            if (part.fieldname === 'cropHeight') cropHeight = val;
          }
        }

        if (!fileBuffer) {
          throw new BadRequestError('Nenhum arquivo enviado');
        }

        if (!ALLOWED_MIME_TYPES.includes(fileMimeType)) {
          throw new BadRequestError(
            'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.',
          );
        }

        if (fileBuffer.length > MAX_FILE_SIZE) {
          throw new BadRequestError('Arquivo muito grande. Máximo: 5MB.');
        }

        // Process image: crop + resize to 256x256
        let sharpInstance = sharp(fileBuffer);

        if (cropWidth > 0 && cropHeight > 0) {
          sharpInstance = sharpInstance.extract({
            left: Math.round(cropX),
            top: Math.round(cropY),
            width: Math.round(cropWidth),
            height: Math.round(cropHeight),
          });
        }

        const processedBuffer = await sharpInstance
          .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
          .jpeg({ quality: 90 })
          .toBuffer();

        // Delete old avatar from storage if exists
        try {
          const oldFile = await prisma.storageFile.findFirst({
            where: {
              tenantId,
              entityType: 'user-avatar',
              entityId: userId,
              deletedAt: null,
            },
          });
          if (oldFile) {
            await prisma.storageFile.update({
              where: { id: oldFile.id },
              data: { deletedAt: new Date() },
            });
          }
        } catch {
          // Ignore cleanup errors
        }

        // Get user name for filename and folder creation
        const profile = await prisma.userProfile.findFirst({
          where: { userId },
          select: { name: true, surname: true },
        });
        const userName = profile
          ? `${profile.name} ${profile.surname}`.trim()
          : 'user';

        // Find or create user entity folder (/usuarios/nome-do-usuario/foto)
        const foldersRepo = new PrismaStorageFoldersRepository();
        let userFolder = await foldersRepo.findByEntityId(
          'user',
          userId,
          tenantId,
        );

        if (!userFolder) {
          try {
            const initTenantFolders = makeInitializeTenantFoldersUseCase();
            await initTenantFolders.execute({ tenantId });

            const createEntityFolders = makeCreateEntityFoldersUseCase();
            const { folders } = await createEntityFolders.execute({
              tenantId,
              entityType: 'user',
              entityId: userId,
              entityName: userName,
            });
            userFolder = folders[0];
          } catch {
            userFolder = await foldersRepo.findByEntityId(
              'user',
              userId,
              tenantId,
            );
          }
        }

        // Upload via Storage module (inside user folder)
        const folderId = userFolder ? userFolder.id.toString() : null;
        const filename = buildAvatarFilename(userName);
        const uploadFileUseCase = makeUploadFileUseCase();
        const { file: storageFile } = await uploadFileUseCase.execute({
          tenantId,
          folderId,
          file: {
            buffer: processedBuffer,
            filename,
            mimetype: 'image/jpeg',
          },
          entityType: 'user-avatar',
          entityId: userId,
          uploadedBy: userId,
        });

        // Build serve URL
        const avatarUrl = `/v1/storage/files/${storageFile.id.toString()}/serve`;

        // Update user profile
        await prisma.userProfile.updateMany({
          where: { userId },
          data: { avatarUrl },
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.ME_PROFILE_CHANGE,
          entityId: userId,
          placeholders: { userName: userId },
          newData: { avatarUrl, operation: 'avatar-upload' },
        });

        return reply.status(200).send({ avatarUrl });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
