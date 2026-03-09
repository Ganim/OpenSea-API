import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

export class Url {
  private readonly _value: string;

  private constructor(url: string) {
    if (url !== '' && !Url.isValid(url)) {
      throw new BadRequestError(`Invalid URL: ${url}`);
    }
    this._value = url;
  }

  public static create(url: string): Url {
    return new Url(url);
  }

  public static isValid(url: string): boolean {
    // Accept relative paths (e.g. /v1/storage/files/:id/serve)
    if (url.startsWith('/')) {
      return true;
    }
    try {
      new globalThis.URL(url);
      return true;
    } catch {
      return false;
    }
  }

  public static empty(): Url {
    return new Url('');
  }

  public get value(): string {
    return this._value;
  }

  public toString(): string {
    return this._value;
  }

  public equals(url: Url): boolean {
    return this._value === url.value;
  }

  private tryParseUrl(): globalThis.URL | null {
    if (!this._value || this._value.startsWith('/')) return null;
    try {
      return new globalThis.URL(this._value);
    } catch {
      return null;
    }
  }

  public get protocol(): string {
    return this.tryParseUrl()?.protocol ?? '';
  }

  public get host(): string {
    return this.tryParseUrl()?.host ?? '';
  }

  public get pathname(): string {
    if (this._value.startsWith('/')) return this._value.split('?')[0];
    return this.tryParseUrl()?.pathname ?? '';
  }

  public get search(): string {
    return this.tryParseUrl()?.search ?? '';
  }

  public get hash(): string {
    return this.tryParseUrl()?.hash ?? '';
  }
}
