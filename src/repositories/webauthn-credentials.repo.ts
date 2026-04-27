/**
 * WebAuthnCredentialsRepository — interface for WebAuthn credential persistence.
 *
 * Plan 10-07 (D-G1): WebAuthn fallback for PCs without DigitalPersona reader.
 * Credentials stored server-side; templates stored client-side in SQLCipher.
 *
 * LGPD: publicKey stored as opaque Bytes; credentialId is non-PII device identifier.
 * Counter monotonically increasing — regression detection in VerifyAuthenticationUseCase.
 */

export interface WebAuthnCredential {
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
}

export interface CreateWebAuthnCredentialInput {
  tenantId: string;
  employeeId: string;
  credentialId: Buffer;
  publicKey: Buffer;
  counter: bigint;
  transports: string[];
  deviceType: string;
  backedUp: boolean;
}

export interface WebAuthnCredentialsRepository {
  create(input: CreateWebAuthnCredentialInput): Promise<WebAuthnCredential>;
  findByEmployee(employeeId: string): Promise<WebAuthnCredential[]>;
  findByCredentialId(credentialId: Buffer): Promise<WebAuthnCredential | null>;
  findByCredentialIdBase64(
    credentialIdBase64: string,
  ): Promise<WebAuthnCredential | null>;
  updateCounter(id: string, newCounter: bigint): Promise<void>;
  updateLastUsedAt(id: string, lastUsedAt: Date): Promise<void>;
}
