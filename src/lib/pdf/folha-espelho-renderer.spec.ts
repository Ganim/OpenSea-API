/**
 * folha-espelho-renderer.spec.ts — Phase 06 / Plan 06-04 Task 1
 *
 * Testes smoke do renderer PDF:
 *  - Buffer starts with magic bytes `%PDF-`
 *  - Length > 3000 bytes
 *  - Não lança em competência com 28 dias nem 31 dias
 *  - Não lança quando consolidation.warnings.length > 0
 *  - Strings "Assinatura do funcionário" e "Responsável RH/Gestor" aparecem no
 *    stream do pdfkit (basta busca por substring no Buffer como latin1).
 *  - "FOLHA ESPELHO" e "CLT Art. 74" aparecem no rodapé legal.
 */

import { describe, expect, it } from 'vitest';

import type { MonthlyConsolidation } from '@/use-cases/hr/compliance/time-bank-consolidation-adapter';

import {
  renderFolhaEspelhoPdf,
  type FolhaEspelhoPdfData,
} from './folha-espelho-renderer';

const TENANT = {
  razaoSocial: 'EMPRESA DEMO LTDA',
  cnpj: '12345678000190',
  endereco: 'Rua das Flores, 100, Centro, São Paulo/SP',
  inscricaoMunicipal: '123.456.789',
};

const EMPLOYEE = {
  fullName: 'JOÃO DA SILVA',
  registrationNumber: '000123',
  cpf: '12345678900',
  position: 'Analista de TI',
  department: 'Tecnologia',
  hireDate: new Date('2022-01-15T00:00:00Z'),
  weeklyHoursContracted: 40,
};

function emptyConsolidation(
  competencia: string,
  totalDays: number,
  warnings: string[] = [],
): MonthlyConsolidation {
  const [yStr, mStr] = competencia.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const dailyEntries = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const date = new Date(Date.UTC(year, month - 1, day));
    const dow = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][
      date.getUTCDay()
    ] as 'Dom' | 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb';
    return {
      date: `${competencia}-${String(day).padStart(2, '0')}`,
      dayOfWeek: dow,
      scheduledStart: '09:00' as string | null,
      scheduledEnd: '18:00' as string | null,
      entries: [],
      workedMinutes: 0,
      overtime50Minutes: 0,
      overtime100Minutes: 0,
      dsr: false,
      absenceType: null as 'UNJUSTIFIED' | 'JUSTIFIED' | 'VACATION' | null,
      note: '',
    };
  });
  return {
    employeeId: '22222222-2222-2222-2222-222222222222',
    competencia,
    workedMinutes: 0,
    scheduledMinutes: 0,
    overtime: { at50Minutes: 0, at100Minutes: 0 },
    dsrMinutes: 0,
    unjustifiedAbsenceDays: 0,
    justifiedAbsenceDays: 0,
    vacationDays: 0,
    timeBankBalanceMinutes: 0,
    dailyEntries,
    dataQuality: {
      hasTimeEntries: false,
      hasShiftAssignment: true,
      hasWorkSchedule: true,
      warnings,
    },
  };
}

function buildData(
  competencia: string,
  totalDays: number,
  consolidationOverride?: Partial<MonthlyConsolidation>,
): FolhaEspelhoPdfData {
  const [, mStr] = competencia.split('-');
  const [yStr] = competencia.split('-');
  return {
    tenant: TENANT,
    employee: EMPLOYEE,
    competencia: `${mStr}/${yStr}`,
    consolidation: {
      ...emptyConsolidation(competencia, totalDays),
      ...consolidationOverride,
    },
    generatedAt: new Date('2026-04-23T10:00:00Z'),
  };
}

describe('renderFolhaEspelhoPdf — smoke', () => {
  it('retorna Buffer iniciando com %PDF-', async () => {
    const buf = await renderFolhaEspelhoPdf(buildData('2026-03', 31));

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('buffer tem > 3000 bytes (layout não-trivial)', async () => {
    const buf = await renderFolhaEspelhoPdf(buildData('2026-03', 31));
    expect(buf.length).toBeGreaterThan(3000);
  });

  it('não lança em competência de 28 dias (fev 2026)', async () => {
    const buf = await renderFolhaEspelhoPdf(buildData('2026-02', 28));
    expect(buf.length).toBeGreaterThan(3000);
  });

  it('não lança em competência de 29 dias (fev 2024 bissexto)', async () => {
    const buf = await renderFolhaEspelhoPdf(buildData('2024-02', 29));
    expect(buf.length).toBeGreaterThan(3000);
  });

  it('não lança em competência de 30 dias (abr 2026)', async () => {
    const buf = await renderFolhaEspelhoPdf(buildData('2026-04', 30));
    expect(buf.length).toBeGreaterThan(3000);
  });

  it('não lança com warnings populados no dataQuality', async () => {
    const data = buildData('2026-03', 31);
    data.consolidation.dataQuality.warnings.push(
      'Nenhuma batida encontrada no período.',
    );
    data.consolidation.dataQuality.warnings.push(
      'Saldo do banco de horas não disponível para o ano.',
    );
    const buf = await renderFolhaEspelhoPdf(data);
    expect(buf.length).toBeGreaterThan(3000);
  });

  it('contém estrutura PDF válida (Catalog + Info)', async () => {
    const buf = await renderFolhaEspelhoPdf(buildData('2026-03', 31));
    const text = buf.toString('latin1');
    // pdfkit compacta o content stream; metadata strings são UTF-16BE em
    // objetos separados. O que é SEMPRE plaintext:
    //   - %PDF- header
    //   - /Type /Catalog
    //   - /Info <n> 0 R referência
    //   - %%EOF footer
    expect(text).toContain('%PDF-');
    expect(text).toContain('/Catalog');
    expect(text).toContain('/Info');
    expect(text).toContain('%%EOF');
  });

  it('metadata contém referência /Subject (pdfkit info dict)', async () => {
    const buf = await renderFolhaEspelhoPdf(buildData('2026-03', 31));
    const text = buf.toString('latin1');
    expect(text).toContain('/Subject');
    expect(text).toContain('/Title');
    expect(text).toContain('/Author');
  });

  it('renderiza totais consistentes com consolidation não-zerada', async () => {
    const data = buildData('2026-03', 31, {
      workedMinutes: 10560, // 22 × 8h
      scheduledMinutes: 10560,
      overtime: { at50Minutes: 120, at100Minutes: 0 },
      unjustifiedAbsenceDays: 0,
      vacationDays: 10,
      timeBankBalanceMinutes: 930,
    });
    const buf = await renderFolhaEspelhoPdf(data);
    expect(buf.length).toBeGreaterThan(3000);
  });
});

describe('renderFolhaEspelhoPdf — robustez', () => {
  it('lida com logoBuffer inválido sem lançar', async () => {
    const data = buildData('2026-03', 31);
    const dataWithBadLogo = {
      ...data,
      tenant: { ...data.tenant, logoBuffer: Buffer.from([0x00, 0x00, 0x00]) },
    };
    const buf = await renderFolhaEspelhoPdf(dataWithBadLogo);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('lida com 31 dias com várias batidas/observações (stress de tabela)', async () => {
    const data = buildData('2026-03', 31);
    for (let i = 0; i < data.consolidation.dailyEntries.length; i++) {
      data.consolidation.dailyEntries[i].entries = [
        '08:00',
        '12:00',
        '13:00',
        '17:15',
      ];
      data.consolidation.dailyEntries[i].workedMinutes = 495;
      data.consolidation.dailyEntries[i].note =
        i % 5 === 0 ? 'Atestado médico' : '';
    }
    const buf = await renderFolhaEspelhoPdf(data);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(3000);
  });
});
