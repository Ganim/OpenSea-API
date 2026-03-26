import { randomUUID } from 'node:crypto';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import type {
  AccountantAccessesRepository,
  AccountantAccessRecord,
} from '@/repositories/finance/accountant-accesses-repository';

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

    // Generate unique access token
    const accessToken = `acc_${randomUUID().replace(/-/g, '')}`;

    // Calculate expiration
    let expiresAt: Date | undefined;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const access = await this.accountantAccessesRepository.create({
      tenantId,
      email,
      name,
      cpfCnpj,
      crc,
      accessToken,
      expiresAt,
    });

    const portalUrl = `/accountant/${accessToken}`;

    return { access, portalUrl };
  }
}
