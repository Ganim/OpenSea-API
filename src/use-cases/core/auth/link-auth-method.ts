import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import type { AuthLinkProvider } from '@/entities/core/auth-link';
import { Password } from '@/entities/core/value-objects/password';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { AuthLinkDTO } from '@/mappers/core/auth-link/auth-link-to-dto';
import { authLinkToDTO } from '@/mappers/core/auth-link/auth-link-to-dto';
import type { AuthLinksRepository } from '@/repositories/core/auth-links-repository';
import type { UsersRepository } from '@/repositories/core/users-repository';
import { normalizeIdentifier } from './utils/detect-identifier-type';

interface LinkAuthMethodUseCaseRequest {
  userId: UniqueEntityID;
  provider: AuthLinkProvider;
  identifier: string;
  currentPassword: string;
  tenantId?: UniqueEntityID | null;
}

interface LinkAuthMethodUseCaseResponse {
  authLink: AuthLinkDTO;
}

export class LinkAuthMethodUseCase {
  constructor(
    private authLinksRepository: AuthLinksRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    userId,
    provider,
    identifier,
    currentPassword,
    tenantId,
  }: LinkAuthMethodUseCaseRequest): Promise<LinkAuthMethodUseCaseResponse> {
    // 1. Find user and validate existence
    const user = await this.usersRepository.findById(userId);

    if (!user || user.deletedAt) {
      throw new BadRequestError('Usuário não encontrado.');
    }

    // 2. Verify current password
    const doesPasswordMatch = await Password.compare(
      currentPassword,
      user.password.toString(),
    );

    if (!doesPasswordMatch) {
      throw new BadRequestError('Senha atual incorreta.');
    }

    // 3. Normalize identifier
    const normalizedIdentifier = normalizeIdentifier(provider, identifier);

    // 4. Check if identifier already linked to another user
    const existingLink =
      await this.authLinksRepository.findByProviderAndIdentifier(
        provider,
        normalizedIdentifier,
      );

    if (existingLink && !existingLink.userId.equals(userId)) {
      throw new ConflictError(
        'Este identificador já está vinculado a outra conta.',
      );
    }

    // 5. Check if user already has this provider
    const userProviderLink =
      await this.authLinksRepository.findByUserIdAndProvider(userId, provider);

    if (userProviderLink) {
      throw new ConflictError(
        'Você já possui um vínculo com este método.',
      );
    }

    // 6. Determine credential
    const credentialProviders: AuthLinkProvider[] = [
      'EMAIL',
      'CPF',
      'ENROLLMENT',
    ];
    const credential = credentialProviders.includes(provider)
      ? user.password.toString()
      : null;

    // 7. Create AuthLink
    const authLink = await this.authLinksRepository.create({
      userId,
      tenantId: tenantId ?? null,
      provider,
      identifier: normalizedIdentifier,
      credential,
    });

    return { authLink: authLinkToDTO(authLink) };
  }
}
