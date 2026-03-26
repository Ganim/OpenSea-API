import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S2205Address {
  tpLograd?: string;
  dscLograd: string;
  nrLograd: string;
  complemento?: string;
  bairro?: string;
  cep: string;
  codMunic?: string;
  uf: string;
}

export interface S2205Contato {
  fonePrinc?: string;
  emailPrinc?: string;
}

/**
 * Input data for the S-2205 event (Alteração de Dados Cadastrais do Trabalhador).
 */
export interface S2205Input {
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  // ideEmpregador
  tpInsc: number;
  nrInsc: string;

  // ideTrabalhador
  cpfTrab: string;

  // alteracao
  dtAlteracao: Date | string;

  // dadosTrabalhador
  nmTrab: string;
  /** M or F */
  sexo: string;
  /** eSocial Tabela 08 — Raça/Cor (1-6) */
  racaCor: number;
  /** eSocial Tabela 16 — Estado Civil (1=Solteiro, 2=Casado, etc.) */
  estCiv?: number;
  /** eSocial Tabela 04 — Grau de Instrução (01-12) */
  grauInstr?: string;
  /** Nome social */
  nmSoc?: string;
  dtNascto: Date | string;

  endereco?: S2205Address;
  contato?: S2205Contato;
}

/**
 * Builder for eSocial event S-2205 — Alteração de Dados Cadastrais do Trabalhador.
 *
 * Reports changes to an employee's personal data (name, address, marital status,
 * education level, social name, contact info, etc.).
 */
export class S2205Builder extends EsocialXmlBuilder<S2205Input> {
  protected eventType = 'S-2205';
  protected version = 'vS_01_02_00';

  build(input: S2205Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const ideTrabalhador = this.buildIdeTrabalhador(input);
    const alteracao = this.buildAlteracao(input);

    const evtContent = ideEvento + ideEmpregador + ideTrabalhador + alteracao;
    const evtAltCadastral = `<evtAltCadastral Id="${eventId}">${evtContent}</evtAltCadastral>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtAltCadastral/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtAltCadastral}</eSocial>`;
  }

  private buildIdeTrabalhador(input: S2205Input): string {
    const content = this.tag('cpfTrab', this.formatCPF(input.cpfTrab));
    return this.tagGroup('ideTrabalhador', content);
  }

  private buildAlteracao(input: S2205Input): string {
    let content = '';
    content += this.tag('dtAlteracao', this.formatDate(input.dtAlteracao));
    content += this.buildDadosTrabalhador(input);
    return this.tagGroup('alteracao', content);
  }

  private buildDadosTrabalhador(input: S2205Input): string {
    let content = '';
    content += this.tag('nmTrab', input.nmTrab);
    content += this.tag('sexo', input.sexo);
    content += this.tag('racaCor', input.racaCor);
    if (input.estCiv !== undefined) content += this.tag('estCiv', input.estCiv);
    if (input.grauInstr) content += this.tag('grauInstr', input.grauInstr);
    if (input.nmSoc) content += this.tag('nmSoc', input.nmSoc);
    content += this.tag('dtNascto', this.formatDate(input.dtNascto));

    if (input.endereco) {
      content += this.buildEndereco(input.endereco);
    }

    if (input.contato) {
      content += this.buildContato(input.contato);
    }

    return this.tagGroup('dadosTrabalhador', content);
  }

  private buildEndereco(addr: S2205Address): string {
    let brasilContent = '';
    if (addr.tpLograd) brasilContent += this.tag('tpLograd', addr.tpLograd);
    brasilContent += this.tag('dscLograd', addr.dscLograd);
    brasilContent += this.tag('nrLograd', addr.nrLograd);
    if (addr.complemento)
      brasilContent += this.tag('complemento', addr.complemento);
    if (addr.bairro) brasilContent += this.tag('bairro', addr.bairro);
    brasilContent += this.tag('cep', this.formatCEP(addr.cep));
    if (addr.codMunic) brasilContent += this.tag('codMunic', addr.codMunic);
    brasilContent += this.tag('uf', addr.uf);

    const brasil = this.tagGroup('brasil', brasilContent);
    return this.tagGroup('endereco', brasil);
  }

  private buildContato(contato: S2205Contato): string {
    let content = '';
    if (contato.fonePrinc) content += this.tag('fonePrinc', contato.fonePrinc);
    if (contato.emailPrinc)
      content += this.tag('emailPrinc', contato.emailPrinc);
    return this.tagGroup('contato', content);
  }
}
