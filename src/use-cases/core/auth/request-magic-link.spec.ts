import { InMemoryAuthLinksRepository } from '@/repositories/core/in-memory/in-memory-auth-links-repository';
import { InMemoryMagicLinkTokensRepository } from '@/repositories/core/in-memory/in-memory-magic-link-tokens-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { EmailService } from '@/services/email-service';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestMagicLinkUseCase } from './request-magic-link';

let authLinksRepository: InMemoryAuthLinksRepository;
let usersRepository: InMemoryUsersRepository;
let magicLinkTokensRepository: InMemoryMagicLinkTokensRepository;
let emailService: EmailService;
let sut: RequestMagicLinkUseCase;

describe('Request Magic Link Use Case', () => {
  beforeEach(() => {
    authLinksRepository = new InMemoryAuthLinksRepository();
    usersRepository = new InMemoryUsersRepository();
    magicLinkTokensRepository = new InMemoryMagicLinkTokensRepository();

    emailService = {
      sendMagicLinkEmail: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as EmailService;

    sut = new RequestMagicLinkUseCase(
      authLinksRepository,
      usersRepository,
      magicLinkTokensRepository,
      emailService,
    );
  });

  it('should send magic link email for valid email identifier', async () => {
    await makeUser({
      email: 'magic@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];

    await authLinksRepository.create({
      userId: user.id,
      provider: 'EMAIL',
      identifier: 'magic@example.com',
    });

    const result = await sut.execute({ identifier: 'magic@example.com' });

    expect(result.message).toBe(
      'Se o identificador estiver cadastrado, um email foi enviado.',
    );
    expect(emailService.sendMagicLinkEmail).toHaveBeenCalledOnce();
    expect(emailService.sendMagicLinkEmail).toHaveBeenCalledWith(
      'magic@example.com',
      expect.any(String),
      15,
    );
  });

  it('should return generic message for non-existent identifier', async () => {
    const result = await sut.execute({
      identifier: 'nonexistent@example.com',
    });

    expect(result.message).toBe(
      'Se o identificador estiver cadastrado, um email foi enviado.',
    );
    expect(emailService.sendMagicLinkEmail).not.toHaveBeenCalled();
  });

  it('should find email from EMAIL authLink when using CPF', async () => {
    await makeUser({
      email: 'cpfuser@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];

    await authLinksRepository.create({
      userId: user.id,
      provider: 'CPF',
      identifier: '12345678901',
    });

    await authLinksRepository.create({
      userId: user.id,
      provider: 'EMAIL',
      identifier: 'cpfuser@example.com',
    });

    const result = await sut.execute({ identifier: '123.456.789-01' });

    expect(result.message).toBe(
      'Se o identificador estiver cadastrado, um email foi enviado.',
    );
    expect(emailService.sendMagicLinkEmail).toHaveBeenCalledWith(
      'cpfuser@example.com',
      expect.any(String),
      15,
    );
  });

  it('should hash token before storing', async () => {
    await makeUser({
      email: 'hashtest@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];

    await authLinksRepository.create({
      userId: user.id,
      provider: 'EMAIL',
      identifier: 'hashtest@example.com',
    });

    await sut.execute({ identifier: 'hashtest@example.com' });

    // The stored token should be a sha256 hex hash (64 chars), not a base64url raw token
    const storedTokens = magicLinkTokensRepository['items'];
    expect(storedTokens).toHaveLength(1);
    expect(storedTokens[0].token).toMatch(/^[a-f0-9]{64}$/);

    // The raw token sent via email should NOT match the stored hash
    const sentRawToken = (emailService.sendMagicLinkEmail as any).mock
      .calls[0][1];
    const expectedHash = crypto
      .createHash('sha256')
      .update(sentRawToken)
      .digest('hex');
    expect(storedTokens[0].token).toBe(expectedHash);
  });
});
