import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApplyFolderTemplateUseCase } from './apply-folder-template';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: ApplyFolderTemplateUseCase;

const TENANT_ID = 'tenant-1';

describe('ApplyFolderTemplateUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new ApplyFolderTemplateUseCase(storageFoldersRepository);
  });

  it('should apply template to empty folder (creates all subfolders)', async () => {
    const targetFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'My Project',
      slug: 'my-project',
      path: '/my-project',
      depth: 0,
    });

    const { createdFolders, skippedFolders } = await sut.execute({
      tenantId: TENANT_ID,
      targetFolderId: targetFolder.id.toString(),
      templateId: 'project',
    });

    expect(createdFolders).toHaveLength(4);
    expect(skippedFolders).toHaveLength(0);

    expect(createdFolders[0].name).toBe('Documentos');
    expect(createdFolders[0].path).toBe('/my-project/documentos');
    expect(createdFolders[0].icon).toBe('file-text');
    expect(createdFolders[0].depth).toBe(1);
    expect(createdFolders[0].parentId?.toString()).toBe(
      targetFolder.id.toString(),
    );

    expect(createdFolders[1].name).toBe('Contratos');
    expect(createdFolders[1].path).toBe('/my-project/contratos');

    expect(createdFolders[2].name).toBe('Relatórios');
    expect(createdFolders[2].path).toBe('/my-project/relatorios');

    expect(createdFolders[3].name).toBe('Anexos');
    expect(createdFolders[3].path).toBe('/my-project/anexos');
  });

  it('should skip existing subfolders with same name', async () => {
    const targetFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'My Project',
      slug: 'my-project',
      path: '/my-project',
      depth: 0,
    });

    // Pre-create a folder that matches one of the template folders
    await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      parentId: targetFolder.id.toString(),
      name: 'Documentos',
      slug: 'documentos',
      path: '/my-project/documentos',
      depth: 1,
    });

    const { createdFolders, skippedFolders } = await sut.execute({
      tenantId: TENANT_ID,
      targetFolderId: targetFolder.id.toString(),
      templateId: 'project',
    });

    expect(createdFolders).toHaveLength(3);
    expect(skippedFolders).toHaveLength(1);
    expect(skippedFolders).toContain('Documentos');

    // Verify the created folders don't include the skipped one
    const createdNames = createdFolders.map((f) => f.name);
    expect(createdNames).not.toContain('Documentos');
    expect(createdNames).toContain('Contratos');
    expect(createdNames).toContain('Relatórios');
    expect(createdNames).toContain('Anexos');
  });

  it('should throw ResourceNotFoundError if target folder does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        targetFolderId: 'non-existent-folder-id',
        templateId: 'project',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError if template ID is invalid', async () => {
    const targetFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'My Folder',
      slug: 'my-folder',
      path: '/my-folder',
      depth: 0,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        targetFolderId: targetFolder.id.toString(),
        templateId: 'non-existent-template',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError if target folder is a system folder', async () => {
    const systemFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Recursos Humanos',
      slug: 'recursos-humanos',
      path: '/recursos-humanos',
      isSystem: true,
      depth: 0,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        targetFolderId: systemFolder.id.toString(),
        templateId: 'project',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
