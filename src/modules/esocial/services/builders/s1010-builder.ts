import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S1010Input {
  // --- ideEvento ---
  /** 1 = Original, 2 = Retificação */
  indRetif?: 1 | 2;
  /** 1 = Produção, 2 = Produção Restrita (homologação) */
  tpAmb?: 1 | 2;
  /** Receipt number (required when indRetif = 2) */
  nrRecibo?: string;

  // --- ideEmpregador ---
  /** 1 = CNPJ, 2 = CPF */
  tpInsc: number;
  /** Employer document (CNPJ or CPF) */
  nrInsc: string;

  // --- ideRubrica ---
  /** Código da rubrica (employer-defined, up to 30 chars) */
  codRubr: string;
  /** Identificador da tabela de rubricas (default "1") */
  ideTabRubr?: string;

  // --- idePeriodo ---
  /** Start date of validity (YYYY-MM) */
  iniValid: string;
  /** End date of validity (YYYY-MM), optional */
  fimValid?: string;

  // --- dadosRubrica ---
  /** Descrição da rubrica */
  dscRubr: string;
  /** Natureza da rubrica (eSocial Tabela 3, 4 dígitos) */
  natRubr: string;
  /** Tipo da rubrica: 1 = Provento, 2 = Desconto, 3 = Informativa */
  tpRubr: 1 | 2 | 3;
  /** Código de incidência tributária sobre a Contribuição Previdenciária (Tabela 21) */
  codIncCP: string;
  /** Código de incidência tributária sobre o IRRF (Tabela 21) */
  codIncIRRF: string;
  /** Código de incidência tributária sobre o FGTS (Tabela 21) */
  codIncFGTS: string;
  /** Código de incidência tributária sobre a Contribuição Sindical */
  codIncSIND?: string;
  /** Fator/percentual/valor da rubrica (optional multiplier) */
  fatorRubr?: number;
  /** Observação sobre a rubrica */
  observacao?: string;
}

/**
 * Builder for eSocial event S-1010 — Tabela de Rubricas.
 *
 * Registers the payroll line items (rubricas) used by the employer.
 * Each rubrica defines how a payment/deduction is classified for
 * tax and social security purposes.
 *
 * Must be sent after S-1000 and before any payroll event (S-1200).
 */
export class S1010Builder extends EsocialXmlBuilder<S1010Input> {
  protected eventType = 'S-1010';
  protected version = 'vS_01_02_00';

  build(input: S1010Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const infoRubrica = this.buildInfoRubrica(input);

    const evtContent = ideEvento + ideEmpregador + infoRubrica;
    const evtTabRubrica = `<evtTabRubrica Id="${eventId}">${evtContent}</evtTabRubrica>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtTabRubrica/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtTabRubrica}</eSocial>`;
  }

  // ---------------------------------------------------------------------------
  // Info Rubrica (inclusão)
  // ---------------------------------------------------------------------------

  private buildInfoRubrica(input: S1010Input): string {
    const ideRubrica = this.buildIdeRubrica(input);
    const dadosRubrica = this.buildDadosRubrica(input);

    const inclusao = this.tagGroup('inclusao', ideRubrica + dadosRubrica);
    return this.tagGroup('infoRubrica', inclusao);
  }

  private buildIdeRubrica(input: S1010Input): string {
    let content = '';
    content += this.tag('codRubr', input.codRubr);
    content += this.tag('ideTabRubr', input.ideTabRubr ?? '1');

    let idePeriodoContent = '';
    idePeriodoContent += this.tag('iniValid', input.iniValid);
    if (input.fimValid) idePeriodoContent += this.tag('fimValid', input.fimValid);
    content += this.tagGroup('idePeriodo', idePeriodoContent);

    return this.tagGroup('ideRubrica', content);
  }

  private buildDadosRubrica(input: S1010Input): string {
    let content = '';
    content += this.tag('dscRubr', input.dscRubr);
    content += this.tag('natRubr', input.natRubr);
    content += this.tag('tpRubr', input.tpRubr);
    content += this.tag('codIncCP', input.codIncCP);
    content += this.tag('codIncIRRF', input.codIncIRRF);
    content += this.tag('codIncFGTS', input.codIncFGTS);
    if (input.codIncSIND) content += this.tag('codIncSIND', input.codIncSIND);
    if (input.fatorRubr !== undefined) {
      content += this.tag('fatorRubr', this.formatMoney(input.fatorRubr));
    }
    if (input.observacao) content += this.tag('observacao', input.observacao);

    return this.tagGroup('dadosRubrica', content);
  }
}
