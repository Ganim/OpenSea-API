import type { AuthLinksRepository } from '@/repositories/core/auth-links-repository';
import type { MagicLinkTokensRepository } from '@/repositories/core/magic-link-tokens-repository';
import type { UsersRepository } from '@/repositories/core/users-repository';
import { EmailService } from '@/services/email-service';
import crypto from 'crypto';
import {
  detectIdentifierType,
  normalizeIdentifier,
} from './utils/detect-identifier-type';

interface RequestMagicLinkUseCaseRequest {
  identifier: string;
}

interface RequestMagicLinkUseCaseResponse {
  message: string;
}

const GENERIC_SUCCESS_MESSAGE =
  'Se o identificador estiver cadastrado, um email foi enviado.';

const MAGIC_LINK_EXPIRY_MINUTES = 15;

export class RequestMagicLinkUseCase {
  constructor(
    private authLinksRepository: AuthLinksRepository,
    private usersRepository: UsersRepository,
    private magicLinkTokensRepository: MagicLinkTokensRepository,
    private emailService: EmailService,
  ) {}

  async execute({
    identifier,
  }: RequestMagicLinkUseCaseRequest): Promise<RequestMagicLinkUseCaseResponse> {
    const provider = detectIdentifierType(identifier);
    const normalized = normalizeIdentifier(provider, identifier);

    // Find auth link — if not found, return generic success (don't reveal if exists)
    const authLink = await this.authLinksRepository.findByProviderAndIdentifier(
      provider,
      normalized,
    );

    if (!authLink) {
      return { message: GENERIC_SUCCESS_MESSAGE };
    }

    // Find user
    const user = await this.usersRepository.findById(authLink.userId);

    if (!user || user.deletedAt) {
      return { message: GENERIC_SUCCESS_MESSAGE };
    }

    // Find the user's email address
    // If the identifier is already an email, use it
    // Otherwise, look for an EMAIL auth link for this user
    let email: string | null = null;

    if (provider === 'EMAIL') {
      email = normalized;
    } else {
      const emailAuthLink =
        await this.authLinksRepository.findByUserIdAndProvider(
          user.id,
          'EMAIL',
        );

      if (emailAuthLink) {
        email = emailAuthLink.identifier;
      } else if (user.email) {
        email = user.email.value;
      }
    }

    if (!email) {
      return { message: GENERIC_SUCCESS_MESSAGE };
    }

    // Generate raw token and hash it for storage
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(
      Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000,
    );

    // Store the hashed token
    await this.magicLinkTokensRepository.create({
      userId: user.id,
      token: hashedToken,
      email,
      expiresAt,
    });

    // Send the raw token via email
    await this.emailService.sendMagicLinkEmail(
      email,
      rawToken,
      MAGIC_LINK_EXPIRY_MINUTES,
    );

    return { message: GENERIC_SUCCESS_MESSAGE };
  }
}
