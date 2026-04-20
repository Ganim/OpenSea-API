import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildAfd,
  __internals,
  type AfdBuildInput,
  type AfdMarcacao,
} from './afd-builder';

const FIXTURE_PATH = resolve(
  __dirname,
  '__fixtures__/afd-tenant-demo-2026-03.golden.txt',
);

/**
 * Fixture determinística usada nos golden tests. Datas em UTC com offset
 * convertido para -0300 pelo `formatDH`. INPI usa o placeholder convencional
 * `99999999999999999` (D-06).
 */
function buildFixtureInput(): AfdBuildInput {
  return {
    header: {
      tpInsc: 1,
      nrInsc: '12345678000190',
      cno: '',
      razaoSocial: 'PANIFICADORA JOÃO & CIA LTDA',
      inpi: '99999999999999999',
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-03-03T00:00:00Z'),
      generatedAt: new Date('2026-04-20T13:30:00Z'), // 10:30 -0300
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
        punchAt: new Date('2026-03-01T11:02:00Z'), // 08:02 -0300
        cpf: '12345678900',
        recordedAt: new Date('2026-03-01T11:02:15Z'),
        coletor: 2,
        online: 0,
      },
      {
        nsr: 4,
        punchAt: new Date('2026-03-01T20:15:00Z'), // 17:15 -0300
        cpf: '12345678900',
        recordedAt: new Date('2026-03-01T20:15:08Z'),
        coletor: 2,
        online: 0,
      },
    ],
  };
}

describe('buildAfd — line lengths (Portaria 671 Anexo I)', () => {
  it('Tipo 1 (cabeçalho) tem exatamente 302 chars', () => {
    const fixture = buildFixtureInput();
    const line = __internals.buildTipo1(fixture.header);
    expect(line.length).toBe(302);
  });

  it('Tipo 2 (empresa) tem exatamente 331 chars', () => {
    const fixture = buildFixtureInput();
    const line = __internals.buildTipo2(fixture.empresas[0], '-0300');
    expect(line.length).toBe(331);
  });

  it('Tipo 5 (empregado) tem exatamente 118 chars', () => {
    const fixture = buildFixtureInput();
    const line = __internals.buildTipo5(fixture.empregados[0], '-0300');
    expect(line.length).toBe(118);
  });

  it('Tipo 7 (marcação) tem exatamente 137 chars', () => {
    const fixture = buildFixtureInput();
    const { line } = __internals.buildTipo7(fixture.marcacoes[0], '', '-0300');
    expect(line.length).toBe(137);
  });

  it('Tipo 9 (trailer) tem exatamente 64 chars', () => {
    const line = __internals.buildTipo9({
      t2: 1,
      t3: 0,
      t4: 0,
      t5: 1,
      t6: 0,
      t7: 2,
    });
    expect(line.length).toBe(64);
  });

  it('signature line tem exatamente 100 chars', () => {
    const line = __internals.buildSignatureLine();
    expect(line.length).toBe(100);
    expect(line.startsWith('ASSINATURA_DIGITAL_EM_ARQUIVO_P7S')).toBe(true);
  });
});

describe('buildAfd — encoding ISO-8859-1 (Pitfall 1)', () => {
  it('caractere "JOÃO" produz exatamente 4 bytes em latin1 (não 5 UTF-8)', () => {
    expect(Buffer.byteLength('JOÃO', 'latin1')).toBe(4);
    expect(Buffer.byteLength('JOÃO', 'utf8')).toBe(5);
  });

  it('Tipo 1 com razão acentuada → buffer latin1 preserva tamanho fixo', () => {
    const fixture = buildFixtureInput();
    const line = __internals.buildTipo1(fixture.header);
    // 302 chars (string JS) — converte pra latin1 dá 302 bytes (não 303+ como UTF-8)
    const buf = Buffer.from(line, 'latin1');
    expect(buf.length).toBe(302);
  });

  it('CRC-16 na posição 299-302 do tipo 1 é uppercase hex 4 chars', () => {
    const fixture = buildFixtureInput();
    const line = __internals.buildTipo1(fixture.header);
    const crc = line.slice(298, 302);
    expect(crc).toMatch(/^[0-9A-F]{4}$/);
  });
});

describe('buildAfd — SHA-256 chain (Anexo I §9)', () => {
  it('hash[1] difere de hash[0] (chain effect)', () => {
    const fixture = buildFixtureInput();
    const r1 = __internals.buildTipo7(fixture.marcacoes[0], '', '-0300');
    const r2 = __internals.buildTipo7(fixture.marcacoes[1], r1.hash, '-0300');
    expect(r1.hash).not.toBe(r2.hash);
    expect(r1.hash.length).toBe(64);
    expect(r2.hash.length).toBe(64);
  });

  it('hash[1] depende causalmente de hash[0] — mudar prev altera o output', () => {
    const fixture = buildFixtureInput();
    const r2a = __internals.buildTipo7(
      fixture.marcacoes[1],
      'a'.repeat(64),
      '-0300',
    );
    const r2b = __internals.buildTipo7(
      fixture.marcacoes[1],
      'b'.repeat(64),
      '-0300',
    );
    expect(r2a.hash).not.toBe(r2b.hash);
  });
});

describe('buildAfd — golden fixture byte-a-byte', () => {
  it('produz Buffer byte-a-byte idêntico a afd-tenant-demo-2026-03.golden.txt', () => {
    const fixture = buildFixtureInput();
    const output = buildAfd(fixture);

    // First run / fixture missing: write it for inspection + commit
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

  it('AFD bruto NÃO inclui marcações ADJUSTMENT_APPROVED', () => {
    const fixture = buildFixtureInput();
    const adjusted: AfdMarcacao = {
      nsr: 5,
      punchAt: new Date('2026-03-01T20:30:00Z'),
      cpf: '12345678900',
      recordedAt: new Date('2026-03-01T20:30:05Z'),
      coletor: 2,
      online: 0,
      adjustmentType: 'ADJUSTMENT_APPROVED',
    };
    const withoutAdj = buildAfd(fixture);
    const withAdj = buildAfd({
      ...fixture,
      marcacoes: [...fixture.marcacoes, adjusted],
    });
    // Sem includeAdjustments, o adjusted é filtrado → mesmo tamanho
    expect(withoutAdj.length).toBe(withAdj.length);
  });
});

describe('buildAfd — validações', () => {
  it('lança RangeError quando NSR overflowa 9 dígitos', () => {
    const fixture = buildFixtureInput();
    expect(() =>
      __internals.buildTipo7(
        { ...fixture.marcacoes[0], nsr: 1_000_000_000 },
        '',
        '-0300',
      ),
    ).toThrow(RangeError);
  });

  it('lança Error quando endDate < startDate no header', () => {
    const fixture = buildFixtureInput();
    const broken = {
      ...fixture.header,
      startDate: new Date('2026-03-31'),
      endDate: new Date('2026-03-01'),
    };
    expect(() => __internals.buildTipo1(broken)).toThrow();
  });

  it('lança RangeError quando INPI ≠ 17 dígitos', () => {
    const fixture = buildFixtureInput();
    expect(() =>
      __internals.buildTipo1({ ...fixture.header, inpi: '123' }),
    ).toThrow(RangeError);
  });

  it('lança Error quando razão social vazia', () => {
    const fixture = buildFixtureInput();
    expect(() =>
      __internals.buildTipo1({ ...fixture.header, razaoSocial: '' }),
    ).toThrow();
  });
});

describe('buildAfd — ordering & trailer counts', () => {
  it('marcações são reordenadas por NSR crescente', () => {
    const fixture = buildFixtureInput();
    // Embaralha
    const shuffled = {
      ...fixture,
      marcacoes: [fixture.marcacoes[1], fixture.marcacoes[0]],
    };
    const a = buildAfd(fixture);
    const b = buildAfd(shuffled);
    // Output deve ser idêntico independente da ordem do input
    expect(a.equals(b)).toBe(true);
  });

  it('trailer inclui contagens corretas (t2, t5, t7)', () => {
    const fixture = buildFixtureInput();
    const buffer = buildAfd(fixture);
    const text = buffer.toString('latin1');
    // Trailer começa com "999999999" + counts no INÍCIO de uma linha.
    // Usamos `\r\n999999999` para evitar matches dentro do INPI placeholder
    // do header (que também contém "9"×17). Trailer + signature line são as
    // 2 últimas linhas do arquivo: trailer = bytes [-(64+2+100+2)..-(100+2+2)].
    const trailerMatch = text.match(/\r\n(999999999\d{54}9)\r\n/);
    expect(trailerMatch).not.toBeNull();
    const trailer = trailerMatch![1];
    expect(trailer.length).toBe(64);
    expect(trailer.slice(9, 18)).toBe('000000001'); // t2 = 1
    expect(trailer.slice(36, 45)).toBe('000000001'); // t5 = 1
    expect(trailer.slice(54, 63)).toBe('000000002'); // t7 = 2
    expect(trailer.slice(63, 64)).toBe('9'); // terminator
  });

  it('CRLF separa todas as linhas + CRLF final', () => {
    const fixture = buildFixtureInput();
    const buffer = buildAfd(fixture);
    const text = buffer.toString('latin1');
    expect(text.endsWith('\r\n')).toBe(true);
    // Conta CRLFs: header + empresa + empregado + 2 marcações + trailer + signature = 7 linhas
    const crlfCount = (text.match(/\r\n/g) ?? []).length;
    expect(crlfCount).toBe(7);
  });
});
