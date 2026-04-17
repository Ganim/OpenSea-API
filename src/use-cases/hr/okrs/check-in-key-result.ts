import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { calculateKrProgress } from '@/entities/hr/key-result';
import type { OKRCheckIn } from '@/entities/hr/okr-check-in';
import type { KeyResultsRepository } from '@/repositories/hr/key-results-repository';
import type { ObjectivesRepository } from '@/repositories/hr/objectives-repository';
import type { OKRCheckInsRepository } from '@/repositories/hr/okr-check-ins-repository';

export interface CheckInKeyResultRequest {
  tenantId: string;
  keyResultId: string;
  employeeId: string;
  newValue: number;
  note?: string;
  confidence: string;
}

export interface CheckInKeyResultResponse {
  checkIn: OKRCheckIn;
}

export class CheckInKeyResultUseCase {
  constructor(
    private keyResultsRepository: KeyResultsRepository,
    private okrCheckInsRepository: OKRCheckInsRepository,
    private objectivesRepository: ObjectivesRepository,
  ) {}

  async execute(
    request: CheckInKeyResultRequest,
  ): Promise<CheckInKeyResultResponse> {
    const keyResultId = new UniqueEntityID(request.keyResultId);

    const keyResult = await this.keyResultsRepository.findById(
      keyResultId,
      request.tenantId,
    );

    if (!keyResult) {
      throw new Error('Key result not found');
    }

    const previousValue = keyResult.currentValue;

    const checkIn = await this.okrCheckInsRepository.create({
      tenantId: request.tenantId,
      keyResultId,
      employeeId: new UniqueEntityID(request.employeeId),
      previousValue,
      newValue: request.newValue,
      note: request.note,
      confidence: request.confidence,
    });

    // Update the key result's current value
    await this.keyResultsRepository.update({
      id: keyResultId,
      currentValue: request.newValue,
    });

    // Recalculate objective progress
    const allKeyResults = await this.keyResultsRepository.findByObjective(
      keyResult.objectiveId,
      request.tenantId,
    );

    const totalWeight = allKeyResults.reduce((sum, kr) => sum + kr.weight, 0);
    const weightedProgress =
      totalWeight === 0
        ? 0
        : allKeyResults.reduce((sum, kr) => {
            const krCurrentValue = kr.id.equals(keyResultId)
              ? request.newValue
              : kr.currentValue;
            const krProgress = calculateKrProgress({
              startValue: kr.startValue,
              targetValue: kr.targetValue,
              currentValue: krCurrentValue,
              direction: kr.direction,
            });
            return sum + krProgress * (kr.weight / totalWeight);
          }, 0);

    await this.objectivesRepository.update({
      id: keyResult.objectiveId,
      progress: Number(weightedProgress.toFixed(2)),
    });

    return { checkIn };
  }
}
