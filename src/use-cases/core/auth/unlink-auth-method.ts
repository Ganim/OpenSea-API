import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { AuthLinkDTO } from '@/mappers/core/auth-link/auth-link-to-dto';
import { authLinkToDTO } from '@/mappers/core/auth-link/auth-link-to-dto';
import type { AuthLinksRepository } from '@/repositories/core/auth-links-repository';

interface UnlinkAuthMethodUseCaseRequest {
  authLinkId: UniqueEntityID;
  userId: UniqueEntityID;
  isAdmin?: boolean;
}

interface UnlinkAuthMethodUseCaseResponse {
  authLink: AuthLinkDTO;
}

export class UnlinkAuthMethodUseCase {
  constructor(private authLinksRepository: AuthLinksRepository) {}

  async execute({
    authLinkId,
    userId,
    isAdmin = false,
  }: UnlinkAuthMethodUseCaseRequest): Promise<UnlinkAuthMethodUseCaseResponse> {
    // 1. Find authLink
    const authLink = await this.authLinksRepository.findById(authLinkId);

    if (!authLink) {
      throw new BadRequestError('Método de autenticação não encontrado.');
    }

    // 2. Verify ownership or admin
    if (!authLink.userId.equals(userId) && !isAdmin) {
      throw new ForbiddenError(
        'Você não tem permissão para remover este método.',
      );
    }

    // 3. If not admin, check it's not the last active method
    if (!isAdmin) {
      const activeCount = await this.authLinksRepository.countActiveByUserId(
        authLink.userId,
      );

      if (activeCount <= 1) {
        throw new BadRequestError(
          'Não é possível remover o último método de autenticação ativo.',
        );
      }
    }

    // 4. Soft delete
    const unlinked = await this.authLinksRepository.softDelete(authLinkId);

    if (!unlinked) {
      throw new BadRequestError('Falha ao remover o método de autenticação.');
    }

    return { authLink: authLinkToDTO(unlinked) };
  }
}
