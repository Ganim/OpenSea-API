export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';

export interface PixParseResult {
  type: 'COPIA_COLA' | 'CHAVE';
  pixKey: string;
  pixKeyType: PixKeyType;
  merchantName?: string;
  merchantCity?: string;
  amount?: number;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class PixCode {
  static parse(input: string): PixParseResult | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('000201')) {
      return PixCode.parseCopiaECola(trimmed);
    }

    return PixCode.parseChave(trimmed);
  }

  private static parseCopiaECola(payload: string): PixParseResult | null {
    // P3-34: validate the CRC16-CCITT trailer (tag 63, always 4 hex chars)
    // before trusting any field. A tampered / corrupt payload must NOT be
    // accepted silently — that was the pre-fix behavior and let garbage or
    // malicious codes flow into reconciliation and payment orders.
    if (!PixCode.verifyCrc(payload)) return null;

    const tlv = PixCode.parseTLV(payload);
    if (!tlv) return null;

    // Tag 26: Merchant Account Information
    let pixKey = '';
    let pixKeyType: PixKeyType = 'EVP';
    const tag26 = tlv.get('26');
    if (tag26) {
      const subTlv = PixCode.parseTLV(tag26);
      if (subTlv) {
        // Sub-tag 01: Pix key
        const key = subTlv.get('01');
        if (key) {
          pixKey = key;
          pixKeyType = PixCode.detectKeyType(key);
        }
      }
    }

    // Tag 59: Merchant Name
    const merchantName = tlv.get('59');

    // Tag 60: Merchant City
    const merchantCity = tlv.get('60');

    // Tag 54: Transaction Amount
    let amount: number | undefined;
    const tag54 = tlv.get('54');
    if (tag54) {
      const parsed = parseFloat(tag54);
      if (!isNaN(parsed)) {
        amount = parsed;
      }
    }

    return {
      type: 'COPIA_COLA',
      pixKey,
      pixKeyType,
      merchantName,
      merchantCity,
      amount,
    };
  }

  private static parseChave(key: string): PixParseResult | null {
    const keyType = PixCode.detectKeyType(key);

    return {
      type: 'CHAVE',
      pixKey: key,
      pixKeyType: keyType,
    };
  }

  static detectKeyType(key: string): PixKeyType {
    const cleaned = key.replace(/[.\-/]/g, '');

    // CPF: 11 digits
    if (/^\d{11}$/.test(cleaned)) return 'CPF';

    // CNPJ: 14 digits
    if (/^\d{14}$/.test(cleaned)) return 'CNPJ';

    // Email
    if (EMAIL_REGEX.test(key)) return 'EMAIL';

    // Phone: starts with +55 or 10-13 digits
    if (key.startsWith('+55') || /^\d{10,13}$/.test(cleaned)) return 'PHONE';

    // EVP (UUID)
    if (UUID_REGEX.test(key)) return 'EVP';

    // Fallback
    return 'EVP';
  }

  /**
   * Constroi um BR Code EMV (Padrao BCB 1.0) a partir dos dados do recebedor.
   * Usado quando o sistema precisa oferecer "pix copia e cola" sem integracao
   * com PSP, por exemplo no portal do cliente.
   *
   * Gera um codigo ESTATICO (POI=11) ou DINAMICO (POI=12, com amount).
   */
  static buildEmv(input: {
    pixKey: string;
    merchantName: string;
    merchantCity: string;
    amount?: number;
    txId?: string;
    description?: string;
  }): string | null {
    const pixKey = input.pixKey?.trim();
    if (!pixKey) return null;

    const sanitize = (value: string, max: number): string =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s.-]/g, '')
        .trim()
        .slice(0, max)
        .toUpperCase();

    const merchantName = sanitize(input.merchantName ?? 'RECEBEDOR', 25);
    const merchantCity = sanitize(input.merchantCity ?? 'SAO PAULO', 15);
    const isDynamic = typeof input.amount === 'number' && input.amount > 0;

    // Merchant Account Information (tag 26)
    const maiParts = [PixCode.tlv('00', 'br.gov.bcb.pix'), PixCode.tlv('01', pixKey)];
    if (input.description) {
      const desc = sanitize(input.description, 25);
      if (desc) maiParts.push(PixCode.tlv('02', desc));
    }
    const mai = maiParts.join('');

    // Additional Data Field (tag 62)
    const txId = input.txId
      ? input.txId.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***'
      : '***';
    const adf = PixCode.tlv('05', txId);

    const parts: string[] = [];
    parts.push(PixCode.tlv('00', '01'));
    parts.push(PixCode.tlv('01', isDynamic ? '12' : '11'));
    parts.push(PixCode.tlv('26', mai));
    parts.push(PixCode.tlv('52', '0000'));
    parts.push(PixCode.tlv('53', '986'));
    if (isDynamic) {
      parts.push(PixCode.tlv('54', (input.amount as number).toFixed(2)));
    }
    parts.push(PixCode.tlv('58', 'BR'));
    parts.push(PixCode.tlv('59', merchantName));
    parts.push(PixCode.tlv('60', merchantCity));
    parts.push(PixCode.tlv('62', adf));

    const payloadWithoutCrc = parts.join('') + '6304';
    const crc = PixCode.crc16Ccitt(payloadWithoutCrc);
    return payloadWithoutCrc + crc;
  }

  private static tlv(tag: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return `${tag}${length}${value}`;
  }

  /**
   * Validates that the payload's last 4 hex chars (tag 63 value) match the
   * CRC16-CCITT of everything that precedes them — including the literal
   * "6304" tag+length marker, per BCB Pix spec §4.6.
   *
   * Returns true when:
   *   - the payload has at least 8 chars (`...6304XXXX`);
   *   - the trailer is exactly `6304` followed by 4 uppercase-hex chars;
   *   - the CRC computed over everything up to (and including) `6304`
   *     equals the trailer (case-insensitive compare).
   *
   * Anything else (missing tag 63, non-hex CRC, mismatched CRC) returns false
   * so `parseCopiaECola` can reject the payload.
   */
  private static verifyCrc(payload: string): boolean {
    if (payload.length < 8) return false;

    // The last 4 chars are the CRC value; the 4 chars before them must be
    // exactly "6304" (tag 63 + length 04).
    const crcValue = payload.slice(-4);
    const tagMarker = payload.slice(-8, -4);
    if (tagMarker !== '6304') return false;
    if (!/^[0-9A-Fa-f]{4}$/.test(crcValue)) return false;

    const covered = payload.slice(0, -4);
    const expected = PixCode.crc16Ccitt(covered);
    return crcValue.toUpperCase() === expected;
  }

  private static crc16Ccitt(data: string): string {
    let crc = 0xffff;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return crc.toString(16).padStart(4, '0').toUpperCase();
  }

  private static parseTLV(data: string): Map<string, string> | null {
    const result = new Map<string, string>();
    let pos = 0;

    try {
      while (pos < data.length) {
        if (pos + 4 > data.length) break;

        const tag = data.substring(pos, pos + 2);
        const length = parseInt(data.substring(pos + 2, pos + 4), 10);

        if (isNaN(length) || length < 0) return null;
        if (pos + 4 + length > data.length) break;

        const value = data.substring(pos + 4, pos + 4 + length);
        result.set(tag, value);

        pos += 4 + length;
      }
    } catch {
      return null;
    }

    return result.size > 0 ? result : null;
  }
}
