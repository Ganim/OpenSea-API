import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DownloadFolderUseCase } from './download-folder';

vi.mock('archiver', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EventEmitter } = require('events');
  return {
    default: vi.fn(() => {
      const emitter = new EventEmitter();
      emitter.pipe = vi.fn().mockReturnValue(emitter);
      emitter.append = vi.fn();
      emitter.finalize = vi.fn().mockImplementation(() => {
        // Emit data and end on next tick so listeners are registered
        process.nextTick(() => {
          emitter.emit('data', Buffer.from('zipdata'));
          emitter.emit('end');
        });
        return Promise.resolve();
      });
      return emitter;
    }),
  };
});

const tenantId = 'tenant-1';
const folderId = 'folder-1';

function makeMocks() {
  const storageFoldersRepository = {
    findById: vi.fn(),
    findDescendants: vi.fn(),
  };

  const storageFilesRepository = {
    findMany: vi.fn(),
  };

  const fileUploadService = {
    getObject: vi.fn(),
    upload: vi.fn(),
    getPresignedUrl: vi.fn(),
  };

  const sut = new DownloadFolderUseCase(
    storageFoldersRepository as any,
    storageFilesRepository as any,
    fileUploadService as any,
  );

  return {
    sut,
    storageFoldersRepository,
    storageFilesRepository,
    fileUploadService,
  };
}

describe('DownloadFolderUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = makeMocks();
  });

  it('should throw ResourceNotFoundError when folder does not exist', async () => {
    mocks.storageFoldersRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({ tenantId, folderId }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should create a ZIP and return a presigned URL', async () => {
    const folder = {
      id: new UniqueEntityID(folderId),
      slug: 'my-folder',
      path: '/my-folder',
    };

    mocks.storageFoldersRepository.findById.mockResolvedValue(folder);
    mocks.storageFoldersRepository.findDescendants.mockResolvedValue([]);
    mocks.storageFilesRepository.findMany.mockResolvedValue({
      files: [
        {
          id: new UniqueEntityID('file-1'),
          name: 'document.pdf',
          fileKey: 'storage/tenant-1/doc.pdf',
          size: 1024,
          folderId: new UniqueEntityID(folderId),
        },
      ],
      total: 1,
    });
    mocks.fileUploadService.getObject.mockResolvedValue(Buffer.from('content'));
    mocks.fileUploadService.upload.mockResolvedValue({ key: 'temp/zip.zip' });
    mocks.fileUploadService.getPresignedUrl.mockResolvedValue(
      'https://s3.example.com/zip.zip',
    );

    const result = await mocks.sut.execute({ tenantId, folderId });

    expect(result.url).toBe('https://s3.example.com/zip.zip');
    expect(result.fileName).toContain('my-folder-');
    expect(result.fileName).toContain('.zip');
  });

  it('should throw error when total file size exceeds 500MB', async () => {
    const folder = {
      id: new UniqueEntityID(folderId),
      slug: 'big-folder',
      path: '/big-folder',
    };

    mocks.storageFoldersRepository.findById.mockResolvedValue(folder);
    mocks.storageFoldersRepository.findDescendants.mockResolvedValue([]);
    mocks.storageFilesRepository.findMany.mockResolvedValue({
      files: [
        {
          id: new UniqueEntityID('file-1'),
          name: 'huge.bin',
          fileKey: 'storage/huge.bin',
          size: 600 * 1024 * 1024, // 600MB
          folderId: new UniqueEntityID(folderId),
        },
      ],
      total: 1,
    });

    await expect(mocks.sut.execute({ tenantId, folderId })).rejects.toThrow(
      /excede o limite/,
    );
  });
});
