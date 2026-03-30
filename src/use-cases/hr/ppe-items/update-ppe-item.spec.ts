import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPPEItemsRepository } from '@/repositories/hr/in-memory/in-memory-ppe-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdatePPEItemUseCase } from './update-ppe-item';

let ppeItemsRepository: InMemoryPPEItemsRepository;
let sut: UpdatePPEItemUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Update PPE Item Use Case', () => {
  beforeEach(() => {
    ppeItemsRepository = new InMemoryPPEItemsRepository();
    sut = new UpdatePPEItemUseCase(ppeItemsRepository);
  });

  it('should update a PPE item successfully', async () => {
    const created = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete Antigo',
      category: 'HEAD',
    });

    const { ppeItem } = await sut.execute({
      tenantId,
      ppeItemId: created.id.toString(),
      name: 'Capacete Atualizado',
      caNumber: 'CA-55555',
    });

    expect(ppeItem.name).toBe('Capacete Atualizado');
    expect(ppeItem.caNumber).toBe('CA-55555');
  });

  it('should throw error when PPE item is not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        ppeItemId: new UniqueEntityID().toString(),
        name: 'Novo Nome',
      }),
    ).rejects.toThrow('EPI não encontrado');
  });

  it('should throw error when name is empty string', async () => {
    const created = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
    });

    await expect(
      sut.execute({
        tenantId,
        ppeItemId: created.id.toString(),
        name: '',
      }),
    ).rejects.toThrow('O nome do EPI é obrigatório');
  });

  it('should throw error when category is invalid', async () => {
    const created = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
    });

    await expect(
      sut.execute({
        tenantId,
        ppeItemId: created.id.toString(),
        category: 'INVALID',
      }),
    ).rejects.toThrow('Categoria de EPI inválida');
  });

  it('should throw error when expirationMonths is less than 1', async () => {
    const created = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
    });

    await expect(
      sut.execute({
        tenantId,
        ppeItemId: created.id.toString(),
        expirationMonths: 0,
      }),
    ).rejects.toThrow('O prazo de validade deve ser de pelo menos 1 mês');
  });

  it('should throw error when minStock is negative', async () => {
    const created = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
    });

    await expect(
      sut.execute({
        tenantId,
        ppeItemId: created.id.toString(),
        minStock: -1,
      }),
    ).rejects.toThrow('O estoque mínimo não pode ser negativo');
  });

  it('should allow clearing optional fields with null', async () => {
    const created = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
      caNumber: 'CA-11111',
      manufacturer: '3M',
    });

    const { ppeItem } = await sut.execute({
      tenantId,
      ppeItemId: created.id.toString(),
      caNumber: null,
      manufacturer: null,
    });

    expect(ppeItem.caNumber).toBeUndefined();
    expect(ppeItem.manufacturer).toBeUndefined();
  });
});
