import { randomBytes } from 'node:crypto';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import type {
  AccountantAccessesRepository,
  AccountantAccessRecord,
} from '@/repositories/finance/accountant-accesses-repository';
import { hashToken } from '@/utils/security/hash-token';

interface InviteAccountantRequest {
  tenantId: string;
  email: string;
  name: string;
  cpfCnpj?: string;
  crc?: string;
  expiresInDays?: number;
}

interface InviteAccountantResponse {
  access: AccountantAccessRecord;
  /** Raw plaintext token — displayed once to the user, never stored. */
  rawToken: string;
  portalUrl: string;
}

export class InviteAccountantUseCase {
  constructor(
    private accountantAccessesRepository: AccountantAccessesRepository,
  ) {}

  async execute(
    request: InviteAccountantRequest,
  ): Promise<InviteAccountantResponse> {
    const { tenantId, email, name, cpfCnpj, crc, expiresInDays } = request;

    // Check if already invited
    const existing = await this.accountantAccessesRepository.findByEmail(
      tenantId,
      email,
    );

    if (existing && existing.isActive) {
      throw new ConflictError(
        'Este e-mail já possui um acesso ativo ao portal do contador.',
      );
    }

    // Generate cryptographically secure token
    const rawToken = `acc_${randomBytes(32).toString('hex')}`;
    // Store only the SHA-256 hash in the database (hard cutover)
    const hashedToken = hashToken(rawToken);

    // Calculate expiration (default: 90 days)
    const defaultExpirationDays = 90;
    const days = expiresInDays ?? defaultExpirationDays;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const access = await this.accountantAccessesRepository.create({
      tenantId,
      email,
      name,
      cpfCnpj,
      crc,
      accessToken: hashedToken,
      expiresAt,
    });

    const portalUrl = `/accountant/${rawToken}`;

    return { access, rawToken, portalUrl };
  }
}
