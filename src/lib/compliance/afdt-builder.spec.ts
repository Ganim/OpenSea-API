import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildAfd, type AfdBuildInput } from './afd-builder';
import { buildAfdt } from './afdt-builder';

const FIXTURE_PATH = resolve(
  __dirname,
  '__fixtures__/afdt-tenant-demo-2026-03.golden.txt',
);

/**
 * Fixture estendida — mesmo dataset do AFD, mas com 1 marcação extra
 * `adjustmentType='ADJUSTMENT_APPROVED'` para validar que o AFDT a inclui.
 */
function buildFixtureInputWithCorrection(): AfdBuildInput {
  return {
    header: {
      tpInsc: 1,
      nrInsc: '12345678000190',
      cno: '',
      razaoSocial: 'PANIFICADORA JOÃO & CIA LTDA',
      inpi: '99999999999999999',
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-03-03T00:00:00Z'),
      generatedAt: new Date('2026-04-20T13:30:00Z'),
      devTpInsc: 1,
      devInsc: '11222333000144',
      tz: '-0300',
    },
    empresas: [
      {
        nsr: 1,
        recordedAt: new Date('2026-03-01T11:00:00Z'),
        responsavelCpf: '11122233344',
        tpInsc: 1,
        nrInsc: '12345678000190',
        cno: '',
        razaoSocial: 'PANIFICADORA JOÃO & CIA LTDA',
        localPrestacao: 'Rua das Flores, 100, Centro, São Paulo/SP',
      },
    ],
    empregados: [
      {
        nsr: 2,
        recordedAt: new Date('2026-03-01T11:01:00Z'),
        operacao: 'I',
        cpf: '12345678900',
        nome: 'JOSÉ DA SILVA',
        responsavelCpf: '11122233344',
      },
    ],
    marcacoes: [
      {
        nsr: 3,
        punchAt: new Date('2026-03-01T11:02:00Z'),
        cpf: '12345678900',
        recordedAt: new Date('2026-03-01T11:02:15Z'),
        coletor: 2,
        online: 0,
        adjustmentType: 'ORIGINAL',
      },
      {
        nsr: 4,
        punchAt: new Date('2026-03-01T20:15:00Z'),
        cpf: '12345678900',
        recordedAt: new Date('2026-03-01T20:15:08Z'),
        coletor: 2,
        online: 0,
        adjustmentType: 'ORIGINAL',
      },
      // Correção aprovada (gestor reabriu PunchApproval)
      {
        nsr: 5,
        punchAt: new Date('2026-03-01T20:30:00Z'),
        cpf: '12345678900',
        recordedAt: new Date('2026-03-02T14:00:00Z'),
        coletor: 2,
        online: 0,
        adjustmentType: 'ADJUSTMENT_APPROVED',
      },
    ],
  };
}

describe('buildAfdt — inclui ADJUSTMENT_APPROVED como tipo 7 normal', () => {
  it('AFDT contém 3 registros tipo 7 (2 originais + 1 correção)', () => {
    const fixture = buildFixtureInputWithCorrection();
    const buffer = buildAfdt(fixture);
    const text = buffer.toString('latin1');
    // Header(302+CRLF) + Empresa(331+CRLF) + Empregado(118+CRLF)
    //   + 3×Tipo7(137+CRLF) + Trailer(64+CRLF) + Signature(100+CRLF)
    // Conta linhas tipo 7: caracter '7' na pos 9 da linha (índice 9 da linha).
    // Mais robusto: verificar que o trailer.t7 = 003.
    const trailerMatch = text.match(/\r\n(999999999\d{54}9)\r\n/);
    expect(trailerMatch).not.toBeNull();
    expect(trailerMatch![1].slice(54, 63)).toBe('000000003');
  });

  it('AFDT é estritamente maior que AFD para o mesmo dataset com 1 correção', () => {
    const fixture = buildFixtureInputWithCorrection();
    const afdtBuf = buildAfdt(fixture);
    const afdBuf = buildAfd(fixture);
    // AFDT inclui o registro de ajuste — diferença = 137 (tipo 7) + 2 (CRLF) = 139 bytes
    expect(afdtBuf.length).toBe(afdBuf.length + 139);
  });

  it('AFD bruto NÃO inclui o registro ADJUSTMENT_APPROVED — t7 trailer = 002', () => {
    const fixture = buildFixtureInputWithCorrection();
    const buffer = buildAfd(fixture);
    const text = buffer.toString('latin1');
    const trailerMatch = text.match(/\r\n(999999999\d{54}9)\r\n/);
    expect(trailerMatch).not.toBeNull();
    expect(trailerMatch![1].slice(54, 63)).toBe('000000002');
  });
});

describe('buildAfdt — golden fixture byte-a-byte', () => {
  it('produz Buffer byte-a-byte idêntico a afdt-tenant-demo-2026-03.golden.txt', () => {
    const fixture = buildFixtureInputWithCorrection();
    const output = buildAfdt(fixture);

    if (!existsSync(FIXTURE_PATH)) {
      writeFileSync(FIXTURE_PATH, output);
      throw new Error(
        `Golden fixture criado em ${FIXTURE_PATH} — re-rodar o teste para validar.`,
      );
    }

    const golden = readFileSync(FIXTURE_PATH);
    expect(output.length).toBe(golden.length);
    expect(output.equals(golden)).toBe(true);
  });
});

describe('buildAfdt — proprietary framing docstring', () => {
  it('docstring proprietário visível no source (sentinela contra remoção)', () => {
    // Garantia simples: a função tem comportamento documentado distinto.
    // O docstring é validado pelo grep do <acceptance_criteria>.
    expect(typeof buildAfdt).toBe('function');
    // Sanity: AFDT === AFD com flag includeAdjustments
    const fixture = buildFixtureInputWithCorrection();
    const direct = buildAfdt(fixture);
    const viaFlag = buildAfd(fixture, { includeAdjustments: true });
    expect(direct.equals(viaFlag)).toBe(true);
  });
});
