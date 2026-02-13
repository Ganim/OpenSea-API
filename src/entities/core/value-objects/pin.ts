import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { HASH_ROUNDS } from '@/config/auth';
import { compare as bcryptCompare, hash as bcryptHash } from 'bcryptjs';

export type PinType = 'access' | 'action';

const PIN_LENGTHS: Record<PinType, number> = {
  access: 6,
  action: 4,
};

const PIN_MESSAGES: Record<PinType, string> = {
  access:
    'O PIN de acesso deve conter exatamente 6 d\u00edgitos num\u00e9ricos.',
  action:
    'O PIN de a\u00e7\u00e3o deve conter exatamente 4 d\u00edgitos num\u00e9ricos.',
};

export class Pin {
  private static readonly DEFAULT_ROUNDS = HASH_ROUNDS ?? 6;
  private _value!: string;
  private _type!: PinType;

  private constructor(hash: string, type: PinType) {
    this._value = hash;
    this._type = type;
  }

  static isValid(pin: string, type: PinType): boolean {
    const length = PIN_LENGTHS[type];
    const regex = new RegExp(`^\\d{${length}}$`);
    return regex.test(pin);
  }

  static fromHash(hash: string, type: PinType): Pin {
    return new Pin(hash, type);
  }

  static async compare(plainText: string, hash: string): Promise<boolean> {
    return bcryptCompare(plainText, hash);
  }

  static async create(plainText: string, type: PinType): Promise<Pin> {
    if (!Pin.isValid(plainText, type)) {
      throw new BadRequestError(PIN_MESSAGES[type]);
    }

    const hash = await bcryptHash(plainText, Pin.DEFAULT_ROUNDS);
    return new Pin(hash, type);
  }

  get value(): string {
    return this._value;
  }

  get type(): PinType {
    return this._type;
  }

  toString(): string {
    return this._value;
  }

  equals(other: Pin): boolean {
    return this._value === other.value;
  }
}
