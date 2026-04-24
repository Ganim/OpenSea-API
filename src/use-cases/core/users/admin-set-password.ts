import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Password } from '@/entities/core/value-objects/password';
import { UserDTO, userToDTO } from '@/mappers/core/user/user-to-dto';
import { AuthLinksRepository } from '@/repositories/core/auth-links-repository';
import type { SessionsRepository } from '@/repositories/core/sessions-repository';
import type { UsersRepository } from '@/repositories/core/users-repository';

interface AdminSetPasswordRequest {
  targetUserId: string;
  requestedByUserId: string;
  newPassword: string;
  forceChangeOnNextLogin: boolean;
}

interface AdminSetPasswordResponse {
  user: UserDTO;
  revokedSessionsCount: number;
}

export class AdminSetPasswordUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authLinksRepository: AuthLinksRepository,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async execute({
    targetUserId,
    requestedByUserId,
    newPassword,
    forceChangeOnNextLogin,
  }: AdminSetPasswordRequest): Promise<AdminSetPasswordResponse> {
    const targetId = new UniqueEntityID(targetUserId);
    const requestedById = new UniqueEntityID(requestedByUserId);

    const targetUser = await this.usersRepository.findById(targetId);
    if (!targetUser || targetUser.deletedAt) {
      throw new ResourceNotFoundError('Usuário não encontrado');
    }

    const requester = await this.usersRepository.findById(requestedById);
    if (!requester) {
      throw new BadRequestError('Requester inválido');
    }

    // Super-admin protection: um admin não-super-admin não pode sobrescrever
    // a senha de um super-admin.
    if (targetUser.isSuperAdmin && !requester.isSuperAdmin) {
      throw new ForbiddenError(
        'Apenas super administradores podem alterar a senha de outros super administradores',
      );
    }

    const hashedPassword = await Password.create(newPassword);

    const updatedUser = await this.usersRepository.update({
      id: targetId,
      passwordHash: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    if (!updatedUser) {
      throw new BadRequestError(
        'Não foi possível atualizar a senha do usuário',
      );
    }

    // Mantém o auth link do provider EMAIL em sincronia com o novo hash —
    // mesmo fluxo que ResetPasswordByTokenUseCase usa.
    await this.authLinksRepository.updateCredentialByUserId(
      targetId,
      hashedPassword.toString(),
    );

    if (forceChangeOnNextLogin) {
      await this.usersRepository.setForcePasswordReset(
        targetId,
        requestedById,
        'Senha redefinida pelo administrador',
      );
    } else if (targetUser.forcePasswordReset) {
      // Se o admin definiu uma senha diretamente e NÃO quer forçar troca,
      // limpamos qualquer flag prévia de forcePasswordReset.
      await this.usersRepository.clearForcePasswordReset(targetId);
    }

    // Revoga sessões ativas do usuário para forçar re-login com a nova senha.
    const revokedSessionsCount =
      await this.sessionsRepository.revokeAllForUser(targetId);

    const refreshed =
      (await this.usersRepository.findById(targetId)) ?? updatedUser;

    return {
      user: userToDTO(refreshed),
      revokedSessionsCount,
    };
  }
}
