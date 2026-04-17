import { createHash } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

/**
 * Helper: NSR 1 punched at 23:30 UTC-3 on 2026-03-15 (02:30 UTC on 2026-03-16).
 * Using Date.UTC keeps the test invariant under any server timezone, which is
 * the whole point of the BRT helpers.
 */
function makeMockTimeEntries() {
  return [
    {
      nsrNumber: 1,
      // 2026-03-15 08:00 BRT == 2026-03-15 11:00 UTC
      timestamp: new Date(Date.UTC(2026, 2, 15, 11, 0, 0)),
      employee: { pis: '12345678901', cpf: '52998224725' },
    },
    {
      nsrNumber: 2,
      // 2026-03-15 12:00 BRT
      timestamp: new Date(Date.UTC(2026, 2, 15, 15, 0, 0)),
      employee: { pis: '12345678901', cpf: '52998224725' },
    },
    {
      nsrNumber: 3,
      // 2026-03-15 23:30 BRT == 2026-03-16 02:30 UTC — crosses the UTC day
      // boundary so we can assert BRT rollback.
      timestamp: new Date(Date.UTC(2026, 2, 16, 2, 30, 0)),
      employee: { pis: '12345678901', cpf: '52998224725' },
    },
  ];
}

let sut: GenerateAFDUseCase;

describe('GenerateAFDUseCase (Portaria 671/2021 Anexo III conformance)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    sut = new GenerateAFDUseCase();
    const { prisma } = await import('@/lib/prisma');
    (prisma.company.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      cnpj: '12.345.678/0001-90',
      legalName: 'Empresa Teste Ação LTDA',
    });
    (prisma.timeEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeMockTimeEntries(),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses LF (\\n) as the record separator, never CRLF', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    expect(result.content).not.toContain('\r');
    expect(result.content.split('\n').length).toBeGreaterThan(1);
  });

  it('emits header + Tipo 3 records + Tipo 9 trailer + Tipo 7 hash', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\n');

    expect(lines[0]).toMatch(/^11/); // Tipo 1 REP-P
    expect(lines[1]).toMatch(/^3/); // Tipo 3
    expect(lines[2]).toMatch(/^3/);
    expect(lines[3]).toMatch(/^3/);
    expect(lines[4]).toMatch(/^9/); // Tipo 9 trailer
    expect(lines[5]).toMatch(/^7/); // Tipo 7 hash (last record)
    expect(lines).toHaveLength(6);
  });

  it('produces a header exactly 226 bytes long', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const header = result.content.split('\n')[0];
    expect(header).toHaveLength(226);
  });

  it('produces Tipo 3 records exactly 33 bytes long', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\n');
    const punches = lines.filter((line) => line.startsWith('3'));
    expect(punches).toHaveLength(3);
    for (const punch of punches) {
      expect(punch).toHaveLength(33);
    }
  });

  it('produces a trailer exactly 46 bytes long with 5 counters', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\n');
    const trailer = lines[lines.length - 2]; // last before Tipo 7
    expect(trailer).toHaveLength(46);
    expect(trailer.charAt(0)).toBe('9');

    const employerIdentityCount = trailer.substring(1, 10);
    const punchCount = trailer.substring(10, 19);
    const clockAdjustmentCount = trailer.substring(19, 28);
    const employeeRegistryCount = trailer.substring(28, 37);
    const repDeviceEventCount = trailer.substring(37, 46);

    expect(employerIdentityCount).toBe('000000000');
    expect(punchCount).toBe('000000003');
    expect(clockAdjustmentCount).toBe('000000000');
    expect(employeeRegistryCount).toBe('000000000');
    expect(repDeviceEventCount).toBe('000000000');
  });

  it('produces a Tipo 7 hash record exactly 257 bytes with uppercase SHA-256 hex', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\n');
    const hashRecord = lines[lines.length - 1];
    expect(hashRecord).toHaveLength(257);
    expect(hashRecord.charAt(0)).toBe('7');

    const digestField = hashRecord.substring(1, 65);
    expect(digestField).toMatch(/^[0-9A-F]{64}$/);
  });

  it('computes the Tipo 7 digest over all records except Tipo 7 itself', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const hashRecordIndex = result.content.lastIndexOf('\n7');
    const contentExcludingHash = result.content.substring(
      0,
      hashRecordIndex + 1, // keep the trailing \n before the Tipo 7 record
    );
    const hashRecord = result.content.substring(hashRecordIndex + 1);

    const expectedDigest = createHash('sha256')
      .update(contentExcludingHash, 'utf8')
      .digest('hex')
      .toUpperCase();

    expect(hashRecord.substring(1, 65)).toBe(expectedDigest);
  });

  it('pads CNPJ to 14 digits at header Pos 3-16', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const header = result.content.split('\n')[0];
    expect(header.substring(2, 16)).toBe('12345678000190');
  });

  it('falls back to zero-padded CNPJ when company has no CNPJ', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.company.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      legalName: 'Test',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const header = result.content.split('\n')[0];
    expect(header.substring(2, 16)).toBe('00000000000000');
  });

  it('writes Razão Social in Pos 31-180 (150 chars) with ASCII-folded diacritics', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const header = result.content.split('\n')[0];
    const razaoSocial = header.substring(30, 180);
    expect(razaoSocial).toHaveLength(150);
    // "Empresa Teste Ação LTDA" -> "Empresa Teste Acao LTDA" (no ç/ã)
    expect(razaoSocial.trimEnd()).toBe('Empresa Teste Acao LTDA');
    // Must have been space-padded to the full width.
    expect(razaoSocial.endsWith(' '.repeat(10))).toBe(true);
  });

  it('truncates legal names longer than 150 chars without breaking the field width', async () => {
    const longName = 'A'.repeat(200);
    const { prisma } = await import('@/lib/prisma');
    (prisma.company.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      cnpj: '12.345.678/0001-90',
      legalName: longName,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const header = result.content.split('\n')[0];
    const razaoSocial = header.substring(30, 180);
    expect(razaoSocial).toBe('A'.repeat(150));
  });

  it('writes NSR inicial and NSR final as 9 digits each at Pos 181-198', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const header = result.content.split('\n')[0];
    const nsrInitial = header.substring(180, 189);
    const nsrFinal = header.substring(189, 198);
    expect(nsrInitial).toBe('000000001');
    expect(nsrFinal).toBe('000000003');
  });

  it('writes period start, period end and generation date at Pos 199-222 (ddmmaaaa, BRT)', async () => {
    // Freeze generation date so we can assert the exact bytes.
    vi.setSystemTime(new Date(Date.UTC(2026, 2, 31, 18, 0, 0))); // 15:00 BRT
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date(Date.UTC(2026, 2, 1, 3, 0, 0)), // 2026-03-01 00:00 BRT
      endDate: new Date(Date.UTC(2026, 3, 1, 2, 59, 0)), // 2026-03-31 23:59 BRT
    });

    const header = result.content.split('\n')[0];
    expect(header.substring(198, 206)).toBe('01032026'); // period start
    expect(header.substring(206, 214)).toBe('31032026'); // period end
    expect(header.substring(214, 222)).toBe('31032026'); // generated date
    expect(header.substring(222, 226)).toBe('1500'); // generated time hhmm
  });

  it('expresses punch dates in BRT even when the UTC instant already rolled to the next day', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-04-01'),
    });

    const lines = result.content.split('\n');
    const lastPunch = lines[3];
    // NSR 3 is at 2026-03-15 23:30 BRT — UTC is already 2026-03-16 02:30.
    // ddmmaaaa must stay on 15/03/2026 because BRT civil day did not change.
    expect(lastPunch.substring(10, 18)).toBe('15032026');
    expect(lastPunch.substring(18, 22)).toBe('2330');
  });

  it('writes the NSR of each Tipo 3 record as 9 digits at Pos 2-10', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\n');
    expect(lines[1].substring(1, 10)).toBe('000000001');
    expect(lines[2].substring(1, 10)).toBe('000000002');
    expect(lines[3].substring(1, 10)).toBe('000000003');
  });

  it('writes the PIS of each Tipo 3 record at Pos 23-33 stripped of punctuation', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.timeEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        nsrNumber: 1,
        timestamp: new Date(Date.UTC(2026, 2, 15, 11, 0, 0)),
        employee: { pis: '123.45678.90-1', cpf: '' },
      },
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\n');
    expect(lines[1].substring(22, 33)).toBe('12345678901');
  });

  it('zero-pads PIS when employee has no PIS registered', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.timeEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        nsrNumber: 9,
        timestamp: new Date(Date.UTC(2026, 2, 15, 11, 0, 0)),
        employee: { pis: '', cpf: '' },
      },
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    const lines = result.content.split('\n');
    expect(lines[1].substring(22, 33)).toBe('00000000000');
  });

  it('generates a filename that embeds CNPJ and the period in BRT (yyyymmdd)', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date(Date.UTC(2026, 2, 1, 3, 0, 0)), // 2026-03-01 BRT
      endDate: new Date(Date.UTC(2026, 3, 1, 2, 59, 0)), // 2026-03-31 BRT
    });

    expect(result.filename).toBe('AFD_12345678000190_20260301_20260331.txt');
  });

  it('rejects periods where startDate >= endDate', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        startDate: new Date('2026-03-31'),
        endDate: new Date('2026-03-01'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('rejects periods without any punches', async () => {
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
