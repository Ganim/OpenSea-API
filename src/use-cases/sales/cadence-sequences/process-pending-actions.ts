import type { CadenceSequencesRepository } from '@/repositories/sales/cadence-sequences-repository';

interface ProcessPendingActionsUseCaseRequest {
  tenantId: string;
}

interface ProcessPendingActionsUseCaseResponse {
  processedCount: number;
  completedCount: number;
  advancedCount: number;
}

export class ProcessPendingActionsUseCase {
  constructor(private cadenceSequencesRepository: CadenceSequencesRepository) {}

  async execute(
    input: ProcessPendingActionsUseCaseRequest,
  ): Promise<ProcessPendingActionsUseCaseResponse> {
    const now = new Date();

    const pendingEnrollments =
      await this.cadenceSequencesRepository.findPendingEnrollments(
        input.tenantId,
        now,
      );

    let completedCount = 0;
    let advancedCount = 0;

    for (const enrollment of pendingEnrollments) {
      const cadenceSequence = await this.cadenceSequencesRepository.findById(
        enrollment.sequenceId,
        input.tenantId,
      );

      if (!cadenceSequence) continue;

      // Sort steps by order
      const sortedSteps = [...cadenceSequence.steps].sort(
        (stepA, stepB) => stepA.order - stepB.order,
      );

      const currentStepIndex = sortedSteps.findIndex(
        (step) => step.order === enrollment.currentStepOrder,
      );

      if (currentStepIndex === -1) continue;

      // Log execution of current step (in a real system, this would trigger the action)
      const isLastStep = currentStepIndex >= sortedSteps.length - 1;

      if (isLastStep) {
        enrollment.status = 'COMPLETED';
        enrollment.completedAt = new Date();
        enrollment.nextActionAt = undefined;
        completedCount++;
      } else {
        const nextStep = sortedSteps[currentStepIndex + 1];
        enrollment.currentStepOrder = nextStep.order;

        const nextActionAt = new Date();
        nextActionAt.setDate(nextActionAt.getDate() + nextStep.delayDays);
        enrollment.nextActionAt = nextActionAt;
        advancedCount++;
      }

      await this.cadenceSequencesRepository.saveEnrollment(enrollment);
    }

    return {
      processedCount: pendingEnrollments.length,
      completedCount,
      advancedCount,
    };
  }
}
