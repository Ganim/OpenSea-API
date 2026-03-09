import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LabelTemplatesRepository } from '@/repositories/core/label-templates-repository';

interface GenerateLabelTemplateThumbnailUseCaseRequest {
  id: string;
  tenantId: string;
  file: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
  };
  uploadedBy: string;
}

interface GenerateLabelTemplateThumbnailUseCaseResponse {
  thumbnailUrl: string;
}

export class GenerateLabelTemplateThumbnailUseCase {
  constructor(private labelTemplatesRepository: LabelTemplatesRepository) {}

  async execute(
    request: GenerateLabelTemplateThumbnailUseCaseRequest,
  ): Promise<GenerateLabelTemplateThumbnailUseCaseResponse> {
    const { id, tenantId, file, uploadedBy } = request;

    const templateId = new UniqueEntityID(id);
    const template = await this.labelTemplatesRepository.findById(
      new UniqueEntityID(tenantId),
      templateId,
    );

    if (!template) {
      throw new ResourceNotFoundError('Label template not found');
    }

    // Lazy imports to avoid @env initialization in unit tests
    const { prisma } = await import('@/lib/prisma');
    const { PrismaStorageFoldersRepository } = await import(
      '@/repositories/storage/prisma/prisma-storage-folders-repository'
    );
    const { makeInitializeTenantFoldersUseCase } = await import(
      '@/use-cases/storage/auto-creation/factories/make-initialize-tenant-folders-use-case'
    );
    const { makeCreateEntityFoldersUseCase } = await import(
      '@/use-cases/storage/auto-creation/factories/make-create-entity-folders-use-case'
    );
    const { makeUploadFileUseCase } = await import(
      '@/use-cases/storage/files/factories/make-upload-file-use-case'
    );

    // Find or create the label template folder
    const foldersRepo = new PrismaStorageFoldersRepository();
    let folder = await foldersRepo.findByEntityId(
      'label-template',
      id,
      tenantId,
    );

    if (!folder) {
      try {
        const initTenantFolders = makeInitializeTenantFoldersUseCase();
        await initTenantFolders.execute({ tenantId });

        const createEntityFolders = makeCreateEntityFoldersUseCase();
        const { folders } = await createEntityFolders.execute({
          tenantId,
          entityType: 'label-template',
          entityId: id,
          entityName: template.name,
        });
        folder = folders[0];
      } catch {
        folder = await foldersRepo.findByEntityId(
          'label-template',
          id,
          tenantId,
        );
      }
    }

    // Soft-delete existing thumbnail file
    try {
      const oldFile = await prisma.storageFile.findFirst({
        where: {
          tenantId,
          entityType: 'label-thumbnail',
          entityId: id,
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

    // Upload the new thumbnail
    const folderId = folder ? folder.id.toString() : null;
    const uploadFileUseCase = makeUploadFileUseCase();
    const { file: storageFile } = await uploadFileUseCase.execute({
      tenantId,
      folderId,
      file: {
        buffer: file.buffer,
        filename: file.filename,
        mimetype: file.mimetype,
      },
      entityType: 'label-thumbnail',
      entityId: id,
      uploadedBy,
    });

    const thumbnailUrl = `/v1/storage/files/${storageFile.id.toString()}/serve`;

    template.thumbnailUrl = thumbnailUrl;
    await this.labelTemplatesRepository.save(template);

    return { thumbnailUrl };
  }
}
