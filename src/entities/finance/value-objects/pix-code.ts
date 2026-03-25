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
