import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S1005Endereco {
  /** Tipo de logradouro (R, AV, TV, etc.) */
  tpLograd?: string;
  /** Descrição do logradouro */
  dscLograd: string;
  /** Número do logradouro */
  nrLograd: string;
  /** Complemento */
  complemento?: string;
  /** Bairro */
  bairro?: string;
  /** CEP (8 dígitos) */
  cep: string;
  /** Código do município (IBGE, 7 dígitos) */
  codMunic: string;
  /** UF */
  uf: string;
}

export interface S1005ContatoEstab {
  /** Telefone do estabelecimento */
  fonePrinc?: string;
  /** Email do estabelecimento */
  emailPrinc?: string;
}

export interface S1005Input {
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

  // --- ideEstab ---
  /** Tipo de inscrição do estabelecimento: 1 = CNPJ, 2 = CPF, 3 = CAEPF, 4 = CNO */
  tpInscEstab: number;
  /** Número de inscrição do estabelecimento */
  nrInscEstab: string;

  // --- idePeriodo ---
  /** Start date of validity (YYYY-MM) */
  iniValid: string;
  /** End date of validity (YYYY-MM), optional */
  fimValid?: string;

  // --- dadosEstab ---
  /** CNAE preponderante do estabelecimento (7 dígitos) */
  cnaePrep: string;

  /** Endereço do estabelecimento */
  endereco: S1005Endereco;

  /** Contato do estabelecimento */
  contato?: S1005ContatoEstab;

  // --- aliqGilrat ---
  /** FAP — Fator Acidentário de Prevenção (0.5000 a 2.0000) */
  fap?: number;
  /** Alíquota RAT (1, 2 ou 3) */
  aliqRat?: number;
}

/**
 * Builder for eSocial event S-1005 — Tabela de Estabelecimentos,
 * Obras ou Unidades de Órgãos Públicos.
 *
 * Registers each establishment (branch/site) of the employer.
 * Must be sent after S-1000 and before any worker events.
 */
export class S1005Builder extends EsocialXmlBuilder<S1005Input> {
  protected eventType = 'S-1005';
  protected version = 'vS_01_02_00';

  build(input: S1005Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const infoEstab = this.buildInfoEstab(input);

    const evtContent = ideEvento + ideEmpregador + infoEstab;
    const evtTabEstab = `<evtTabEstab Id="${eventId}">${evtContent}</evtTabEstab>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtTabEstab/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtTabEstab}</eSocial>`;
  }

  // ---------------------------------------------------------------------------
  // Info Estabelecimento (inclusão)
  // ---------------------------------------------------------------------------

  private buildInfoEstab(input: S1005Input): string {
    const ideEstab = this.buildIdeEstab(input);
    const dadosEstab = this.buildDadosEstab(input);

    const inclusao = this.tagGroup('inclusao', ideEstab + dadosEstab);
    return this.tagGroup('infoEstab', inclusao);
  }

  private buildIdeEstab(input: S1005Input): string {
    let content = '';
    content += this.tag('tpInsc', input.tpInscEstab);
    content += this.tag('nrInsc', input.nrInscEstab);

    let idePeriodoContent = '';
    idePeriodoContent += this.tag('iniValid', input.iniValid);
    if (input.fimValid)
      idePeriodoContent += this.tag('fimValid', input.fimValid);
    content += this.tagGroup('idePeriodo', idePeriodoContent);

    return this.tagGroup('ideEstab', content);
  }

  private buildDadosEstab(input: S1005Input): string {
    let content = '';
    content += this.tag('cnaePrep', input.cnaePrep);

    // aliqGilrat (optional)
    if (input.fap !== undefined || input.aliqRat !== undefined) {
      let aliqContent = '';
      if (input.aliqRat !== undefined)
        aliqContent += this.tag('aliqRat', input.aliqRat);
      if (input.fap !== undefined)
        aliqContent += this.tag('fap', input.fap.toFixed(4));
      content += this.tagGroup('aliqGilrat', aliqContent);
    }

    // endereco
    content += this.buildEndereco(input.endereco);

    // contato
    if (input.contato) {
      content += this.buildContato(input.contato);
    }

    return this.tagGroup('dadosEstab', content);
  }

  private buildEndereco(addr: S1005Endereco): string {
    let brasilContent = '';
    if (addr.tpLograd) brasilContent += this.tag('tpLograd', addr.tpLograd);
    brasilContent += this.tag('dscLograd', addr.dscLograd);
    brasilContent += this.tag('nrLograd', addr.nrLograd);
    if (addr.complemento)
      brasilContent += this.tag('complemento', addr.complemento);
    if (addr.bairro) brasilContent += this.tag('bairro', addr.bairro);
    brasilContent += this.tag('cep', this.formatCEP(addr.cep));
    brasilContent += this.tag('codMunic', addr.codMunic);
    brasilContent += this.tag('uf', addr.uf);

    const brasil = this.tagGroup('brasil', brasilContent);
    return this.tagGroup('endereco', brasil);
  }

  private buildContato(contato: S1005ContatoEstab): string {
    let content = '';
    if (contato.fonePrinc) content += this.tag('fonePrinc', contato.fonePrinc);
    if (contato.emailPrinc)
      content += this.tag('emailPrinc', contato.emailPrinc);
    return this.tagGroup('contato', content);
  }
}
