import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResendNotificationsUseCase } from './resend-notifications';

const tenantId = 'tenant-1';
const envelopeId = 'envelope-1';

function makeMocks() {
  const envelopesRepository = {
    findById: vi.fn(),
  } as unknown;

  const signersRepository = {
    findByEnvelopeId: vi.fn(),
    update: vi.fn(),
  } as unknown;

  const auditEventsRepository = {
    create: vi.fn(),
  } as unknown;

  const sut = new ResendNotificationsUseCase(
    envelopesRepository,
    signersRepository,
    auditEventsRepository,
  );

  return { sut, envelopesRepository, signersRepository, auditEventsRepository };
}

describe('ResendNotificationsUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should resend notifications to pending signers', async () => {
    mocks.envelopesRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(envelopeId),
      title: 'Contract',
    });

    const signers = [
      {
        id: new UniqueEntityID('s-1'),
        status: 'PENDING',
        notificationCount: 1,
        lastNotifiedAt: new Date(),
      },
      {
        id: new UniqueEntityID('s-2'),
        status: 'WAITING',
        notificationCount: 0,
        lastNotifiedAt: null,
      },
      {
        id: new UniqueEntityID('s-3'),
        status: 'SIGNED',
        notificationCount: 2,
        lastNotifiedAt: new Date(),
      },
    ];

    mocks.signersRepository.findByEnvelopeId.mockResolvedValue(signers);
    mocks.signersRepository.update.mockResolvedValue({});
    mocks.auditEventsRepository.create.mockResolvedValue({});

    const result = await mocks.sut.execute({ tenantId, envelopeId });

    expect(result.notifiedCount).toBe(2);
    expect(mocks.signersRepository.update).toHaveBeenCalledTimes(2);
    expect(mocks.signersRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 's-1',
        notificationCount: 2,
      }),
    );
    expect(mocks.signersRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 's-2',
        notificationCount: 1,
      }),
    );
    expect(mocks.auditEventsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'REMINDED',
        envelopeId,
      }),
    );
  });

  it('should not create audit event when no pending signers exist', async () => {
    mocks.envelopesRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(envelopeId),
    });

    mocks.signersRepository.findByEnvelopeId.mockResolvedValue([
      { id: new UniqueEntityID('s-1'), status: 'SIGNED', notificationCount: 1 },
      {
        id: new UniqueEntityID('s-2'),
        status: 'REJECTED',
        notificationCount: 1,
      },
    ]);

    const result = await mocks.sut.execute({ tenantId, envelopeId });

    expect(result.notifiedCount).toBe(0);
    expect(mocks.signersRepository.update).not.toHaveBeenCalled();
    expect(mocks.auditEventsRepository.create).not.toHaveBeenCalled();
  });

  it('should throw ResourceNotFoundError when envelope does not exist', async () => {
    mocks.envelopesRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({ tenantId, envelopeId }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should filter out EXPIRED signers', async () => {
    mocks.envelopesRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(envelopeId),
    });

    mocks.signersRepository.findByEnvelopeId.mockResolvedValue([
      {
        id: new UniqueEntityID('s-1'),
        status: 'EXPIRED',
        notificationCount: 3,
      },
    ]);

    const result = await mocks.sut.execute({ tenantId, envelopeId });

    expect(result.notifiedCount).toBe(0);
  });
});
