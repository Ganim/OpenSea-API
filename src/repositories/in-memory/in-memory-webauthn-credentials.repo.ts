/**
 * InMemoryWebAuthnCredentialsRepository — in-memory implementation for unit tests.
 *
 * Plan 10-07: Used by WebAuthn use case specs to avoid database dependency.
 * Mirrors PrismaWebAuthnCredentialsRepository behaviour exactly.
 */
import { randomUUID } from 'node:crypto';
import type {
  WebAuthnCredential,
  WebAuthnCredentialsRepository,
  CreateWebAuthnCredentialInput,
} from '../webauthn-credentials.repo';

export class InMemoryWebAuthnCredentialsRepository implements WebAuthnCredentialsRepository {
  public items: WebAuthnCredential[] = [];

  async create(
    input: CreateWebAuthnCredentialInput,
  ): Promise<WebAuthnCredential> {
    const now = new Date();
    const credential: WebAuthnCredential = {
      id: randomUUID(),
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      credentialId: input.credentialId,
      publicKey: input.publicKey,
      counter: input.counter,
      transports: input.transports,
      deviceType: input.deviceType,
      backedUp: input.backedUp,
      lastUsedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.items.push(credential);
    return credential;
  }

  async findByEmployee(employeeId: string): Promise<WebAuthnCredential[]> {
    return this.items.filter((c) => c.employeeId === employeeId);
  }

  async findByCredentialId(
    credentialId: Buffer,
  ): Promise<WebAuthnCredential | null> {
    return this.items.find((c) => c.credentialId.equals(credentialId)) ?? null;
  }

  async findByCredentialIdBase64(
    credentialIdBase64: string,
  ): Promise<WebAuthnCredential | null> {
    const credentialId = Buffer.from(credentialIdBase64, 'base64url');
    return this.findByCredentialId(credentialId);
  }

  async updateCounter(id: string, newCounter: bigint): Promise<void> {
    const item = this.items.find((c) => c.id === id);
    if (item) {
      item.counter = newCounter;
      item.updatedAt = new Date();
    }
  }

  async updateLastUsedAt(id: string, lastUsedAt: Date): Promise<void> {
    const item = this.items.find((c) => c.id === id);
    if (item) {
      item.lastUsedAt = lastUsedAt;
      item.updatedAt = new Date();
    }
  }
}
