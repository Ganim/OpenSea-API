import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  HASH_ROUNDS,
  PASSWORD_PATTERN,
  PASSWORD_VALIDATION_MESSAGES,
} from '@/config/auth';
import { compare as bcryptCompare, hash as bcryptHash } from 'bcryptjs';

export interface PasswordStrengthOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
  regex?: RegExp;
}

export interface PasswordStrengthResult {
  valid: boolean;
  errors: string[];
}

export class Password {
  private static readonly DEFAULT_ROUNDS = HASH_ROUNDS ?? 6;
  private _value!: string;

  private constructor(hash: string) {
    this._value = hash;
  }

  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  static async hash(
    password: string,
    rounds: number = Password.DEFAULT_ROUNDS,
  ): Promise<string> {
    return bcryptHash(password, rounds);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return bcryptCompare(password, hash);
  }

  /**
   * Valida a força da senha com base nos requisitos configurados.
   * Retorna mensagens de erro traduzidas para o português.
   */
  static isStrong(
    password: string,
    options?: PasswordStrengthOptions,
  ): PasswordStrengthResult {
    const errors: string[] = [];
    const minLength = options?.minLength ?? 6;

    if (password.length < minLength) {
      errors.push(PASSWORD_VALIDATION_MESSAGES.minLength(minLength));
    }
    if (options?.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push(PASSWORD_VALIDATION_MESSAGES.requireUppercase);
    }
    if (options?.requireLowercase && !/[a-z]/.test(password)) {
      errors.push(PASSWORD_VALIDATION_MESSAGES.requireLowercase);
    }
    if (options?.requireNumber && !/[0-9]/.test(password)) {
      errors.push(PASSWORD_VALIDATION_MESSAGES.requireNumber);
    }
    if (options?.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push(PASSWORD_VALIDATION_MESSAGES.requireSpecial);
    }
    if (options?.regex && !options.regex.test(password)) {
      errors.push('A senha não corresponde ao padrão requerido.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Cria uma nova senha hasheada após validar os requisitos de força.
   * @throws BadRequestError se a senha não atender aos requisitos
   */
  static async create(password: string): Promise<Password> {
    const passwordStrength = Password.isStrong(password, PASSWORD_PATTERN);

    if (!passwordStrength.valid) {
      // Retorna a primeira mensagem de erro para o usuário
      throw new BadRequestError(
        passwordStrength.errors[0] || PASSWORD_VALIDATION_MESSAGES.notStrong,
      );
    }

    const passwordHash = await Password.hash(password);
    return Password.fromHash(passwordHash);
  }

  /**
   * Retorna os requisitos de senha atuais (útil para exibir no frontend)
   */
  static getRequirements(): PasswordStrengthOptions {
    return { ...PASSWORD_PATTERN };
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  equals(other: Password): boolean {
    return this._value === other.value;
  }
}
