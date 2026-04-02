import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S1000Contato {
  /** Employer contact phone (DDD + number) */
  fonePrinc: string;
  /** Alternative phone (optional) */
  foneAlternat?: string;
  /** Email for eSocial communications */
  emailPrinc?: string;
}

export interface S1000SoftwareHouse {
  /** CNPJ of the software house */
  cnpjSoftHouse: string;
  /** Name/contact of the software house */
  nmCont?: string;
  /** Phone of the software house */
  telefone?: string;
  /** Email of the software house */
  email?: string;
}

export interface S1000Input {
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

  // --- infoEmpregador > inclusao > idePeriodo ---
  /** Start date of validity (YYYY-MM) */
  iniValid: string;
  /** End date of validity (YYYY-MM), optional */
  fimValid?: string;

  // --- infoCadastro ---
  /** Razão Social / Nome do empregador */
  nmRazao: string;
  /** Classificação Tributária (eSocial Tabela 8): 1-99 */
  classTrib: string;
  /** Natureza Jurídica (eSocial Tabela 21): 4 digits */
  natJurid?: string;
  /** Indicativo de cooperativa: 0=Não, 1=Cooperativa de Trabalho, 2=Cooperativa de Produção, 3=Outras */
  indCoop?: number;
  /** Indicativo de construtora: 0=Não, 1=Empresa construtora */
  indConstr?: number;
  /** Indicativo de desoneração: 0=Não, 1=Optante */
  indDesFolha?: number;
  /** Indicativo de optante pelo SIMPLES: 0=Não, 1=Optante, 2=Optante exceto SIMEI, 3=SIMEI */
  indOptRegEletron?: number;
  /** CNAE preponderante (7 digits) */
  cnaePrep?: string;

  /** Dados de contato */
  contato?: S1000Contato;

  /** Informações do software house (optional) */
  softwareHouse?: S1000SoftwareHouse;
}

/**
 * Builder for eSocial event S-1000 — Informações do Empregador/Contribuinte.
 *
 * This is the foundational table event. Must be the FIRST event sent to
 * eSocial, as all other events depend on the employer registration.
 */
export class S1000Builder extends EsocialXmlBuilder<S1000Input> {
  protected eventType = 'S-1000';
  protected version = 'vS_01_02_00';

  build(input: S1000Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const infoEmpregador = this.buildInfoEmpregador(input);

    const evtContent = ideEvento + ideEmpregador + infoEmpregador;
    const evtInfoEmpregador = `<evtInfoEmpregador Id="${eventId}">${evtContent}</evtInfoEmpregador>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtInfoEmpregador/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtInfoEmpregador}</eSocial>`;
  }

  // ---------------------------------------------------------------------------
  // Info Empregador (inclusão)
  // ---------------------------------------------------------------------------

  private buildInfoEmpregador(input: S1000Input): string {
    const idePeriodo = this.buildIdePeriodo(input);
    const infoCadastro = this.buildInfoCadastro(input);

    const inclusao = this.tagGroup('inclusao', idePeriodo + infoCadastro);
    return this.tagGroup('infoEmpregador', inclusao);
  }

  private buildIdePeriodo(input: S1000Input): string {
    let content = '';
    content += this.tag('iniValid', input.iniValid);
    if (input.fimValid) content += this.tag('fimValid', input.fimValid);
    return this.tagGroup('idePeriodo', content);
  }

  private buildInfoCadastro(input: S1000Input): string {
    let content = '';

    content += this.tag('nmRazao', input.nmRazao);
    content += this.tag('classTrib', input.classTrib);
    if (input.natJurid) content += this.tag('natJurid', input.natJurid);
    if (input.indCoop !== undefined)
      content += this.tag('indCoop', input.indCoop);
    if (input.indConstr !== undefined)
      content += this.tag('indConstr', input.indConstr);
    if (input.indDesFolha !== undefined)
      content += this.tag('indDesFolha', input.indDesFolha);
    if (input.indOptRegEletron !== undefined)
      content += this.tag('indOptRegEletron', input.indOptRegEletron);
    if (input.cnaePrep) content += this.tag('cnaePrep', input.cnaePrep);

    if (input.contato) {
      content += this.buildContato(input.contato);
    }

    if (input.softwareHouse) {
      content += this.buildSoftwareHouse(input.softwareHouse);
    }

    return this.tagGroup('infoCadastro', content);
  }

  private buildContato(contato: S1000Contato): string {
    let content = '';
    content += this.tag('fonePrinc', contato.fonePrinc);
    if (contato.foneAlternat)
      content += this.tag('foneAlternat', contato.foneAlternat);
    if (contato.emailPrinc)
      content += this.tag('emailPrinc', contato.emailPrinc);
    return this.tagGroup('contato', content);
  }

  private buildSoftwareHouse(sh: S1000SoftwareHouse): string {
    let content = '';
    content += this.tag('cnpjSoftHouse', this.formatCNPJ(sh.cnpjSoftHouse));
    if (sh.nmCont) content += this.tag('nmCont', sh.nmCont);
    if (sh.telefone) content += this.tag('telefone', sh.telefone);
    if (sh.email) content += this.tag('email', sh.email);
    return this.tagGroup('softwareHouse', content);
  }
}
