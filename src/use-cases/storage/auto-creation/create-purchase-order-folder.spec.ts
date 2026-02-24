import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePurchaseOrderFolderUseCase } from './create-purchase-order-folder';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: CreatePurchaseOrderFolderUseCase;
const tenantId = new UniqueEntityID().toString();
const manufacturerId = new UniqueEntityID().toString();

describe('Create Purchase Order Folder Use Case', () => {
  beforeEach(async () => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new CreatePurchaseOrderFolderUseCase(storageFoldersRepository);

    // Seed the manufacturer folder structure
    const fabricantesFolder = await storageFoldersRepository.create({
      tenantId,
      name: 'Fabricantes',
      slug: 'fabricantes',
      path: '/estoque/fabricantes',
      isSystem: true,
      module: 'stock',
      depth: 1,
    });

    await storageFoldersRepository.create({
      tenantId,
      parentId: fabricantesFolder.id.toString(),
      name: 'Fabricante Alfa',
      slug: 'fabricante-alfa',
      path: '/estoque/fabricantes/fabricante-alfa',
      isSystem: true,
      module: 'stock',
      entityType: 'manufacturer',
      entityId: manufacturerId,
      depth: 2,
    });
  });

  it('should create a purchase order folder under the manufacturer folder', async () => {
    const { folder } = await sut.execute({
      tenantId,
      manufacturerId,
      poNumber: '12345',
    });

    expect(folder.name).toBe('PO-12345');
    expect(folder.slug).toBe('po-12345');
    expect(folder.path).toBe('/estoque/fabricantes/fabricante-alfa/po-12345');
    expect(folder.isSystem).toBe(true);
    expect(folder.module).toBe('stock');
    expect(folder.depth).toBe(3);
  });

  it('should set parent to the manufacturer folder', async () => {
    const { folder } = await sut.execute({
      tenantId,
      manufacturerId,
      poNumber: '99001',
    });

    const manufacturerFolder = storageFoldersRepository.items.find(
      (item) =>
        item.entityType === 'manufacturer' && item.entityId === manufacturerId,
    );

    expect(folder.parentId?.toString()).toBe(manufacturerFolder!.id.toString());
  });

  it('should throw if manufacturer folder does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        manufacturerId: new UniqueEntityID().toString(),
        poNumber: '12345',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if purchase order folder already exists', async () => {
    await sut.execute({
      tenantId,
      manufacturerId,
      poNumber: '12345',
    });

    await expect(
      sut.execute({
        tenantId,
        manufacturerId,
        poNumber: '12345',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow multiple purchase orders under the same manufacturer', async () => {
    const firstPo = await sut.execute({
      tenantId,
      manufacturerId,
      poNumber: '001',
    });

    const secondPo = await sut.execute({
      tenantId,
      manufacturerId,
      poNumber: '002',
    });

    expect(firstPo.folder.path).toBe(
      '/estoque/fabricantes/fabricante-alfa/po-001',
    );
    expect(secondPo.folder.path).toBe(
      '/estoque/fabricantes/fabricante-alfa/po-002',
    );
    expect(firstPo.folder.id.toString()).not.toBe(
      secondPo.folder.id.toString(),
    );
  });
});
