import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GenerateAFDUseCase } from './generate-afd';

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
      employee: { pis: '12345678901', cpf: '52998224725' },
    },
    {
      nsrNumber: 2,
      timestamp: new Date('2026-03-15T12:00:00'),
      employee: { pis: '12345678901', cpf: '52998224725' },
    },
    {
      nsrNumber: 3,
      timestamp: new Date('2026-03-15T13:00:00'),
      employee: { pis: '12345678901', cpf: '52998224725' },
    },
  ];
}

let sut: GenerateAFDUseCase;

describe('GenerateAFDUseCase', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    sut = new GenerateAFDUseCase();
    const { prisma } = await import('@/lib/prisma');
    (prisma.company.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      cnpj: '12.345.678/0001-90',
      legalName: 'Empresa Teste LTDA',
    });
    (prisma.timeEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeMockTimeEntries(),
    );
  });

  it('should generate AFD content with header, details, and trailer', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\r\n');

    // Header starts with "11" (type 1, REP-P "1")
    expect(lines[0]).toMatch(/^11/);

    // Detail records start with "3"
    expect(lines[1]).toMatch(/^3/);
    expect(lines[2]).toMatch(/^3/);
    expect(lines[3]).toMatch(/^3/);

    // Trailer starts with "9"
    expect(lines[4]).toMatch(/^9/);
    // Trailer contains count of detail records (3)
    expect(lines[4]).toContain('0000000003');
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

    expect(result.filename).toMatch(/^AFD_/);
    expect(result.filename).toContain('12345678000190');
    expect(result.filename).toMatch(/\.txt$/);
    // Filename contains formatted dates from the Date objects
  });

  it('should include CNPJ in header padded to 14 digits', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const header = result.content.split('\r\n')[0];
    // Pos 3-16: CNPJ (14 digits)
    const cnpj = header.substring(2, 16);
    expect(cnpj).toBe('12345678000190');
  });

  it('should include PIS in detail records padded to 11 digits', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const detail = result.content.split('\r\n')[1];
    // Pos 24-34: PIS (11 digits)
    const pis = detail.substring(23, 34);
    expect(pis).toBe('12345678901');
  });

  it('should use default CNPJ when company has no CNPJ', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.company.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      legalName: 'Test',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const header = result.content.split('\r\n')[0];
    const cnpj = header.substring(2, 16);
    expect(cnpj).toBe('00000000000000');
  });

  it('should include NSR range in header', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const header = result.content.split('\r\n')[0];
    // Pos 43-48: NSR min (6 digits), Pos 49-54: NSR max (6 digits)
    const nsrMin = header.substring(42, 48);
    const nsrMax = header.substring(48, 54);
    expect(nsrMin).toBe('000001');
    expect(nsrMax).toBe('000003');
  });
});
