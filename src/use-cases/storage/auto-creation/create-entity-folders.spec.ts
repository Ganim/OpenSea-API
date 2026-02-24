import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ENTITY_FOLDER_CONFIGS,
  slugify,
} from '@/constants/storage/folder-templates';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateEntityFoldersUseCase } from './create-entity-folders';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: CreateEntityFoldersUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Create Entity Folders Use Case', () => {
  beforeEach(async () => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new CreateEntityFoldersUseCase(storageFoldersRepository);

    // Seed the base folder structure (simulating tenant initialization)
    const employeeConfig = ENTITY_FOLDER_CONFIGS.find(
      (config) => config.entityType === 'employee',
    )!;

    // Create parent hierarchy: /recursos-humanos
    const parentSlug = slugify('Recursos Humanos');
    const parentPath = `/${parentSlug}`;

    await storageFoldersRepository.create({
      tenantId,
      name: 'Recursos Humanos',
      slug: parentSlug,
      path: parentPath,
      isSystem: true,
      module: 'hr',
      depth: 0,
    });

    // Create /recursos-humanos/funcionarios
    const baseFolderSlug = employeeConfig.basePath.split('/').pop()!;
    await storageFoldersRepository.create({
      tenantId,
      name: 'Funcionários',
      slug: baseFolderSlug,
      path: employeeConfig.basePath,
      isSystem: true,
      module: 'hr',
      depth: 1,
    });

    // Create /estoque
    await storageFoldersRepository.create({
      tenantId,
      name: 'Estoque',
      slug: 'estoque',
      path: '/estoque',
      isSystem: true,
      module: 'stock',
      depth: 0,
    });

    // Create /estoque/fabricantes
    await storageFoldersRepository.create({
      tenantId,
      name: 'Fabricantes',
      slug: 'fabricantes',
      path: '/estoque/fabricantes',
      isSystem: true,
      module: 'stock',
      depth: 1,
    });
  });

  it('should create entity folder with subfolders for employee', async () => {
    const employeeId = new UniqueEntityID().toString();

    const { folders } = await sut.execute({
      tenantId,
      entityType: 'employee',
      entityId: employeeId,
      entityName: 'João Silva',
    });

    const employeeConfig = ENTITY_FOLDER_CONFIGS.find(
      (config) => config.entityType === 'employee',
    )!;

    // Main folder + subfolders
    expect(folders).toHaveLength(1 + employeeConfig.subfolders.length);

    // Verify main entity folder
    const mainFolder = folders[0];
    expect(mainFolder.name).toBe('João Silva');
    expect(mainFolder.slug).toBe('joao-silva');
    expect(mainFolder.path).toBe('/recursos-humanos/funcionarios/joao-silva');
    expect(mainFolder.isSystem).toBe(true);
    expect(mainFolder.entityType).toBe('employee');
    expect(mainFolder.entityId).toBe(employeeId);
    expect(mainFolder.module).toBe('hr');

    // Verify subfolders
    const subfolderNames = folders.slice(1).map((folder) => folder.name);
    expect(subfolderNames).toEqual(employeeConfig.subfolders);

    // Verify subfolder paths
    for (const subfolder of folders.slice(1)) {
      expect(subfolder.path).toContain(
        '/recursos-humanos/funcionarios/joao-silva/',
      );
      expect(subfolder.isSystem).toBe(true);
      expect(subfolder.parentId?.toString()).toBe(mainFolder.id.toString());
    }
  });

  it('should create entity folder for manufacturer with no subfolders', async () => {
    const manufacturerId = new UniqueEntityID().toString();

    const { folders } = await sut.execute({
      tenantId,
      entityType: 'manufacturer',
      entityId: manufacturerId,
      entityName: 'Fabricante Alfa',
    });

    expect(folders).toHaveLength(1);

    const mainFolder = folders[0];
    expect(mainFolder.name).toBe('Fabricante Alfa');
    expect(mainFolder.slug).toBe('fabricante-alfa');
    expect(mainFolder.path).toBe('/estoque/fabricantes/fabricante-alfa');
    expect(mainFolder.entityType).toBe('manufacturer');
    expect(mainFolder.entityId).toBe(manufacturerId);
  });

  it('should throw if entity type is not configured', async () => {
    await expect(
      sut.execute({
        tenantId,
        entityType: 'unknown-entity',
        entityId: new UniqueEntityID().toString(),
        entityName: 'Test',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if base folder does not exist', async () => {
    // Use a separate tenant with no folders initialized
    const emptyTenantId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: emptyTenantId,
        entityType: 'employee',
        entityId: new UniqueEntityID().toString(),
        entityName: 'Maria Santos',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if entity folder already exists', async () => {
    const employeeId = new UniqueEntityID().toString();

    await sut.execute({
      tenantId,
      entityType: 'employee',
      entityId: employeeId,
      entityName: 'João Silva',
    });

    await expect(
      sut.execute({
        tenantId,
        entityType: 'employee',
        entityId: employeeId,
        entityName: 'João Silva',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should slugify entity name with accented characters', async () => {
    const employeeId = new UniqueEntityID().toString();

    const { folders } = await sut.execute({
      tenantId,
      entityType: 'employee',
      entityId: employeeId,
      entityName: 'José Pereira da Conceição',
    });

    const mainFolder = folders[0];
    expect(mainFolder.slug).toBe('jose-pereira-da-conceicao');
    expect(mainFolder.path).toBe(
      '/recursos-humanos/funcionarios/jose-pereira-da-conceicao',
    );
  });

  it('should set correct depth on entity folder and subfolders', async () => {
    const employeeId = new UniqueEntityID().toString();

    const { folders } = await sut.execute({
      tenantId,
      entityType: 'employee',
      entityId: employeeId,
      entityName: 'Ana Costa',
    });

    const mainFolder = folders[0];
    // Base folder (/recursos-humanos/funcionarios) is at depth 1, so entity is depth 2
    expect(mainFolder.depth).toBe(2);

    // Subfolders are one level deeper
    for (const subfolder of folders.slice(1)) {
      expect(subfolder.depth).toBe(3);
    }
  });
});
