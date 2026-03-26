import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryBidDocumentsRepository } from '@/repositories/sales/in-memory/in-memory-bid-documents-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBidDocumentUseCase } from './create-bid-document';

let bidDocumentsRepository: InMemoryBidDocumentsRepository;
let sut: CreateBidDocumentUseCase;

describe('CreateBidDocumentUseCase', () => {
  beforeEach(() => {
    bidDocumentsRepository = new InMemoryBidDocumentsRepository();
    sut = new CreateBidDocumentUseCase(bidDocumentsRepository);
  });

  it('should create a bid document', async () => {
    const { document } = await sut.execute({
      tenantId: 'tenant-1',
      bidId: 'bid-1',
      type: 'CERTIDAO_FEDERAL',
      name: 'Certidao Negativa de Debitos Federais',
      fileId: 'file-1',
      issueDate: new Date('2026-03-01'),
      expirationDate: new Date('2026-09-01'),
    });

    expect(document).toBeDefined();
    expect(document.name).toBe('Certidao Negativa de Debitos Federais');
    expect(document.type).toBe('CERTIDAO_FEDERAL');
    expect(document.isValid).toBe(true);
    expect(bidDocumentsRepository.items).toHaveLength(1);
  });

  it('should throw when name is empty', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        type: 'CERTIDAO_FEDERAL',
        name: '   ',
        fileId: 'file-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when file ID is missing', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        type: 'CERTIDAO_FEDERAL',
        name: 'Test Document',
        fileId: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should create document without a bid association', async () => {
    const { document } = await sut.execute({
      tenantId: 'tenant-1',
      type: 'CONTRATO_SOCIAL',
      name: 'Contrato Social da Empresa',
      fileId: 'file-2',
    });

    expect(document.bidId).toBeUndefined();
    expect(document.name).toBe('Contrato Social da Empresa');
  });
});
