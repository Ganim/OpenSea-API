import QRCode from 'qrcode';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const textEncoder = new TextEncoder();

export type BarcodeFormat =
  | 'UPC_A'
  | 'UPC_E'
  | 'EAN13'
  | 'EAN8'
  | 'CODE39'
  | 'ITF'
  | 'CODABAR'
  | 'CODE93'
  | 'CODE128';

export interface ESCPOSGeneratorConfig {
  paperWidth?: 80 | 58;
  characterPerLine?: number;
}

export class ESCPOSGenerator {
  private commands: Uint8Array[] = [];
  private readonly characterPerLine: number;

  constructor(config: ESCPOSGeneratorConfig = {}) {
    this.characterPerLine =
      config.characterPerLine ?? (config.paperWidth === 58 ? 32 : 42);
  }

  init(): this {
    this.commands.push(Uint8Array.from([ESC, 0x40]));
    return this;
  }

  cutPaper(partial = false): this {
    this.commands.push(Uint8Array.from([GS, 0x56, partial ? 1 : 0]));
    return this;
  }

  bold(text: string): this {
    this.commands.push(Uint8Array.from([ESC, 0x45, 1]));
    this.writeWrapped(text, 'left');
    this.commands.push(Uint8Array.from([ESC, 0x45, 0]));
    return this;
  }

  underline(text: string, enabled = true): this {
    this.commands.push(Uint8Array.from([ESC, 0x2d, enabled ? 1 : 0]));
    this.writeWrapped(text, 'left');
    this.commands.push(Uint8Array.from([ESC, 0x2d, 0]));
    return this;
  }

  bold_underline(text: string): this {
    this.commands.push(Uint8Array.from([ESC, 0x45, 1]));
    this.commands.push(Uint8Array.from([ESC, 0x2d, 1]));
    this.writeWrapped(text, 'left');
    this.commands.push(Uint8Array.from([ESC, 0x2d, 0]));
    this.commands.push(Uint8Array.from([ESC, 0x45, 0]));
    return this;
  }

  center(text: string): this {
    this.setAlign('center');
    this.writeWrapped(text, 'center');
    this.setAlign('left');
    return this;
  }

  left(text: string): this {
    this.setAlign('left');
    this.writeWrapped(text, 'left');
    return this;
  }

  right(text: string): this {
    this.setAlign('right');
    this.writeWrapped(text, 'right');
    this.setAlign('left');
    return this;
  }

  newLine(count = 1): this {
    for (let index = 0; index < count; index++) {
      this.commands.push(Uint8Array.from([LF]));
    }
    return this;
  }

  setFontSize(width: number, height: number): this {
    const safeWidth = Math.max(1, Math.min(8, width));
    const safeHeight = Math.max(1, Math.min(8, height));
    const size = ((safeWidth - 1) << 4) | (safeHeight - 1);

    this.commands.push(Uint8Array.from([GS, 0x21, size]));
    return this;
  }

  qrCode(data: string, size = 6): this {
    // Use qrcode package to validate payload before sending native ESC/POS commands.
    QRCode.create(data);

    const qrSize = Math.max(1, Math.min(16, size));
    const payload = textEncoder.encode(data);
    const dataLength = payload.length + 3;
    const pL = dataLength % 256;
    const pH = Math.floor(dataLength / 256);

    this.commands.push(Uint8Array.from([GS, 0x28, 0x6b, 4, 0, 49, 65, 50, 0]));
    this.commands.push(Uint8Array.from([GS, 0x28, 0x6b, 3, 0, 49, 67, qrSize]));
    this.commands.push(Uint8Array.from([GS, 0x28, 0x6b, 3, 0, 49, 69, 48]));
    this.commands.push(Uint8Array.from([GS, 0x28, 0x6b, pL, pH, 49, 80, 48]));
    this.commands.push(payload);
    this.commands.push(Uint8Array.from([GS, 0x28, 0x6b, 3, 0, 49, 81, 48]));

    return this;
  }

  barCode(data: string, format: BarcodeFormat = 'CODE128'): this {
    const formatMap: Record<BarcodeFormat, number> = {
      UPC_A: 65,
      UPC_E: 66,
      EAN13: 67,
      EAN8: 68,
      CODE39: 69,
      ITF: 70,
      CODABAR: 71,
      CODE93: 72,
      CODE128: 73,
    };

    const barcodeData = textEncoder.encode(data);
    const m = formatMap[format];

    this.commands.push(Uint8Array.from([GS, 0x48, 2]));
    this.commands.push(Uint8Array.from([GS, 0x77, 2]));
    this.commands.push(Uint8Array.from([GS, 0x68, 100]));
    this.commands.push(Uint8Array.from([GS, 0x6b, m, barcodeData.length]));
    this.commands.push(barcodeData);
    this.newLine();

    return this;
  }

  toBytes(): Uint8Array {
    const totalLength = this.commands.reduce(
      (accumulator, chunk) => accumulator + chunk.length,
      0,
    );

    const output = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of this.commands) {
      output.set(chunk, offset);
      offset += chunk.length;
    }

    return output;
  }

  toBase64(): string {
    return Buffer.from(this.toBytes()).toString('base64');
  }

  toHex(): string {
    return Buffer.from(this.toBytes()).toString('hex');
  }

  private setAlign(align: 'left' | 'center' | 'right') {
    const n = align === 'center' ? 1 : align === 'right' ? 2 : 0;
    this.commands.push(Uint8Array.from([ESC, 0x61, n]));
  }

  private writeWrapped(text: string, align: 'left' | 'center' | 'right') {
    const lines = this.wrapText(text, this.characterPerLine);

    for (const line of lines) {
      const formatted = this.applyAlignment(line, align, this.characterPerLine);
      this.commands.push(textEncoder.encode(formatted));
      this.commands.push(Uint8Array.from([LF]));
    }
  }

  private wrapText(input: string, limit: number): string[] {
    const text = input.replace(/\r\n/g, '\n');
    const paragraphs = text.split('\n');
    const lines: string[] = [];

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        lines.push('');
        continue;
      }

      const words = paragraph.split(/\s+/).filter(Boolean);
      let currentLine = '';

      for (const word of words) {
        if (word.length > limit) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = '';
          }

          let cursor = 0;
          while (cursor < word.length) {
            lines.push(word.slice(cursor, cursor + limit));
            cursor += limit;
          }
          continue;
        }

        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (candidate.length <= limit) {
          currentLine = candidate;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines.length > 0 ? lines : [''];
  }

  private applyAlignment(
    line: string,
    align: 'left' | 'center' | 'right',
    width: number,
  ): string {
    if (line.length >= width) {
      return line;
    }

    const padding = width - line.length;

    if (align === 'right') {
      return `${' '.repeat(padding)}${line}`;
    }

    if (align === 'center') {
      const leftPadding = Math.floor(padding / 2);
      const rightPadding = padding - leftPadding;
      return `${' '.repeat(leftPadding)}${line}${' '.repeat(rightPadding)}`;
    }

    return line;
  }
}
