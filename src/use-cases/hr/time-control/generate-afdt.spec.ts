import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GenerateAFDTUseCase } from './generate-afdt';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    company: {
      findFirst: vi.fn(),
    },
    timeEntry: {
      findMany: vi.fn(),
    },
  },
}));

function makeMockTimeEntries() {
  return [
    {
      nsrNumber: 1,
      timestamp: new Date('2026-03-15T08:00:00'),
      notes: null,
      employee: { pis: '12345678901', cpf: '52998224725' },
    },
    {
      nsrNumber: 2,
      timestamp: new Date('2026-03-15T12:00:00'),
      notes: '[AJUSTE] Horário corrigido por gestor',
      employee: { pis: '12345678901', cpf: '52998224725' },
    },
  ];
}

let sut: GenerateAFDTUseCase;

describe('GenerateAFDTUseCase', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    sut = new GenerateAFDTUseCase();
    const { prisma } = await import('@/lib/prisma');
    (prisma.company.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      cnpj: '12.345.678/0001-90',
      legalName: 'Empresa Teste LTDA',
    });
    (prisma.timeEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeMockTimeEntries(),
    );
  });

  it('should generate AFDT content with header, details, and trailer', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\r\n');

    // Header starts with "12" (type 1, AFDT identifier "2")
    expect(lines[0]).toMatch(/^12/);

    // Detail records start with "4"
    expect(lines[1]).toMatch(/^4/);
    expect(lines[2]).toMatch(/^4/);

    // Trailer starts with "9"
    expect(lines[3]).toMatch(/^9/);
    expect(lines[3]).toContain('0000000002');
  });

  it('should throw BadRequestError when startDate >= endDate', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        startDate: new Date('2026-03-31'),
        endDate: new Date('2026-03-01'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when no time entries found', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.timeEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-31'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should generate correct filename with CNPJ and date range', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    expect(result.filename).toMatch(/^AFDT_/);
    expect(result.filename).toContain('12345678000190');
    expect(result.filename).toMatch(/\.txt$/);
    // Filename contains formatted dates from the Date objects
  });

  it('should include period dates in header', async () => {
    const startDate = new Date(2026, 2, 1); // March 1 local
    const endDate = new Date(2026, 2, 31); // March 31 local
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate,
      endDate,
    });

    const header = result.content.split('\r\n')[0];
    // Pos 43-50: start date (ddmmaaaa), Pos 51-58: end date (ddmmaaaa)
    const startStr = header.substring(42, 50);
    const endStr = header.substring(50, 58);
    expect(startStr).toBe('01032026');
    expect(endStr).toBe('31032026');
  });

  it('should mark adjusted entries with flag S', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\r\n');
    // First detail: no adjustment
    const detail1 = lines[1];
    // Pos 28: adjust flag
    expect(detail1.charAt(27)).toBe('N');

    // Second detail: has [AJUSTE] prefix
    const detail2 = lines[2];
    expect(detail2.charAt(27)).toBe('S');
  });

  it('should include justification for adjusted entries', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\r\n');
    const detail2 = lines[2];
    // Pos 54-93: justification (40 chars)
    const justification = detail2.substring(53, 93);
    expect(justification.trim()).toContain('Horário corrigido por gestor');
  });

  it('should include PIS and CPF in detail records', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const detail = result.content.split('\r\n')[1];
    // Pos 29-39: PIS (11 digits)
    const pis = detail.substring(28, 39);
    expect(pis).toBe('12345678901');
    // Pos 40-53: CPF (14 chars)
    const cpf = detail.substring(39, 53);
    expect(cpf.trim()).toBe('52998224725');
  });
});
