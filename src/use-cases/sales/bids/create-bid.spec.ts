import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryBidHistoryRepository } from '@/repositories/sales/in-memory/in-memory-bid-history-repository';
import { InMemoryBidsRepository } from '@/repositories/sales/in-memory/in-memory-bids-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBidUseCase } from './create-bid';

let bidsRepository: InMemoryBidsRepository;
let bidHistoryRepository: InMemoryBidHistoryRepository;
let sut: CreateBidUseCase;

describe('CreateBidUseCase', () => {
  beforeEach(() => {
    bidsRepository = new InMemoryBidsRepository();
    bidHistoryRepository = new InMemoryBidHistoryRepository();
    sut = new CreateBidUseCase(bidsRepository, bidHistoryRepository);
  });

  it('should create a bid successfully', async () => {
    const { bid } = await sut.execute({
      tenantId: 'tenant-1',
      portalName: 'ComprasNet',
      editalNumber: 'PE-001/2026',
      modality: 'PREGAO_ELETRONICO',
      criterionType: 'MENOR_PRECO',
      legalFramework: 'LEI_14133_2021',
      object: 'Aquisicao de materiais de escritorio',
      organName: 'Prefeitura Municipal de Sao Paulo',
      openingDate: new Date('2026-04-15'),
    });

    expect(bid).toBeDefined();
    expect(bid.editalNumber).toBe('PE-001/2026');
    expect(bid.status).toBe('DISCOVERED');
    expect(bid.organName).toBe('Prefeitura Municipal de Sao Paulo');
    expect(bidsRepository.items).toHaveLength(1);
    expect(bidHistoryRepository.items).toHaveLength(1);
    expect(bidHistoryRepository.items[0].action).toBe('BID_CREATED');
  });

  it('should throw when edital number is empty', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        portalName: 'ComprasNet',
        editalNumber: '   ',
        modality: 'PREGAO_ELETRONICO',
        criterionType: 'MENOR_PRECO',
        legalFramework: 'LEI_14133_2021',
        object: 'Aquisicao de materiais',
        organName: 'Orgao Teste',
        openingDate: new Date(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when object description is empty', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        portalName: 'ComprasNet',
        editalNumber: 'PE-002/2026',
        modality: 'PREGAO_ELETRONICO',
        criterionType: 'MENOR_PRECO',
        legalFramework: 'LEI_14133_2021',
        object: '',
        organName: 'Orgao Teste',
        openingDate: new Date(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when organ name is empty', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        portalName: 'ComprasNet',
        editalNumber: 'PE-003/2026',
        modality: 'PREGAO_ELETRONICO',
        criterionType: 'MENOR_PRECO',
        legalFramework: 'LEI_14133_2021',
        object: 'Aquisicao de materiais',
        organName: '',
        openingDate: new Date(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should trim edital number, object and organ name', async () => {
    const { bid } = await sut.execute({
      tenantId: 'tenant-1',
      portalName: 'ComprasNet',
      editalNumber: '  PE-004/2026  ',
      modality: 'PREGAO_ELETRONICO',
      criterionType: 'MENOR_PRECO',
      legalFramework: 'LEI_14133_2021',
      object: '  Aquisicao de materiais  ',
      organName: '  Prefeitura SP  ',
      openingDate: new Date(),
    });

    expect(bid.editalNumber).toBe('PE-004/2026');
    expect(bid.object).toBe('Aquisicao de materiais');
    expect(bid.organName).toBe('Prefeitura SP');
  });
});
