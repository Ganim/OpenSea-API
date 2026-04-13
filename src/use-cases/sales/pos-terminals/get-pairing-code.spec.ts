import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPairingCodeUseCase } from './get-pairing-code';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let sut: GetPairingCodeUseCase;

const tenantId = 'tenant-1';

describe('GetPairingCodeUseCase', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    sut = new GetPairingCodeUseCase(posTerminalsRepository);
  });

  it('should return a pairing code for a valid terminal', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      pairingSecret: 'a'.repeat(64),
    });
    posTerminalsRepository.items.push(terminal);

    const result = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
    });

    expect(result.code).toBeTruthy();
    expect(typeof result.code).toBe('string');
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should throw ResourceNotFoundError for non-existing terminal', async () => {
    await expect(
      sut.execute({ tenantId, terminalId: 'non-existing' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError if terminal has no pairing secret', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    // Override pairingSecret to be undefined
    (terminal as any).props.pairingSecret = undefined;
    posTerminalsRepository.items.push(terminal);

    await expect(
      sut.execute({ tenantId, terminalId: terminal.id.toString() }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
