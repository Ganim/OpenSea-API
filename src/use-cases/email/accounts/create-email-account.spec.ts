import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { isEmailHostSafe } from '@/utils/security/validate-email-host';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateEmailAccountUseCase } from './create-email-account';

// Mock SSRF validation — use case tests use fake hosts like imap.example.com
vi.mock('@/utils/security/validate-email-host', () => ({
  isEmailHostSafe: vi.fn().mockResolvedValue(true),
}));

const mockedIsEmailHostSafe = vi.mocked(isEmailHostSafe);

class FakeCipherService {
  encrypt(value: string) {
    return `enc:${value}`;
  }
  decrypt(value: string) {
    return value.replace('enc:', '');
  }
}

class FakeImapService {
  testConnection = vi.fn().mockResolvedValue(undefined);
}

class FakeSmtpService {
  testConnection = vi.fn().mockResolvedValue(undefined);
}

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 'tenant-1',
    userId: 'user-1',
    address: 'user@example.com',
    imapHost: 'imap.example.com',
    imapPort: 993,
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    username: 'user@example.com',
    secret: 'password',
    ...overrides,
  };
}

let repository: InMemoryEmailAccountsRepository;
let cipherService: FakeCipherService;
let sut: CreateEmailAccountUseCase;
let imapService: FakeImapService;
let smtpService: FakeSmtpService;

describe('CreateEmailAccountUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryEmailAccountsRepository();
    cipherService = new FakeCipherService();
    imapService = new FakeImapService();
    smtpService = new FakeSmtpService();

    sut = new CreateEmailAccountUseCase(
      repository,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cipherService as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      imapService as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      smtpService as any,
    );

    // Default: all hosts are safe (for tests using fake domains)
    mockedIsEmailHostSafe.mockResolvedValue(true);
  });

  it('should create a new email account', async () => {
    const result = await sut.execute(makeRequest({ isDefault: true }));

    expect(result.account.address).toBe('user@example.com');
    expect(result.account.isDefault).toBe(true);
    expect(repository.items).toHaveLength(1);
    expect(imapService.testConnection).toHaveBeenCalledOnce();
    expect(smtpService.testConnection).toHaveBeenCalledOnce();
  });

  it('should reject duplicated email account address', async () => {
    await sut.execute(makeRequest());

    await expect(sut.execute(makeRequest())).rejects.toThrow(
      'Email account already exists',
    );
  });

  // --- SSRF tests (mock returns false to simulate blocked hosts) ---

  it('should reject IMAP host localhost (SSRF)', async () => {
    mockedIsEmailHostSafe.mockImplementation(async (host) =>
      host !== 'localhost',
    );

    await expect(
      sut.execute(makeRequest({ imapHost: 'localhost' })),
    ).rejects.toThrow('Host IMAP bloqueado');
  });

  it('should reject SMTP host localhost (SSRF)', async () => {
    mockedIsEmailHostSafe.mockImplementation(async (host) =>
      host !== 'localhost',
    );

    await expect(
      sut.execute(makeRequest({ smtpHost: 'localhost' })),
    ).rejects.toThrow('Host SMTP bloqueado');
  });

  it("should reject IMAP host '127.0.0.1' (SSRF loopback)", async () => {
    mockedIsEmailHostSafe.mockImplementation(async (host) =>
      host !== '127.0.0.1',
    );

    await expect(
      sut.execute(makeRequest({ imapHost: '127.0.0.1' })),
    ).rejects.toThrow('Host IMAP bloqueado');
  });

  it("should reject IMAP host '10.0.0.1' (SSRF private class A)", async () => {
    mockedIsEmailHostSafe.mockImplementation(async (host) =>
      host !== '10.0.0.1',
    );

    await expect(
      sut.execute(makeRequest({ imapHost: '10.0.0.1' })),
    ).rejects.toThrow('Host IMAP bloqueado');
  });

  it("should reject IMAP host '192.168.1.1' (SSRF private class C)", async () => {
    mockedIsEmailHostSafe.mockImplementation(async (host) =>
      host !== '192.168.1.1',
    );

    await expect(
      sut.execute(makeRequest({ imapHost: '192.168.1.1' })),
    ).rejects.toThrow('Host IMAP bloqueado');
  });

  it("should reject IMAP host '172.16.0.1' (SSRF private 172.16/12)", async () => {
    mockedIsEmailHostSafe.mockImplementation(async (host) =>
      host !== '172.16.0.1',
    );

    await expect(
      sut.execute(makeRequest({ imapHost: '172.16.0.1' })),
    ).rejects.toThrow('Host IMAP bloqueado');
  });

  it("should reject IMAP host '169.254.169.254' (SSRF link-local/cloud metadata)", async () => {
    mockedIsEmailHostSafe.mockImplementation(async (host) =>
      host !== '169.254.169.254',
    );

    await expect(
      sut.execute(makeRequest({ imapHost: '169.254.169.254' })),
    ).rejects.toThrow('Host IMAP bloqueado');
  });

  it('should reject unresolvable hostname (DNS fail → blocked)', async () => {
    mockedIsEmailHostSafe.mockImplementation(async (host) =>
      host !== 'nonexistent.invalid.host.xyz',
    );

    await expect(
      sut.execute(makeRequest({ imapHost: 'nonexistent.invalid.host.xyz' })),
    ).rejects.toThrow('Host IMAP bloqueado');
  });

  // --- Connection tests ---

  it('should reject when IMAP connection test fails', async () => {
    imapService.testConnection.mockRejectedValueOnce(
      new Error('Connection refused'),
    );

    await expect(sut.execute(makeRequest())).rejects.toThrow(
      'Falha ao conectar ao servidor IMAP',
    );
  });

  it('should reject when SMTP connection test fails', async () => {
    smtpService.testConnection.mockRejectedValueOnce(
      new Error('EHLO timeout'),
    );

    await expect(sut.execute(makeRequest())).rejects.toThrow(
      'Falha ao conectar ao servidor SMTP',
    );
  });

  // --- Encryption ---

  it('should encrypt the secret before storing', async () => {
    const encryptSpy = vi.spyOn(cipherService, 'encrypt');

    await sut.execute(makeRequest({ secret: 'my-secret-pass' }));

    expect(encryptSpy).toHaveBeenCalledWith('my-secret-pass');

    const stored = repository.items[0];
    expect(stored.encryptedSecret).toBe('enc:my-secret-pass');
  });

  // --- Default flag ---

  it('should unset default flag on other accounts when isDefault=true', async () => {
    // Create a first account that is default
    await sut.execute(
      makeRequest({
        address: 'first@example.com',
        isDefault: true,
      }),
    );

    expect(repository.items[0].isDefault).toBe(true);

    // Create a second account that is also default
    await sut.execute(
      makeRequest({
        address: 'second@example.com',
        isDefault: true,
      }),
    );

    // First account should no longer be default
    expect(repository.items[0].isDefault).toBe(false);
    // Second account should be default
    expect(repository.items[1].isDefault).toBe(true);
  });

  // --- Multi-tenant isolation ---

  it('should allow same email address in different tenants', async () => {
    await sut.execute(makeRequest({ tenantId: 'tenant-1' }));

    const result = await sut.execute(
      makeRequest({ tenantId: 'tenant-2' }),
    );

    expect(result.account.address).toBe('user@example.com');
    expect(repository.items).toHaveLength(2);
  });
});

// --- Direct isEmailHostSafe tests (real implementation, no mock) ---

describe('isEmailHostSafe (real SSRF validation)', () => {
  // Import the REAL function by bypassing the mock
  let realIsEmailHostSafe: typeof isEmailHostSafe;

  beforeEach(async () => {
    // Dynamically import the actual module, bypassing vi.mock
    const mod = await vi.importActual<
      typeof import('@/utils/security/validate-email-host')
    >('@/utils/security/validate-email-host');
    realIsEmailHostSafe = mod.isEmailHostSafe;
  });

  it('should block localhost', async () => {
    expect(await realIsEmailHostSafe('localhost')).toBe(false);
  });

  it('should block localhost.localdomain', async () => {
    expect(await realIsEmailHostSafe('localhost.localdomain')).toBe(false);
  });

  it('should block 127.0.0.1 (loopback)', async () => {
    expect(await realIsEmailHostSafe('127.0.0.1')).toBe(false);
  });

  it('should block 10.0.0.1 (private class A)', async () => {
    expect(await realIsEmailHostSafe('10.0.0.1')).toBe(false);
  });

  it('should block 192.168.1.1 (private class C)', async () => {
    expect(await realIsEmailHostSafe('192.168.1.1')).toBe(false);
  });

  it('should block 172.16.0.1 (private 172.16/12)', async () => {
    expect(await realIsEmailHostSafe('172.16.0.1')).toBe(false);
  });

  it('should block 172.31.255.255 (upper bound of 172.16/12)', async () => {
    expect(await realIsEmailHostSafe('172.31.255.255')).toBe(false);
  });

  it('should allow 172.32.0.1 (outside private 172.16/12)', async () => {
    expect(await realIsEmailHostSafe('172.32.0.1')).toBe(true);
  });

  it('should block 169.254.169.254 (cloud metadata / link-local)', async () => {
    expect(await realIsEmailHostSafe('169.254.169.254')).toBe(false);
  });

  it('should block 0.0.0.0 (this-network)', async () => {
    expect(await realIsEmailHostSafe('0.0.0.0')).toBe(false);
  });

  it('should block ::1 (IPv6 loopback)', async () => {
    expect(await realIsEmailHostSafe('::1')).toBe(false);
  });

  it('should block unresolvable hostname (fail-closed)', async () => {
    expect(
      await realIsEmailHostSafe('nonexistent.invalid.host.xyz'),
    ).toBe(false);
  });

  it('should allow a valid public domain (e.g. imap.gmail.com)', async () => {
    // This test depends on DNS resolution, but gmail.com should always resolve
    expect(await realIsEmailHostSafe('imap.gmail.com')).toBe(true);
  });
});
