import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S1020Input {
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

  // --- ideLotacao ---
  /** Código da lotação tributária (employer-defined) */
  codLotacao: string;

  // --- idePeriodo ---
  /** Start date of validity (YYYY-MM) */
  iniValid: string;
  /** End date of validity (YYYY-MM), optional */
  fimValid?: string;

  // --- dadosLotacao ---
  /**
   * Tipo de lotação tributária (eSocial Tabela 10):
   * 01=Empregador, 02=Obra, 03=Órgão gestor de mão de obra,
   * 04=Estabelecimento de terceiros, etc.
   */
  tpLotacao: string;
  /** Tipo de inscrição da lotação: 1 = CNPJ, 2 = CPF */
  tpInscLot?: number;
  /** Número de inscrição da lotação (optional for tpLotacao=01) */
  nrInscLot?: string;

  // --- fpasLotacao ---
  /** Código FPAS (Fundo de Previdência e Assistência Social, 3 dígitos) */
  fpas: string;
  /** Código de terceiros (eSocial Tabela 4, 4 dígitos) */
  codTercs: string;
  /** Código de terceiros suspensos (por processo judicial, 4 dígitos) */
  codTercsSusp?: string;

  // --- infoProcJudTerceiros (optional) ---
  /** Número do processo judicial que suspende contribuição de terceiros */
  nrProcJud?: string;
  /** Código de terceiros suspenso pelo processo */
  codTerc?: string;
}

/**
 * Builder for eSocial event S-1020 — Tabela de Lotações Tributárias.
 *
 * Defines the tax allocation groups used to classify workers for
 * FPAS and third-party contributions (SESI, SENAI, INCRA, etc.).
 *
 * Must be sent after S-1000 and before any payroll event (S-1200).
 */
export class S1020Builder extends EsocialXmlBuilder<S1020Input> {
  protected eventType = 'S-1020';
  protected version = 'vS_01_02_00';

  build(input: S1020Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const infoLotacao = this.buildInfoLotacao(input);

    const evtContent = ideEvento + ideEmpregador + infoLotacao;
    const evtTabLotacao = `<evtTabLotacao Id="${eventId}">${evtContent}</evtTabLotacao>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtTabLotacao/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtTabLotacao}</eSocial>`;
  }

  // ---------------------------------------------------------------------------
  // Info Lotação (inclusão)
  // ---------------------------------------------------------------------------

  private buildInfoLotacao(input: S1020Input): string {
    const ideLotacao = this.buildIdeLotacao(input);
    const dadosLotacao = this.buildDadosLotacao(input);

    const inclusao = this.tagGroup('inclusao', ideLotacao + dadosLotacao);
    return this.tagGroup('infoLotacao', inclusao);
  }

  private buildIdeLotacao(input: S1020Input): string {
    let content = '';
    content += this.tag('codLotacao', input.codLotacao);

    let idePeriodoContent = '';
    idePeriodoContent += this.tag('iniValid', input.iniValid);
    if (input.fimValid)
      idePeriodoContent += this.tag('fimValid', input.fimValid);
    content += this.tagGroup('idePeriodo', idePeriodoContent);

    return this.tagGroup('ideLotacao', content);
  }

  private buildDadosLotacao(input: S1020Input): string {
    let content = '';
    content += this.tag('tpLotacao', input.tpLotacao);
    if (input.tpInscLot !== undefined)
      content += this.tag('tpInsc', input.tpInscLot);
    if (input.nrInscLot) content += this.tag('nrInsc', input.nrInscLot);

    // fpasLotacao
    content += this.buildFpasLotacao(input);

    // infoProcJudTerceiros (optional)
    if (input.nrProcJud) {
      content += this.buildInfoProcJudTerceiros(input);
    }

    return this.tagGroup('dadosLotacao', content);
  }

  private buildFpasLotacao(input: S1020Input): string {
    let content = '';
    content += this.tag('fpas', input.fpas);
    content += this.tag('codTercs', input.codTercs);
    if (input.codTercsSusp)
      content += this.tag('codTercsSusp', input.codTercsSusp);
    return this.tagGroup('fpasLotacao', content);
  }

  private buildInfoProcJudTerceiros(input: S1020Input): string {
    let procJudContent = '';
    procJudContent += this.tag('nrProcJud', input.nrProcJud);
    if (input.codTerc) procJudContent += this.tag('codTerc', input.codTerc);

    const procJudTerceiro = this.tagGroup('procJudTerceiro', procJudContent);
    return this.tagGroup('infoProcJudTerceiros', procJudTerceiro);
  }
}
