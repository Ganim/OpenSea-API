export type BinLabelingType = 'LETTERS' | 'NUMBERS';
export type BinDirectionType = 'BOTTOM_UP' | 'TOP_DOWN';

export interface CodePatternProps {
  separator: string;
  aisleDigits: number;
  shelfDigits: number;
  binLabeling: BinLabelingType;
  binDirection: BinDirectionType;
}

export class CodePattern {
  private readonly props: CodePatternProps;

  private constructor(props: CodePatternProps) {
    this.props = props;
  }

  get separator(): string {
    return this.props.separator;
  }

  get aisleDigits(): number {
    return this.props.aisleDigits;
  }

  get shelfDigits(): number {
    return this.props.shelfDigits;
  }

  get binLabeling(): BinLabelingType {
    return this.props.binLabeling;
  }

  get binDirection(): BinDirectionType {
    return this.props.binDirection;
  }

  get usesLetters(): boolean {
    return this.binLabeling === 'LETTERS';
  }

  get usesNumbers(): boolean {
    return this.binLabeling === 'NUMBERS';
  }

  get isBottomUp(): boolean {
    return this.binDirection === 'BOTTOM_UP';
  }

  get isTopDown(): boolean {
    return this.binDirection === 'TOP_DOWN';
  }

  formatAisle(aisle: number): string {
    return aisle.toString().padStart(this.aisleDigits, '0');
  }

  formatShelf(shelf: number): string {
    return shelf.toString().padStart(this.shelfDigits, '0');
  }

  formatPosition(positionIndex: number, totalPositions: number): string {
    const adjustedIndex = this.isBottomUp
      ? positionIndex
      : totalPositions - 1 - positionIndex;

    if (this.usesLetters) {
      return String.fromCharCode(65 + adjustedIndex); // A, B, C, ...
    }
    return (adjustedIndex + 1).toString();
  }

  generateAddress(
    warehouseCode: string,
    zoneCode: string,
    aisle: number,
    shelf: number,
    positionIndex: number,
    totalPositions: number,
  ): string {
    const parts = [
      warehouseCode,
      zoneCode,
      `${this.formatAisle(aisle)}${this.formatShelf(shelf)}`,
      this.formatPosition(positionIndex, totalPositions),
    ];
    return parts.join(this.separator);
  }

  toJSON(): CodePatternProps {
    return { ...this.props };
  }

  equals(other: CodePattern): boolean {
    return (
      this.separator === other.separator &&
      this.aisleDigits === other.aisleDigits &&
      this.shelfDigits === other.shelfDigits &&
      this.binLabeling === other.binLabeling &&
      this.binDirection === other.binDirection
    );
  }

  static create(props: Partial<CodePatternProps> = {}): CodePattern {
    return new CodePattern({
      separator: props.separator ?? '-',
      aisleDigits: props.aisleDigits ?? 1,
      shelfDigits: props.shelfDigits ?? 2,
      binLabeling: props.binLabeling ?? 'LETTERS',
      binDirection: props.binDirection ?? 'BOTTOM_UP',
    });
  }

  static fromJSON(json: CodePatternProps): CodePattern {
    return new CodePattern(json);
  }

  static default(): CodePattern {
    return CodePattern.create();
  }
}
