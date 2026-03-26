/**
 * Base class for all eSocial XML event builders.
 *
 * Provides shared utilities (XML escaping, date/document formatting, tag helpers)
 * and enforces a consistent interface across all event types.
 *
 * @template TInput - The shape of data required to generate the event XML.
 */
export abstract class EsocialXmlBuilder<TInput> {
  protected abstract eventType: string;
  protected abstract version: string;

  /**
   * Build the complete XML string for this event.
   */
  abstract build(input: TInput): string;

  // ---------------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------------

  protected xmlHeader(): string {
    return '<?xml version="1.0" encoding="UTF-8"?>';
  }

  // ---------------------------------------------------------------------------
  // Escape / Format helpers
  // ---------------------------------------------------------------------------

  protected escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Format a Date (or ISO string) to YYYY-MM-DD for eSocial.
   */
  protected formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Format a CPF (remove non-digits, left-pad to 11 chars).
   */
  protected formatCPF(cpf: string): string {
    return cpf.replace(/\D/g, '').padStart(11, '0');
  }

  /**
   * Format a CNPJ (remove non-digits, left-pad to 14 chars).
   */
  protected formatCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, '').padStart(14, '0');
  }

  /**
   * Format a monetary value to fixed 2-decimal string.
   */
  protected formatMoney(value: number): string {
    return value.toFixed(2);
  }

  /**
   * Format a CEP (remove non-digits, left-pad to 8 chars).
   */
  protected formatCEP(cep: string): string {
    return cep.replace(/\D/g, '').padStart(8, '0');
  }

  // ---------------------------------------------------------------------------
  // XML tag helpers
  // ---------------------------------------------------------------------------

  /**
   * Emit a single XML tag with text content.
   * Returns empty string if value is null / undefined / empty string.
   */
  protected tag(
    name: string,
    value: string | number | boolean | null | undefined,
  ): string {
    if (value === null || value === undefined || value === '') return '';
    return `<${name}>${this.escapeXml(String(value))}</${name}>`;
  }

  /**
   * Wrap inner content in a group tag.
   * If the inner content is empty (after trimming), returns empty string.
   */
  protected tagGroup(name: string, content: string): string {
    if (!content.trim()) return '';
    return `<${name}>${content}</${name}>`;
  }

  // ---------------------------------------------------------------------------
  // Event ID generation
  // ---------------------------------------------------------------------------

  /**
   * Generate the eSocial event ID.
   *
   * Format: ID{tpInsc}{nrInsc}{AAAAMMDDHHmmss}{seqNum}
   * - tpInsc  : 1 digit  (1 = CNPJ, 2 = CPF)
   * - nrInsc  : 14 digits (CNPJ padded)
   * - timestamp: 14 digits (YYYYMMDDHHmmss)
   * - seqNum  : 5 digits  (sequential, default 00001)
   */
  protected generateEventId(
    tpInsc: number,
    nrInsc: string,
    sequenceNumber: number = 1,
  ): string {
    const now = new Date();
    const ts = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');

    const insc = nrInsc.replace(/\D/g, '').padStart(14, '0');
    const seq = String(sequenceNumber).padStart(5, '0');

    return `ID${tpInsc}${insc}${ts}${seq}`;
  }

  // ---------------------------------------------------------------------------
  // Common XML blocks
  // ---------------------------------------------------------------------------

  /**
   * Build the <ideEvento> block shared by most events.
   *
   * @param indRetif 1 = Original, 2 = Retificação
   * @param tpAmb    1 = Produção, 2 = Produção Restrita (homologação)
   * @param nrRecibo Receipt number of the event being rectified (only when indRetif=2)
   */
  protected buildIdeEvento(
    indRetif: 1 | 2 = 1,
    tpAmb: 1 | 2 = 2,
    nrRecibo?: string,
  ): string {
    let content = '';
    content += this.tag('indRetif', indRetif);
    if (indRetif === 2 && nrRecibo) {
      content += this.tag('nrRecibo', nrRecibo);
    }
    content += this.tag('tpAmb', tpAmb);
    content += this.tag('procEmi', 1); // 1 = Aplicação do empregador
    content += this.tag('verProc', 'OpenSea-1.0');
    return this.tagGroup('ideEvento', content);
  }

  /**
   * Build the <ideEmpregador> block.
   *
   * @param tpInsc  1 = CNPJ, 2 = CPF
   * @param nrInsc  The employer document number
   */
  protected buildIdeEmpregador(tpInsc: number, nrInsc: string): string {
    let content = '';
    content += this.tag('tpInsc', tpInsc);
    content += this.tag(
      'nrInsc',
      tpInsc === 1 ? this.formatCNPJ(nrInsc) : this.formatCPF(nrInsc),
    );
    return this.tagGroup('ideEmpregador', content);
  }
}
