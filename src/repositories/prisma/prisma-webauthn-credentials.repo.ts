/**
 * PrismaWebAuthnCredentialsRepository — Prisma-backed implementation.
 *
 * Plan 10-07 (D-G1): WebAuthn credential persistence using WebAuthnCredential
 * Prisma model introduced in Plan 10-01.
 *
 * credentialId is stored as Bytes (Buffer) in Postgres.
 * findByCredentialIdBase64: decodes base64url → Buffer → Bytes equality lookup.
 *
 * LGPD: publicKey stored as opaque Bytes; never returned in API responses.
 */
import { prisma } from '@/lib/prisma';
import type {
  WebAuthnCredential,
  WebAuthnCredentialsRepository,
  CreateWebAuthnCredentialInput,
} from '../webauthn-credentials.repo';

function mapToEntity(row: {
  id: string;
  tenantId: string;
  employeeId: string;
  credentialId: Buffer;
  publicKey: Buffer;
  counter: bigint;
  transports: string[];
  deviceType: string;
  backedUp: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): WebAuthnCredential {
  return {
    id: row.id,
    tenantId: row.tenantId,
    employeeId: row.employeeId,
    credentialId: row.credentialId,
    publicKey: row.publicKey,
    counter: row.counter,
    transports: row.transports,
    deviceType: row.deviceType,
    backedUp: row.backedUp,
    lastUsedAt: row.lastUsedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaWebAuthnCredentialsRepository implements WebAuthnCredentialsRepository {
  async create(
    input: CreateWebAuthnCredentialInput,
  ): Promise<WebAuthnCredential> {
    const row = await prisma.webAuthnCredential.create({
      data: {
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        credentialId: input.credentialId,
        publicKey: input.publicKey,
        counter: input.counter,
        transports: input.transports,
        deviceType: input.deviceType,
        backedUp: input.backedUp,
      },
    });
    return mapToEntity(row);
  }

  async findByEmployee(employeeId: string): Promise<WebAuthnCredential[]> {
    const rows = await prisma.webAuthnCredential.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapToEntity);
  }

  async findByCredentialId(
    credentialId: Buffer,
  ): Promise<WebAuthnCredential | null> {
    const row = await prisma.webAuthnCredential.findUnique({
      where: { credentialId },
    });
    return row ? mapToEntity(row) : null;
  }

  async findByCredentialIdBase64(
    credentialIdBase64: string,
  ): Promise<WebAuthnCredential | null> {
    // credentialId arrives as base64url from @simplewebauthn — decode to Buffer
    const credentialId = Buffer.from(credentialIdBase64, 'base64url');
    return this.findByCredentialId(credentialId);
  }

  async updateCounter(id: string, newCounter: bigint): Promise<void> {
    await prisma.webAuthnCredential.update({
      where: { id },
      data: { counter: newCounter },
    });
  }

  async updateLastUsedAt(id: string, lastUsedAt: Date): Promise<void> {
    await prisma.webAuthnCredential.update({
      where: { id },
      data: { lastUsedAt },
    });
  }
}
