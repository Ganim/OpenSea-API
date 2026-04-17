import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
      // 2026-03-15 08:00 BRT
      timestamp: new Date(Date.UTC(2026, 2, 15, 11, 0, 0)),
      notes: null,
      employee: { pis: '12345678901', cpf: '52998224725' },
    },
    {
      nsrNumber: 2,
      // 2026-03-15 12:00 BRT
      timestamp: new Date(Date.UTC(2026, 2, 15, 15, 0, 0)),
      notes: '[AJUSTE] Horário corrigido por gestor',
      employee: { pis: '12345678901', cpf: '52998224725' },
    },
  ];
}

let sut: GenerateAFDTUseCase;

describe('GenerateAFDTUseCase (Portaria 671/2021 Anexo III conformance)', () => {
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses LF as the record separator', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    expect(result.content).not.toContain('\r');
  });

  it('emits Tipo 1 header, Tipo 4 records and Tipo 9 trailer', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\n');
    expect(lines[0]).toMatch(/^12/); // Tipo 1 with AFDT identifier "2"
    expect(lines[1]).toMatch(/^4/);
    expect(lines[2]).toMatch(/^4/);
    expect(lines[3]).toMatch(/^9/);
    expect(lines[3]).toContain('000000002');
  });

  it('produces a header 210 bytes long with 150-char Razão Social at Pos 31-180', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const header = result.content.split('\n')[0];
    expect(header).toHaveLength(210);

    const razaoSocial = header.substring(30, 180);
    expect(razaoSocial).toHaveLength(150);
    expect(razaoSocial.trimEnd()).toBe('Empresa Teste LTDA');
  });

  it('writes period and generation date/time in BRT at the expected positions', async () => {
    vi.setSystemTime(new Date(Date.UTC(2026, 2, 31, 18, 0, 45))); // 15:00:45 BRT
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date(Date.UTC(2026, 2, 1, 3, 0, 0)),
      endDate: new Date(Date.UTC(2026, 3, 1, 2, 59, 0)),
    });

    const header = result.content.split('\n')[0];
    expect(header.substring(180, 188)).toBe('01032026'); // period start
    expect(header.substring(188, 196)).toBe('31032026'); // period end
    expect(header.substring(196, 204)).toBe('31032026'); // generated date
    expect(header.substring(204, 210)).toBe('150045'); // hhmmss
  });

  it('produces Tipo 4 records with 9-digit NSR and 92-byte width', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\n');
    const treated = lines.filter((line) => line.startsWith('4'));
    expect(treated).toHaveLength(2);
    for (const record of treated) {
      expect(record).toHaveLength(92);
    }

    expect(treated[0].substring(1, 10)).toBe('000000001');
    expect(treated[1].substring(1, 10)).toBe('000000002');
  });

  it('marks adjusted entries with flag "S" at Pos 27 and carries the justification', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\n');
    expect(lines[1].charAt(26)).toBe('N');
    expect(lines[2].charAt(26)).toBe('S');

    const justification = lines[2].substring(52, 92);
    expect(justification.trim()).toBe('Horario corrigido por gestor');
  });

  it('writes PIS at Pos 28-38 and CPF at Pos 39-52', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\n');
    const firstTreated = lines[1];
    expect(firstTreated.substring(27, 38)).toBe('12345678901');
    expect(firstTreated.substring(38, 52).trim()).toBe('52998224725');
  });

  it('reads punch dates in BRT even when the UTC instant crossed midnight', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.timeEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        nsrNumber: 1,
        // 2026-03-15 23:30 BRT == 2026-03-16 02:30 UTC
        timestamp: new Date(Date.UTC(2026, 2, 16, 2, 30, 0)),
        notes: null,
        employee: { pis: '12345678901', cpf: '52998224725' },
      },
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-04-01'),
    });

    const lines = result.content.split('\n');
    expect(lines[1].substring(10, 18)).toBe('15032026');
    expect(lines[1].substring(18, 22)).toBe('2330');
  });

  it('generates a filename with CNPJ and yyyymmdd BRT dates', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date(Date.UTC(2026, 2, 1, 3, 0, 0)),
      endDate: new Date(Date.UTC(2026, 3, 1, 2, 59, 0)),
    });

    expect(result.filename).toBe('AFDT_12345678000190_20260301_20260331.txt');
  });

  it('rejects inverted periods', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        startDate: new Date('2026-03-31'),
        endDate: new Date('2026-03-01'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('rejects empty periods', async () => {
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
});
