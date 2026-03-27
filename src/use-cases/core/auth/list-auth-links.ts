import type { AuthLinkDTO } from '@/mappers/core/auth-link/auth-link-to-dto';
import { authLinkToDTO } from '@/mappers/core/auth-link/auth-link-to-dto';
import type { AuthLinksRepository } from '@/repositories/core/auth-links-repository';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface ListAuthLinksUseCaseRequest {
  userId: UniqueEntityID;
}

interface ListAuthLinksUseCaseResponse {
  authLinks: AuthLinkDTO[];
}

export class ListAuthLinksUseCase {
  constructor(private authLinksRepository: AuthLinksRepository) {}

  async execute({
    userId,
  }: ListAuthLinksUseCaseRequest): Promise<ListAuthLinksUseCaseResponse> {
    const authLinks = await this.authLinksRepository.findByUserId(userId);

    return { authLinks: authLinks.map(authLinkToDTO) };
  }
}
