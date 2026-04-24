import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { Email } from '@/entities/core/value-objects/email';
import { Token } from '@/entities/core/value-objects/token';
import { isValidRotatingCode } from '@/lib/rotating-code';
import type { UsersRepository } from '@/repositories/core/users-repository';
import { randomBytes } from 'node:crypto';

interface InitiatePasswordResetByTotpRequest {
  email: string;
  totpCode: string;
}

interface InitiatePasswordResetByTotpResponse {
  resetToken: string;
  expiresAt: Date;
}

const RESET_TOKEN_TTL_MINUTES = 5;

/**
 * Caminho alternativo ao fluxo normal de "esqueci minha senha": em vez
 * de receber um código por email, o usuário digita um código TOTP que
 * o admin passou (por telefone/presencialmente). Se o código for válido,
 * emitimos o mesmo `passwordResetToken` que o fluxo por email gera —
 * assim o passo final (`reset-password-by-token`) é idêntico.
 *
 * **Resposta genérica em caso de falha** para evitar enumeração de
 * emails.
 */
export class InitiatePasswordResetByTotpUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({
    email,
    totpCode,
  }: InitiatePasswordResetByTotpRequest): Promise<InitiatePasswordResetByTotpResponse> {
    const emailVO = Email.create(email);
    const user = await this.usersRepository.findByEmail(emailVO);

    // Mensagem genérica: não distingue "user inexistente" de "TOTP
    // inválido" para não vazar se um email está cadastrado.
    const generic = new UnauthorizedError('Email ou token inválido');

    if (!user || user.deletedAt) {
      throw generic;
    }

    if (!user.totpSecret) {
      throw generic;
    }

    const normalized = totpCode.trim().toUpperCase();
    if (!isValidRotatingCode(user.totpSecret, normalized)) {
      throw generic;
    }

    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000,
    );

    const tokenVO = Token.create(resetToken);
    await this.usersRepository.updatePasswordReset(user.id, tokenVO, expiresAt);

    return { resetToken, expiresAt };
  }
}
