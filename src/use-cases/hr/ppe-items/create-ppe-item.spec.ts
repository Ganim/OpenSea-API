import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPPEItemsRepository } from '@/repositories/hr/in-memory/in-memory-ppe-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePPEItemUseCase } from './create-ppe-item';

let ppeItemsRepository: InMemoryPPEItemsRepository;
let sut: CreatePPEItemUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Create PPE Item Use Case', () => {
  beforeEach(() => {
    ppeItemsRepository = new InMemoryPPEItemsRepository();
    sut = new CreatePPEItemUseCase(ppeItemsRepository);
  });

  it('should create a PPE item successfully', async () => {
    const { ppeItem } = await sut.execute({
      tenantId,
      name: 'Capacete de Segurança',
      category: 'HEAD',
    });

    expect(ppeItem).toBeDefined();
    expect(ppeItem.name).toBe('Capacete de Segurança');
    expect(ppeItem.category).toBe('HEAD');
    expect(ppeItem.isActive).toBe(true);
    expect(ppeItem.minStock).toBe(0);
    expect(ppeItem.currentStock).toBe(0);
  });

  it('should create a PPE item with all optional fields', async () => {
    const { ppeItem } = await sut.execute({
      tenantId,
      name: 'Luva de Proteção Química',
      category: 'HANDS',
      caNumber: 'CA-12345',
      manufacturer: '3M do Brasil',
      model: 'Sol-Vex 37-675',
      expirationMonths: 12,
      minStock: 50,
      currentStock: 100,
      notes: 'Uso obrigatório no setor químico',
    });

    expect(ppeItem.caNumber).toBe('CA-12345');
    expect(ppeItem.manufacturer).toBe('3M do Brasil');
    expect(ppeItem.model).toBe('Sol-Vex 37-675');
    expect(ppeItem.expirationMonths).toBe(12);
    expect(ppeItem.minStock).toBe(50);
    expect(ppeItem.currentStock).toBe(100);
    expect(ppeItem.notes).toBe('Uso obrigatório no setor químico');
  });

  it('should throw error when name is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: '',
        category: 'HEAD',
      }),
    ).rejects.toThrow('O nome do EPI é obrigatório');
  });

  it('should throw error when name is only whitespace', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: '   ',
        category: 'HEAD',
      }),
    ).rejects.toThrow('O nome do EPI é obrigatório');
  });

  it('should throw error when category is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Capacete',
        category: '',
      }),
    ).rejects.toThrow('A categoria do EPI é obrigatória');
  });

  it('should throw error when category is invalid', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Capacete',
        category: 'INVALID_CATEGORY',
      }),
    ).rejects.toThrow('Categoria de EPI inválida');
  });

  it('should throw error when expirationMonths is less than 1', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Capacete',
        category: 'HEAD',
        expirationMonths: 0,
      }),
    ).rejects.toThrow('O prazo de validade deve ser de pelo menos 1 mês');
  });

  it('should throw error when minStock is negative', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Capacete',
        category: 'HEAD',
        minStock: -1,
      }),
    ).rejects.toThrow('O estoque mínimo não pode ser negativo');
  });

  it('should throw error when currentStock is negative', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Capacete',
        category: 'HEAD',
        currentStock: -5,
      }),
    ).rejects.toThrow('O estoque atual não pode ser negativo');
  });

  it('should trim the name field', async () => {
    const { ppeItem } = await sut.execute({
      tenantId,
      name: '  Óculos de Proteção  ',
      category: 'EYES',
    });

    expect(ppeItem.name).toBe('Óculos de Proteção');
  });
});
