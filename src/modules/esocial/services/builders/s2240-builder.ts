import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S2240InfoAmb {
  /** Código do ambiente (employer-defined) */
  codAmb: string;
  /** Descrição do setor */
  dscSetor?: string;
  /** 1=CNPJ, 2=CPF */
  tpInsc?: number;
  /** CNPJ/CPF do local */
  nrInsc?: string;
}

export interface S2240FatorRisco {
  /** Tabela 23 — Código do Fator de Risco */
  codFatRis: string;
  /** Descrição do fator de risco */
  dscFatRis?: string;
  /** 1=Qualitativo, 2=Quantitativo */
  tpAval?: number;
  /** Intensidade/Concentração (quantitativo) */
  intConc?: number;
  /** Limite de tolerância */
  limTol?: number;
  /** Unidade de medida */
  unMed?: number;
  /** Técnica de medição */
  tecMedicao?: string;
  /** S or N — Gera insalubridade */
  insalubridade?: string;
  /** S or N — Gera periculosidade */
  periculosidade?: string;
  /** 1=15 anos, 2=20 anos, 3=25 anos, 4=Não enseja */
  aposentEsp?: number;
}

export interface S2240Epc {
  /** S or N — Uso de EPC */
  utilizEPC: string;
  /** Descrição do EPC */
  dscEpc?: string;
  /** S or N — EPC é eficaz */
  eficEpc?: string;
}

export interface S2240Epi {
  /** S or N — Uso de EPI */
  utilizEPI: string;
  /** Descrição do EPI */
  dscEpi?: string;
  /** S or N — EPI é eficaz */
  eficEpi?: string;
  /** Certificado de Aprovação do MTE */
  caEPI?: string;
}

/**
 * Input data for the S-2240 event (Condições Ambientais do Trabalho).
 */
export interface S2240Input {
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  // ideEmpregador
  tpInsc: number;
  nrInsc: string;

  // ideVinculo
  cpfTrab: string;
  matricula: string;

  // infoExpRisco
  dtIniCondicao: Date | string;
  infoAmb: S2240InfoAmb;
  fatRisco: S2240FatorRisco[];

  epc?: S2240Epc;
  epi?: S2240Epi;

  /** Responsável pelos registros ambientais */
  respReg?: {
    nmResp: string;
    nrCRM?: string;
    ufCRM?: string;
    cpfResp?: string;
  };
}

/**
 * Builder for eSocial event S-2240 — Condições Ambientais do Trabalho.
 *
 * Reports the environmental conditions, risk factors, and protective equipment
 * associated with an employee's work position. Used for occupational health
 * compliance (PPP, LTCAT, PPRA/PGR).
 */
export class S2240Builder extends EsocialXmlBuilder<S2240Input> {
  protected eventType = 'S-2240';
  protected version = 'vS_01_02_00';

  build(input: S2240Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const ideVinculo = this.buildIdeVinculo(input);
    const infoExpRisco = this.buildInfoExpRisco(input);

    const evtContent = ideEvento + ideEmpregador + ideVinculo + infoExpRisco;
    const evtExpRisco = `<evtExpRisco Id="${eventId}">${evtContent}</evtExpRisco>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtExpRisco/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtExpRisco}</eSocial>`;
  }

  private buildIdeVinculo(input: S2240Input): string {
    let content = '';
    content += this.tag('cpfTrab', this.formatCPF(input.cpfTrab));
    content += this.tag('matricula', input.matricula);
    return this.tagGroup('ideVinculo', content);
  }

  private buildInfoExpRisco(input: S2240Input): string {
    let content = '';
    content += this.tag('dtIniCondicao', this.formatDate(input.dtIniCondicao));

    // infoAmb
    content += this.buildInfoAmb(input.infoAmb);

    // fatRisco
    for (const fator of input.fatRisco) {
      content += this.buildFatorRisco(fator);
    }

    // epc
    if (input.epc) {
      content += this.buildEpc(input.epc);
    }

    // epi
    if (input.epi) {
      content += this.buildEpi(input.epi);
    }

    // respReg
    if (input.respReg) {
      content += this.buildRespReg(input.respReg);
    }

    return this.tagGroup('infoExpRisco', content);
  }

  private buildInfoAmb(infoAmb: S2240InfoAmb): string {
    let content = '';
    content += this.tag('codAmb', infoAmb.codAmb);
    if (infoAmb.dscSetor) content += this.tag('dscSetor', infoAmb.dscSetor);
    if (infoAmb.tpInsc !== undefined)
      content += this.tag('tpInsc', infoAmb.tpInsc);
    if (infoAmb.nrInsc) content += this.tag('nrInsc', infoAmb.nrInsc);
    return this.tagGroup('infoAmb', content);
  }

  private buildFatorRisco(fator: S2240FatorRisco): string {
    let content = '';
    content += this.tag('codFatRis', fator.codFatRis);
    if (fator.dscFatRis) content += this.tag('dscFatRis', fator.dscFatRis);
    if (fator.tpAval !== undefined) content += this.tag('tpAval', fator.tpAval);
    if (fator.intConc !== undefined)
      content += this.tag('intConc', fator.intConc);
    if (fator.limTol !== undefined) content += this.tag('limTol', fator.limTol);
    if (fator.unMed !== undefined) content += this.tag('unMed', fator.unMed);
    if (fator.tecMedicao) content += this.tag('tecMedicao', fator.tecMedicao);
    if (fator.insalubridade)
      content += this.tag('insalubridade', fator.insalubridade);
    if (fator.periculosidade)
      content += this.tag('periculosidade', fator.periculosidade);
    if (fator.aposentEsp !== undefined)
      content += this.tag('aposentEsp', fator.aposentEsp);
    return this.tagGroup('fatRisco', content);
  }

  private buildEpc(epc: S2240Epc): string {
    let content = '';
    content += this.tag('utilizEPC', epc.utilizEPC);
    if (epc.dscEpc) content += this.tag('dscEpc', epc.dscEpc);
    if (epc.eficEpc) content += this.tag('eficEpc', epc.eficEpc);
    return this.tagGroup('epc', content);
  }

  private buildEpi(epi: S2240Epi): string {
    let content = '';
    content += this.tag('utilizEPI', epi.utilizEPI);
    if (epi.dscEpi) content += this.tag('dscEpi', epi.dscEpi);
    if (epi.eficEpi) content += this.tag('eficEpi', epi.eficEpi);
    if (epi.caEPI) content += this.tag('caEPI', epi.caEPI);
    return this.tagGroup('epi', content);
  }

  private buildRespReg(respReg: NonNullable<S2240Input['respReg']>): string {
    let content = '';
    if (respReg.cpfResp)
      content += this.tag('cpfResp', this.formatCPF(respReg.cpfResp));
    content += this.tag('nmResp', respReg.nmResp);
    if (respReg.nrCRM) content += this.tag('nrCRM', respReg.nrCRM);
    if (respReg.ufCRM) content += this.tag('ufCRM', respReg.ufCRM);
    return this.tagGroup('respReg', content);
  }
}
