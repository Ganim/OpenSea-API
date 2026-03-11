import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { makeCreateEntityFoldersUseCase } from '@/use-cases/storage/auto-creation/factories/make-create-entity-folders-use-case';
import { makeInitializeTenantFoldersUseCase } from '@/use-cases/storage/auto-creation/factories/make-initialize-tenant-folders-use-case';
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
const PHOTO_SIZE = 512; // 512x512 output

function buildPhotoFilename(employeeName: string): string {
  const sanitized = employeeName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
  return `${sanitized}_photo_${Date.now()}.jpg`;
}

export async function v1UploadEmployeePhotoController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/:id/photo',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.UPDATE,
        resource: 'employees',
      }),
    ],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Upload employee photo',
      description:
        'Upload and crop employee photo. Accepts multipart/form-data with a "file" field (image). Optional cropX, cropY, cropWidth, cropHeight fields for server-side cropping. Photo is saved to the employee folder in File Manager.',
      params: z.object({
        id: z.string().uuid(),
      }),
      consumes: ['multipart/form-data'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          photoUrl: z.string(),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id: employeeId } = request.params;

      try {
        // Verify employee exists
        const employeesRepo = new PrismaEmployeesRepository();
        const employee = await employeesRepo.findById(
          new UniqueEntityID(employeeId),
          tenantId,
        );

        if (!employee) {
          throw new ResourceNotFoundError('Funcionário não encontrado');
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

        // Process image: crop (if specified) + resize to 512x512
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
          .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: 'cover' })
          .jpeg({ quality: 90 })
          .toBuffer();

        // Delete old photo from storage if exists
        if (employee.photoUrl) {
          try {
            const oldFile = await prisma.storageFile.findFirst({
              where: {
                tenantId,
                entityType: 'employee-photo',
                entityId: employeeId,
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
        }

        // Find or create employee folder in File Manager
        const foldersRepo = new PrismaStorageFoldersRepository();
        let employeeFolder = await foldersRepo.findByEntityId(
          'employee',
          employeeId,
          tenantId,
        );

        if (!employeeFolder) {
          try {
            const initTenantFolders = makeInitializeTenantFoldersUseCase();
            await initTenantFolders.execute({ tenantId });

            const createEntityFolders = makeCreateEntityFoldersUseCase();
            const { folders } = await createEntityFolders.execute({
              tenantId,
              entityType: 'employee',
              entityId: employeeId,
              entityName: employee.fullName,
            });
            employeeFolder = folders[0]; // Main entity folder
          } catch {
            // If folder creation fails (e.g. already exists race condition), try finding again
            employeeFolder = await foldersRepo.findByEntityId(
              'employee',
              employeeId,
              tenantId,
            );
          }
        }

        // Upload to employee folder (or root as fallback)
        const folderId = employeeFolder ? employeeFolder.id.toString() : null;

        const filename = buildPhotoFilename(employee.fullName);
        const uploadFileUseCase = makeUploadFileUseCase();
        const { file: storageFile } = await uploadFileUseCase.execute({
          tenantId,
          folderId,
          file: {
            buffer: processedBuffer,
            filename,
            mimetype: 'image/jpeg',
          },
          entityType: 'employee-photo',
          entityId: employeeId,
          uploadedBy: userId,
        });

        // Build serve URL for the photo
        const photoUrl = `/v1/storage/files/${storageFile.id.toString()}/serve`;

        // Update employee photoUrl
        await employeesRepo.update({
          id: employee.id,
          photoUrl,
        });

        // Sync to linked user avatar
        if (employee.userId) {
          try {
            await prisma.userProfile.updateMany({
              where: { userId: employee.userId.toString() },
              data: { avatarUrl: photoUrl },
            });
          } catch {
            // Non-critical
          }
        }

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.EMPLOYEE_UPDATE,
          entityId: employeeId,
          placeholders: {
            userName: userId,
            employeeName: employee.fullName,
          },
          newData: {
            photoUrl,
            storageFileId: storageFile.id.toString(),
            operation: 'photo-upload',
          },
        });

        return reply.status(200).send({ photoUrl });
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
