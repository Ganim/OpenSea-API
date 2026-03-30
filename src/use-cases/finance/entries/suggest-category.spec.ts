import { beforeEach, describe, expect, it } from 'vitest';
import { SuggestCategoryUseCase } from './suggest-category';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';

describe('SuggestCategoryUseCase', () => {
  let sut: SuggestCategoryUseCase;
  let financeEntriesRepository: InMemoryFinanceEntriesRepository;

  beforeEach(() => {
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    financeEntriesRepository.categoryNames.set(
      'cat-office',
      'Material de Escritório',
    );
    financeEntriesRepository.categoryNames.set(
      'cat-services',
      'Serviços Terceirizados',
    );
    financeEntriesRepository.categoryNames.set(
      'cat-tech',
      'Tecnologia e Software',
    );
    sut = new SuggestCategoryUseCase(financeEntriesRepository);
  });

  it('should return empty suggestions when no params provided', async () => {
    const { suggestions } = await sut.execute({ tenantId: 'tenant-1' });

    expect(suggestions).toEqual([]);
  });

  it('should return empty suggestions when no entries match supplier', async () => {
    const { suggestions } = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Fornecedor Desconhecido',
    });

    expect(suggestions).toEqual([]);
  });

  it('should suggest category with high confidence when supplier has 5+ entries in same category', async () => {
    // Create 6 entries for same supplier in same category
    for (let i = 1; i <= 6; i++) {
      await financeEntriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAY-${i}`,
        description: `Compra material escritório ${i}`,
        categoryId: 'cat-office',
        supplierName: 'Papelaria Central',
        expectedAmount: 100 * i,
        issueDate: new Date(),
        dueDate: new Date(),
      });
    }

    const { suggestions } = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Papelaria Central',
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].categoryId).toBe('cat-office');
    expect(suggestions[0].categoryName).toBe('Material de Escritório');
    expect(suggestions[0].confidence).toBeGreaterThanOrEqual(90);
  });

  it('should suggest category with medium confidence when supplier has 3 entries', async () => {
    for (let i = 1; i <= 3; i++) {
      await financeEntriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAY-${i}`,
        description: `Serviço limpeza ${i}`,
        categoryId: 'cat-services',
        supplierName: 'LimpMax Ltda',
        expectedAmount: 500,
        issueDate: new Date(),
        dueDate: new Date(),
      });
    }

    const { suggestions } = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'LimpMax Ltda',
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].confidence).toBe(80);
  });

  it('should suggest category with lower confidence when supplier has only 1 entry', async () => {
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-1',
      description: 'Licença software',
      categoryId: 'cat-tech',
      supplierName: 'TechSoft',
      expectedAmount: 1200,
      issueDate: new Date(),
      dueDate: new Date(),
    });

    const { suggestions } = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'TechSoft',
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].confidence).toBe(60);
  });

  it('should return multiple suggestions when supplier uses different categories', async () => {
    // 4 entries in cat-office
    for (let i = 1; i <= 4; i++) {
      await financeEntriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAY-OFF-${i}`,
        description: `Material escritório ${i}`,
        categoryId: 'cat-office',
        supplierName: 'Mega Suprimentos',
        expectedAmount: 200,
        issueDate: new Date(),
        dueDate: new Date(),
      });
    }
    // 2 entries in cat-tech
    for (let i = 1; i <= 2; i++) {
      await financeEntriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAY-TECH-${i}`,
        description: `Equipamento ${i}`,
        categoryId: 'cat-tech',
        supplierName: 'Mega Suprimentos',
        expectedAmount: 1500,
        issueDate: new Date(),
        dueDate: new Date(),
      });
    }

    const { suggestions } = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Mega Suprimentos',
    });

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].categoryId).toBe('cat-office');
    expect(suggestions[0].confidence).toBeGreaterThan(
      suggestions[1].confidence,
    );
  });

  it('should suggest by description keywords when no supplier provided', async () => {
    for (let i = 1; i <= 4; i++) {
      await financeEntriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAY-${i}`,
        description: `Manutenção preventiva equipamentos ${i}`,
        categoryId: 'cat-services',
        supplierName: `Fornecedor ${i}`,
        expectedAmount: 800,
        issueDate: new Date(),
        dueDate: new Date(),
      });
    }

    const { suggestions } = await sut.execute({
      tenantId: 'tenant-1',
      description: 'Manutenção preventiva',
    });

    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(suggestions[0].categoryId).toBe('cat-services');
  });

  it('should boost confidence when both supplier and description match', async () => {
    for (let i = 1; i <= 5; i++) {
      await financeEntriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAY-${i}`,
        description: `Licença anual software antivírus`,
        categoryId: 'cat-tech',
        supplierName: 'SecureTech',
        expectedAmount: 300,
        issueDate: new Date(),
        dueDate: new Date(),
      });
    }

    const supplierOnly = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'SecureTech',
    });

    const bothSignals = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'SecureTech',
      description: 'Licença anual software antivírus',
    });

    expect(bothSignals.suggestions[0].confidence).toBeGreaterThanOrEqual(
      supplierOnly.suggestions[0].confidence,
    );
  });

  it('should respect multi-tenant isolation', async () => {
    for (let i = 1; i <= 5; i++) {
      await financeEntriesRepository.create({
        tenantId: 'tenant-other',
        type: 'PAYABLE',
        code: `PAY-${i}`,
        description: `Material escritório`,
        categoryId: 'cat-office',
        supplierName: 'Papelaria Central',
        expectedAmount: 100,
        issueDate: new Date(),
        dueDate: new Date(),
      });
    }

    const { suggestions } = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Papelaria Central',
    });

    expect(suggestions).toHaveLength(0);
  });

  it('should limit suggestions to a maximum of 3', async () => {
    const categories = ['cat-office', 'cat-services', 'cat-tech', 'cat-extra'];
    financeEntriesRepository.categoryNames.set('cat-extra', 'Extra');

    for (const categoryId of categories) {
      await financeEntriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAY-${categoryId}`,
        description: `Entry for ${categoryId}`,
        categoryId,
        supplierName: 'Multi Fornecedor',
        expectedAmount: 100,
        issueDate: new Date(),
        dueDate: new Date(),
      });
    }

    const { suggestions } = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'Multi Fornecedor',
    });

    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  it('should perform partial match on supplier name', async () => {
    for (let i = 1; i <= 3; i++) {
      await financeEntriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAY-${i}`,
        description: `Serviço ${i}`,
        categoryId: 'cat-services',
        supplierName: 'ABC Serviços de Limpeza Ltda',
        expectedAmount: 200,
        issueDate: new Date(),
        dueDate: new Date(),
      });
    }

    const { suggestions } = await sut.execute({
      tenantId: 'tenant-1',
      supplierName: 'ABC Serviços',
    });

    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(suggestions[0].categoryId).toBe('cat-services');
  });
});
