import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S1070InfoSusp {
  /** Código do indicativo de suspensão (eSocial Tabela 23) */
  codSusp: string;
  /** Indicativo de suspensão: 01=Liminar, 02=Depósito, 03=Mandado de Segurança, etc. */
  indSusp: string;
  /** Data da decisão/sentença */
  dtDecisao: Date | string;
  /** Indicativo de depósito do montante integral: S/N */
  indDeposito?: 'S' | 'N';
}

export interface S1070Input {
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

  // --- ideProcesso ---
  /** Tipo de processo: 1 = Administrativo, 2 = Judicial */
  tpProc: 1 | 2;
  /** Número do processo */
  nrProc: string;

  // --- idePeriodo ---
  /** Start date of validity (YYYY-MM) */
  iniValid: string;
  /** End date of validity (YYYY-MM), optional */
  fimValid?: string;

  // --- dadosProc ---
  /** Indicativo de autoria da ação: 1 = Empregador, 2 = Empregado, 3 = Outros */
  indAutoria: 1 | 2 | 3;
  /** Indicativo de matéria do processo (eSocial Tabela 24): 01-99 */
  indMatProc: string;
  /** Observação sobre o processo (opcional) */
  observacao?: string;

  /** Informações de suspensão (pode haver múltiplas) */
  infoSusp?: S1070InfoSusp[];
}

/**
 * Builder for eSocial event S-1070 — Tabela de Processos
 * Administrativos/Judiciais.
 *
 * Registers administrative or judicial proceedings that affect tax/contribution
 * calculations (e.g., injunctions that suspend INSS, FGTS, or third-party
 * contributions).
 *
 * Must be sent before referencing the process in other events.
 */
export class S1070Builder extends EsocialXmlBuilder<S1070Input> {
  protected eventType = 'S-1070';
  protected version = 'vS_01_02_00';

  build(input: S1070Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const infoProcesso = this.buildInfoProcesso(input);

    const evtContent = ideEvento + ideEmpregador + infoProcesso;
    const evtTabProcesso = `<evtTabProcesso Id="${eventId}">${evtContent}</evtTabProcesso>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtTabProcesso/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtTabProcesso}</eSocial>`;
  }

  // ---------------------------------------------------------------------------
  // Info Processo (inclusão)
  // ---------------------------------------------------------------------------

  private buildInfoProcesso(input: S1070Input): string {
    const ideProcesso = this.buildIdeProcesso(input);
    const dadosProc = this.buildDadosProc(input);

    const inclusao = this.tagGroup('inclusao', ideProcesso + dadosProc);
    return this.tagGroup('infoProcesso', inclusao);
  }

  private buildIdeProcesso(input: S1070Input): string {
    let content = '';
    content += this.tag('tpProc', input.tpProc);
    content += this.tag('nrProc', input.nrProc);

    let idePeriodoContent = '';
    idePeriodoContent += this.tag('iniValid', input.iniValid);
    if (input.fimValid) idePeriodoContent += this.tag('fimValid', input.fimValid);
    content += this.tagGroup('idePeriodo', idePeriodoContent);

    return this.tagGroup('ideProcesso', content);
  }

  private buildDadosProc(input: S1070Input): string {
    let content = '';
    content += this.tag('indAutoria', input.indAutoria);
    content += this.tag('indMatProc', input.indMatProc);
    if (input.observacao) content += this.tag('observacao', input.observacao);

    // infoSusp (multiple allowed)
    if (input.infoSusp && input.infoSusp.length > 0) {
      for (const susp of input.infoSusp) {
        content += this.buildInfoSusp(susp);
      }
    }

    return this.tagGroup('dadosProc', content);
  }

  private buildInfoSusp(susp: S1070InfoSusp): string {
    let content = '';
    content += this.tag('codSusp', susp.codSusp);
    content += this.tag('indSusp', susp.indSusp);
    content += this.tag('dtDecisao', this.formatDate(susp.dtDecisao));
    if (susp.indDeposito) content += this.tag('indDeposito', susp.indDeposito);
    return this.tagGroup('infoSusp', content);
  }
}
