import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { getCurrentRotatingCode } from '@/lib/rotating-code';
import type { UsersRepository } from '@/repositories/core/users-repository';

interface RevealUserTotpRequest {
  targetUserId: string;
  requestedByUserId: string;
}

interface RevealUserTotpResponse {
  code: string;
  expiresAt: Date;
  periodSeconds: number;
}

/**
 * Revela o código TOTP rotativo atual de um usuário, para que o admin
 * possa passá-lo por telefone/presencial ao usuário que esqueceu a
 * senha. O código é derivado do `totpSecret` estável do usuário e muda
 * a cada 60s (tolerância de 1 bucket anterior na validação, janela
 * efetiva de ~120s).
 *
 * O requester deve ter a permissão `admin.users.security.revealAdminToken`.
 * Requester não-super-admin não pode revelar token de super-admin.
 */
export class RevealUserTotpUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({
    targetUserId,
    requestedByUserId,
  }: RevealUserTotpRequest): Promise<RevealUserTotpResponse> {
    const targetId = new UniqueEntityID(targetUserId);
    const requestedById = new UniqueEntityID(requestedByUserId);

    const targetUser = await this.usersRepository.findById(targetId);
    if (!targetUser || targetUser.deletedAt) {
      throw new ResourceNotFoundError('Usuário não encontrado');
    }

    const requester = await this.usersRepository.findById(requestedById);
    if (!requester) {
      throw new ResourceNotFoundError('Requester inválido');
    }

    if (targetUser.isSuperAdmin && !requester.isSuperAdmin) {
      throw new ForbiddenError(
        'Apenas super administradores podem revelar o token de outros super administradores',
      );
    }

    if (!targetUser.totpSecret) {
      // Defesa contra usuários legados — embora a migration faça backfill,
      // proteção extra não custa.
      throw new ResourceNotFoundError(
        'Usuário não possui secret de reset administrativo',
      );
    }

    return getCurrentRotatingCode(targetUser.totpSecret);
  }
}
