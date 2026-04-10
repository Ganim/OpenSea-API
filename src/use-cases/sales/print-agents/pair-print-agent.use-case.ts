import { createHash, randomBytes } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { isValidPairingCode } from '@/lib/pos-pairing-code';
import type { PrintAgentsRepository } from '@/repositories/sales/print-agents-repository';

interface PairPrintAgentUseCaseRequest {
  pairingCode: string;
  hostname: string;
  tenantId?: string;
}

interface PairPrintAgentUseCaseResponse {
  deviceToken: string;
  agentId: string;
  agentName: string;
}

export class PairPrintAgentUseCase {
  constructor(private printAgentsRepository: PrintAgentsRepository) {}

  async execute(
    input: PairPrintAgentUseCaseRequest,
  ): Promise<PairPrintAgentUseCaseResponse> {
    const normalizedCode = input.pairingCode.trim().toUpperCase();

    // Search ALL unpaired agents across all tenants.
    // The TOTP-based pairing code (6-char, 120s window, 32-byte random secret)
    // is globally unique — collision probability is negligible.
    const unpairedAgents = await this.printAgentsRepository.findAllUnpairedWithPairingSecret();

    const matchedAgent = unpairedAgents.find(
      (agent) =>
        agent.pairingSecret &&
        isValidPairingCode(agent.pairingSecret, normalizedCode),
    );

    if (!matchedAgent) {
      throw new BadRequestError('Invalid or expired pairing code.');
    }

    if (matchedAgent.isPaired) {
      throw new BadRequestError('This agent is already paired. Unpair it first.');
    }

    const deviceToken = randomBytes(32).toString('hex');
    const deviceTokenHash = createHash('sha256').update(deviceToken).digest('hex');
    const deviceLabel = `${input.hostname}`;

    matchedAgent.pair(deviceTokenHash, deviceLabel);
    await this.printAgentsRepository.save(matchedAgent);

    return {
      deviceToken,
      agentId: matchedAgent.id.toString(),
      agentName: matchedAgent.name,
    };
  }
}
