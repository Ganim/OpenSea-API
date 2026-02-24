import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RenameEntityFoldersUseCase } from './rename-entity-folders';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: RenameEntityFoldersUseCase;
const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();

describe('Rename Entity Folders Use Case', () => {
  beforeEach(async () => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new RenameEntityFoldersUseCase(storageFoldersRepository);

    // Seed folder structure: /recursos-humanos/funcionarios/joao-silva
    const parentFolder = await storageFoldersRepository.create({
      tenantId,
      name: 'Funcionários',
      slug: 'funcionarios',
      path: '/recursos-humanos/funcionarios',
      isSystem: true,
      module: 'hr',
      depth: 1,
    });

    const entityFolder = await storageFoldersRepository.create({
      tenantId,
      parentId: parentFolder.id.toString(),
      name: 'João Silva',
      slug: 'joao-silva',
      path: '/recursos-humanos/funcionarios/joao-silva',
      isSystem: true,
      module: 'hr',
      entityType: 'employee',
      entityId: employeeId,
      depth: 2,
    });

    // Create subfolders
    await storageFoldersRepository.create({
      tenantId,
      parentId: entityFolder.id.toString(),
      name: 'Atestados',
      slug: 'atestados',
      path: '/recursos-humanos/funcionarios/joao-silva/atestados',
      isSystem: true,
      module: 'hr',
      depth: 3,
    });

    await storageFoldersRepository.create({
      tenantId,
      parentId: entityFolder.id.toString(),
      name: 'Documentos Pessoais',
      slug: 'documentos-pessoais',
      path: '/recursos-humanos/funcionarios/joao-silva/documentos-pessoais',
      isSystem: true,
      module: 'hr',
      depth: 3,
    });
  });

  it('should rename entity folder and update its path', async () => {
    const { folder } = await sut.execute({
      tenantId,
      entityType: 'employee',
      entityId: employeeId,
      newName: 'João Carlos Silva',
    });

    expect(folder.name).toBe('João Carlos Silva');
    expect(folder.slug).toBe('joao-carlos-silva');
    expect(folder.path).toBe(
      '/recursos-humanos/funcionarios/joao-carlos-silva',
    );
  });

  it('should cascade path change to all descendants', async () => {
    const { renamedDescendantsCount } = await sut.execute({
      tenantId,
      entityType: 'employee',
      entityId: employeeId,
      newName: 'Maria Santos',
    });

    expect(renamedDescendantsCount).toBe(2);

    const atestadosFolder = storageFoldersRepository.items.find(
      (folder) =>
        folder.name === 'Atestados' && folder.tenantId.toString() === tenantId,
    );

    expect(atestadosFolder?.path).toBe(
      '/recursos-humanos/funcionarios/maria-santos/atestados',
    );

    const documentosFolder = storageFoldersRepository.items.find(
      (folder) =>
        folder.name === 'Documentos Pessoais' &&
        folder.tenantId.toString() === tenantId,
    );

    expect(documentosFolder?.path).toBe(
      '/recursos-humanos/funcionarios/maria-santos/documentos-pessoais',
    );
  });

  it('should throw if entity folder does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        entityType: 'employee',
        entityId: new UniqueEntityID().toString(),
        newName: 'New Name',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if entity type does not match any folder', async () => {
    await expect(
      sut.execute({
        tenantId,
        entityType: 'non-existent-type',
        entityId: employeeId,
        newName: 'New Name',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should handle renaming with accented characters', async () => {
    const { folder } = await sut.execute({
      tenantId,
      entityType: 'employee',
      entityId: employeeId,
      newName: 'José Conceição Pereira',
    });

    expect(folder.slug).toBe('jose-conceicao-pereira');
    expect(folder.path).toBe(
      '/recursos-humanos/funcionarios/jose-conceicao-pereira',
    );
  });

  it('should return zero descendants when entity folder has no children', async () => {
    // Create a manufacturer folder with no children
    const manufacturerId = new UniqueEntityID().toString();

    await storageFoldersRepository.create({
      tenantId,
      name: 'Fabricante Alfa',
      slug: 'fabricante-alfa',
      path: '/estoque/fabricantes/fabricante-alfa',
      isSystem: true,
      module: 'stock',
      entityType: 'manufacturer',
      entityId: manufacturerId,
      depth: 2,
    });

    const { renamedDescendantsCount } = await sut.execute({
      tenantId,
      entityType: 'manufacturer',
      entityId: manufacturerId,
      newName: 'Fabricante Beta',
    });

    expect(renamedDescendantsCount).toBe(0);
  });
});
