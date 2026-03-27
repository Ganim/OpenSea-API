import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import type { AuthLinkStatus } from '@/entities/core/auth-link';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { AuthLinkDTO } from '@/mappers/core/auth-link/auth-link-to-dto';
import { authLinkToDTO } from '@/mappers/core/auth-link/auth-link-to-dto';
import type { AuthLinksRepository } from '@/repositories/core/auth-links-repository';

interface ToggleAuthLinkStatusUseCaseRequest {
  authLinkId: UniqueEntityID;
  userId: UniqueEntityID;
  newStatus: AuthLinkStatus;
  isAdmin?: boolean;
}

interface ToggleAuthLinkStatusUseCaseResponse {
  authLink: AuthLinkDTO;
}

export class ToggleAuthLinkStatusUseCase {
  constructor(private authLinksRepository: AuthLinksRepository) {}

  async execute({
    authLinkId,
    userId,
    newStatus,
    isAdmin = false,
  }: ToggleAuthLinkStatusUseCaseRequest): Promise<ToggleAuthLinkStatusUseCaseResponse> {
    // 1. Find authLink
    const authLink = await this.authLinksRepository.findById(authLinkId);

    if (!authLink) {
      throw new BadRequestError('Método de autenticação não encontrado.');
    }

    // 2. Verify ownership or admin
    if (!authLink.userId.equals(userId) && !isAdmin) {
      throw new ForbiddenError(
        'Você não tem permissão para alterar este método.',
      );
    }

    // 3. If deactivating, check it's not the last active method (unless admin)
    if (newStatus === 'INACTIVE' && !isAdmin) {
      const activeCount = await this.authLinksRepository.countActiveByUserId(
        authLink.userId,
      );

      if (activeCount <= 1) {
        throw new BadRequestError(
          'Não é possível desativar o último método de autenticação ativo.',
        );
      }
    }

    // 4. Update status
    const updated = await this.authLinksRepository.updateStatus(
      authLinkId,
      newStatus,
    );

    if (!updated) {
      throw new BadRequestError('Falha ao atualizar o método de autenticação.');
    }

    return { authLink: authLinkToDTO(updated) };
  }
}
