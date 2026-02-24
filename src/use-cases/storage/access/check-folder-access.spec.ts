import { InMemoryFolderAccessRulesRepository } from '@/repositories/storage/in-memory/in-memory-folder-access-rules-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CheckFolderAccessUseCase } from './check-folder-access';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let folderAccessRulesRepository: InMemoryFolderAccessRulesRepository;
let sut: CheckFolderAccessUseCase;

const TENANT_ID = 'tenant-1';

describe('CheckFolderAccessUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    folderAccessRulesRepository = new InMemoryFolderAccessRulesRepository();
    sut = new CheckFolderAccessUseCase(folderAccessRulesRepository);
  });

  async function createFolderWithRules() {
    const folder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Documents',
      slug: 'documents',
      path: '/documents',
    });

    return folder;
  }

  it('should return true when user has the required read permission', async () => {
    const folder = await createFolderWithRules();

    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
    });

    const { hasAccess } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-1',
      groupIds: [],
      requiredPermission: 'read',
    });

    expect(hasAccess).toBe(true);
  });

  it('should return false when user does not have the required write permission', async () => {
    const folder = await createFolderWithRules();

    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
    });

    const { hasAccess } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-1',
      groupIds: [],
      requiredPermission: 'write',
    });

    expect(hasAccess).toBe(false);
  });

  it('should return true when group grants the required permission', async () => {
    const folder = await createFolderWithRules();

    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      groupId: 'group-editors',
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: false,
    });

    const { hasAccess } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-1',
      groupIds: ['group-editors'],
      requiredPermission: 'write',
    });

    expect(hasAccess).toBe(true);
  });

  it('should merge permissions across multiple rules - any allow wins', async () => {
    const folder = await createFolderWithRules();

    // User rule: read only
    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
    });

    // Group rule: write access
    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      groupId: 'group-editors',
      canRead: false,
      canWrite: true,
      canDelete: false,
      canShare: false,
    });

    const { hasAccess: canWrite } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-1',
      groupIds: ['group-editors'],
      requiredPermission: 'write',
    });

    const { hasAccess: canRead } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-1',
      groupIds: ['group-editors'],
      requiredPermission: 'read',
    });

    expect(canWrite).toBe(true);
    expect(canRead).toBe(true);
  });

  it('should return false when no rules exist for the user or their groups', async () => {
    const folder = await createFolderWithRules();

    const { hasAccess } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-unknown',
      groupIds: [],
      requiredPermission: 'read',
    });

    expect(hasAccess).toBe(false);
  });

  it('should check delete permission correctly', async () => {
    const folder = await createFolderWithRules();

    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: false,
    });

    const { hasAccess: canDelete } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-1',
      groupIds: [],
      requiredPermission: 'delete',
    });

    const { hasAccess: canShare } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-1',
      groupIds: [],
      requiredPermission: 'share',
    });

    expect(canDelete).toBe(true);
    expect(canShare).toBe(false);
  });

  it('should check share permission correctly', async () => {
    const folder = await createFolderWithRules();

    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      groupId: 'group-admins',
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: true,
    });

    const { hasAccess } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-1',
      groupIds: ['group-admins'],
      requiredPermission: 'share',
    });

    expect(hasAccess).toBe(true);
  });

  it('should consider multiple group memberships', async () => {
    const folder = await createFolderWithRules();

    // Group A: read only
    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      groupId: 'group-viewers',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
    });

    // Group B: share access
    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      groupId: 'group-sharers',
      canRead: false,
      canWrite: false,
      canDelete: false,
      canShare: true,
    });

    const { hasAccess } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.folderId.toString(),
      userId: 'user-1',
      groupIds: ['group-viewers', 'group-sharers'],
      requiredPermission: 'share',
    });

    expect(hasAccess).toBe(true);
  });
});
