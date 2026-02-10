import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ExportAccountingDataUseCase } from './export-accounting-data';

let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: ExportAccountingDataUseCase;

const tenantId = 'tenant-1';
const categoryId = new UniqueEntityID().toString();
const costCenterId1 = new UniqueEntityID().toString();
const costCenterId2 = new UniqueEntityID().toString();

function daysAgo(days: number): Date {
  const d = new Date(2026, 1, 10);
  d.setDate(d.getDate() - days);
  return d;
}

describe('ExportAccountingDataUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    entriesRepository.costCenterNames.set(costCenterId1, 'Administrativo');
    entriesRepository.costCenterNames.set(costCenterId2, 'Operacional');
    sut = new ExportAccountingDataUseCase(entriesRepository);
  });

  it('should export ENTRIES as CSV with UTF-8 BOM and semicolons', async () => {
    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel',
      categoryId,
      costCenterId: costCenterId1,
      expectedAmount: 1500,
      supplierName: 'Imobiliária ABC',
      issueDate: daysAgo(30),
      dueDate: daysAgo(5),
    });

    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda mensal',
      categoryId,
      costCenterId: costCenterId1,
      expectedAmount: 3000,
      customerName: 'João Silva',
      issueDate: daysAgo(20),
      dueDate: daysAgo(3),
    });

    const result = await sut.execute({
      tenantId,
      format: 'CSV',
      reportType: 'ENTRIES',
      startDate: daysAgo(60),
      endDate: new Date(2026, 1, 15),
    });

    expect(result.fileName).toContain('lancamentos_');
    expect(result.fileName.endsWith('.csv')).toBe(true);
    expect(result.mimeType).toBe('text/csv; charset=utf-8');

    const csv = result.data.toString('utf-8');
    // UTF-8 BOM
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    // Semicolons as separator
    expect(csv).toContain(';');
    // Headers in Portuguese
    expect(csv).toContain('Código');
    expect(csv).toContain('Descrição');
    expect(csv).toContain('Centro de Custo');
    // Data rows
    expect(csv).toContain('PAG-001');
    expect(csv).toContain('Aluguel');
    expect(csv).toContain('1500,00');
    expect(csv).toContain('A Pagar');
    expect(csv).toContain('Imobiliária ABC');
    expect(csv).toContain('REC-001');
    expect(csv).toContain('A Receber');
    expect(csv).toContain('João Silva');
  });

  it('should filter entries by type', async () => {
    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Despesa',
      categoryId,
      costCenterId: costCenterId1,
      expectedAmount: 500,
      issueDate: daysAgo(10),
      dueDate: daysAgo(2),
    });

    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Receita',
      categoryId,
      costCenterId: costCenterId1,
      expectedAmount: 800,
      issueDate: daysAgo(10),
      dueDate: daysAgo(2),
    });

    const result = await sut.execute({
      tenantId,
      format: 'CSV',
      reportType: 'ENTRIES',
      startDate: daysAgo(60),
      endDate: new Date(2026, 1, 15),
      type: 'PAYABLE',
    });

    const csv = result.data.toString('utf-8');
    expect(csv).toContain('PAG-001');
    expect(csv).not.toContain('REC-001');
  });

  it('should export DRE with revenue, expenses, and result', async () => {
    // Paid receivable (revenue)
    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda 1',
      categoryId,
      costCenterId: costCenterId1,
      expectedAmount: 5000,
      status: 'RECEIVED',
      issueDate: daysAgo(30),
      dueDate: daysAgo(5),
    });

    // Paid payable (expense)
    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel',
      categoryId,
      costCenterId: costCenterId1,
      expectedAmount: 2000,
      status: 'PAID',
      issueDate: daysAgo(30),
      dueDate: daysAgo(5),
    });

    // Pending entry (should NOT count in DRE)
    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Pendente',
      categoryId,
      costCenterId: costCenterId1,
      expectedAmount: 9999,
      issueDate: daysAgo(10),
      dueDate: daysAgo(2),
    });

    const result = await sut.execute({
      tenantId,
      format: 'CSV',
      reportType: 'DRE',
      startDate: daysAgo(60),
      endDate: new Date(2026, 1, 15),
    });

    expect(result.fileName).toContain('dre_');
    const csv = result.data.toString('utf-8');
    expect(csv).toContain('RECEITAS');
    expect(csv).toContain('5000,00'); // revenue
    expect(csv).toContain('2000,00'); // expenses
    expect(csv).toContain('3000,00'); // result = 5000 - 2000
    expect(csv).toContain('RESULTADO DO PERÍODO');
  });

  it('should export BALANCE (balancete) by cost center', async () => {
    // Payable (debit) in CC1
    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Despesa Admin',
      categoryId,
      costCenterId: costCenterId1,
      expectedAmount: 1000,
      issueDate: daysAgo(10),
      dueDate: daysAgo(2),
    });

    // Receivable (credit) in CC1
    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Receita Admin',
      categoryId,
      costCenterId: costCenterId1,
      expectedAmount: 3000,
      issueDate: daysAgo(10),
      dueDate: daysAgo(2),
    });

    // Payable in CC2
    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Despesa Op',
      categoryId,
      costCenterId: costCenterId2,
      expectedAmount: 500,
      issueDate: daysAgo(10),
      dueDate: daysAgo(2),
    });

    const result = await sut.execute({
      tenantId,
      format: 'CSV',
      reportType: 'BALANCE',
      startDate: daysAgo(60),
      endDate: new Date(2026, 1, 15),
    });

    expect(result.fileName).toContain('balancete_');
    const csv = result.data.toString('utf-8');
    expect(csv).toContain('Centro de Custo');
    expect(csv).toContain('Débitos');
    expect(csv).toContain('Créditos');
    expect(csv).toContain('Saldo');
    expect(csv).toContain('TOTAL');
  });

  it('should export CASHFLOW with inflows, outflows, and net', async () => {
    // Received (inflow)
    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Recebido',
      categoryId,
      costCenterId: costCenterId1,
      expectedAmount: 4000,
      status: 'RECEIVED',
      issueDate: daysAgo(20),
      dueDate: daysAgo(5),
    });

    // Paid (outflow)
    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Pago',
      categoryId,
      costCenterId: costCenterId1,
      expectedAmount: 1500,
      status: 'PAID',
      issueDate: daysAgo(20),
      dueDate: daysAgo(5),
    });

    const result = await sut.execute({
      tenantId,
      format: 'CSV',
      reportType: 'CASHFLOW',
      startDate: daysAgo(60),
      endDate: new Date(2026, 1, 15),
    });

    expect(result.fileName).toContain('fluxo_caixa_');
    const csv = result.data.toString('utf-8');
    expect(csv).toContain('RECEBIMENTOS OPERACIONAIS');
    expect(csv).toContain('4000,00'); // inflows
    expect(csv).toContain('PAGAMENTOS OPERACIONAIS');
    expect(csv).toContain('1500,00'); // outflows
    expect(csv).toContain('CAIXA LÍQUIDO OPERACIONAL');
    expect(csv).toContain('2500,00'); // net = 4000 - 1500
  });

  it('should return empty CSV when no entries match', async () => {
    const result = await sut.execute({
      tenantId,
      format: 'CSV',
      reportType: 'ENTRIES',
      startDate: daysAgo(60),
      endDate: new Date(2026, 1, 15),
    });

    const csv = result.data.toString('utf-8');
    const lines = csv.split('\r\n').filter((l) => l.trim() !== '');
    // Only header line (+ BOM)
    expect(lines).toHaveLength(1);
    expect(csv).toContain('Código');
  });
});
