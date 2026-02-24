import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { slugify } from '@/constants/storage/folder-templates';
import type { StorageFolder } from '@/entities/storage/storage-folder';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface CreatePurchaseOrderFolderUseCaseRequest {
  tenantId: string;
  manufacturerId: string;
  poNumber: string;
}

interface CreatePurchaseOrderFolderUseCaseResponse {
  folder: StorageFolder;
}

export class CreatePurchaseOrderFolderUseCase {
  constructor(private storageFoldersRepository: StorageFoldersRepository) {}

  async execute(
    request: CreatePurchaseOrderFolderUseCaseRequest,
  ): Promise<CreatePurchaseOrderFolderUseCaseResponse> {
    const { tenantId, manufacturerId, poNumber } = request;

    // Find the manufacturer's entity folder
    const manufacturerFolder =
      await this.storageFoldersRepository.findByEntityId(
        'manufacturer',
        manufacturerId,
        tenantId,
      );

    if (!manufacturerFolder) {
      throw new ResourceNotFoundError(
        `Folder not found for manufacturer with id: ${manufacturerId}`,
      );
    }

    const poFolderName = `PO-${poNumber}`;
    const poFolderSlug = slugify(poFolderName);
    const poFolderPath = `${manufacturerFolder.path}/${poFolderSlug}`;

    // Check if the PO folder already exists
    const existingPoFolder = await this.storageFoldersRepository.findByPath(
      poFolderPath,
      tenantId,
    );

    if (existingPoFolder) {
      throw new BadRequestError(
        `Purchase order folder already exists: ${poFolderName}`,
      );
    }

    const purchaseOrderFolder = await this.storageFoldersRepository.create({
      tenantId,
      parentId: manufacturerFolder.id.toString(),
      name: poFolderName,
      slug: poFolderSlug,
      path: poFolderPath,
      isSystem: true,
      module: 'stock',
      depth: manufacturerFolder.depth + 1,
    });

    return { folder: purchaseOrderFolder };
  }
}
