import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';

interface VerifySecurityKeyUseCaseRequest {
  tenantId: string;
  userId: string;
  key: string;
}

interface VerifySecurityKeyUseCaseResponse {
  valid: boolean;
}

export class VerifySecurityKeyUseCase {
  async execute(
    request: VerifySecurityKeyUseCaseRequest,
  ): Promise<VerifySecurityKeyUseCaseResponse> {
    const { tenantId, userId, key } = request;

    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        tenantId,
        userId,
        deletedAt: null,
      },
    });

    if (!tenantUser?.securityKeyHash) {
      return { valid: false };
    }

    const valid = await compare(key, tenantUser.securityKeyHash);
    return { valid };
  }
}
