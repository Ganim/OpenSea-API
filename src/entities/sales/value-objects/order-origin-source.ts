export type OrderOriginSourceValue = 'WEB' | 'POS_DESKTOP' | 'API' | 'MOBILE';

export class OrderOriginSource {
  private readonly _value: OrderOriginSourceValue;

  private constructor(value: OrderOriginSourceValue) {
    this._value = value;
  }

  static create(value: string): OrderOriginSource {
    const normalized = value.toUpperCase() as OrderOriginSourceValue;

    const validSources: OrderOriginSourceValue[] = [
      'WEB',
      'POS_DESKTOP',
      'API',
      'MOBILE',
    ];

    if (!validSources.includes(normalized)) {
      throw new Error(`Invalid OrderOriginSource: ${value}`);
    }

    return new OrderOriginSource(normalized);
  }

  static WEB(): OrderOriginSource {
    return new OrderOriginSource('WEB');
  }

  static POS_DESKTOP(): OrderOriginSource {
    return new OrderOriginSource('POS_DESKTOP');
  }

  static API(): OrderOriginSource {
    return new OrderOriginSource('API');
  }

  static MOBILE(): OrderOriginSource {
    return new OrderOriginSource('MOBILE');
  }

  get value(): OrderOriginSourceValue {
    return this._value;
  }

  get isWeb(): boolean {
    return this._value === 'WEB';
  }

  get isPosDesktop(): boolean {
    return this._value === 'POS_DESKTOP';
  }

  get isApi(): boolean {
    return this._value === 'API';
  }

  get isMobile(): boolean {
    return this._value === 'MOBILE';
  }

  toString(): string {
    return this._value;
  }

  equals(other: OrderOriginSource): boolean {
    return this._value === other._value;
  }
}
