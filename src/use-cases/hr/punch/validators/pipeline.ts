import type {
  PunchValidationContext,
  PunchValidationDecision,
  PunchValidator,
} from './punch-validator.interface';

/**
 * Discriminated result of the whole pipeline run.
 *
 * - `REJECT`: first validator to vote REJECT aborts the pipeline. The
 *   rejection is surfaced for the controller to map to HTTP 400.
 * - `ACCEPT`: every validator accepted and nobody required approval.
 *   Use case writes the TimeEntry and emits events only.
 * - `ACCEPT_WITH_APPROVALS`: no REJECT, but at least one validator
 *   returned APPROVAL_REQUIRED. The batida is still recorded (Portaria
 *   671 / D-12), and one PunchApproval PENDING row is created per
 *   approval decision.
 */
export type PipelineRunResult =
  | {
      decision: 'REJECT';
      rejection: Extract<PunchValidationDecision, { outcome: 'REJECT' }>;
      approvals: [];
    }
  | { decision: 'ACCEPT'; approvals: [] }
  | {
      decision: 'ACCEPT_WITH_APPROVALS';
      approvals: Extract<
        PunchValidationDecision,
        { outcome: 'APPROVAL_REQUIRED' }
      >[];
    };

/**
 * Orchestrator for the punch validation chain (D-05).
 *
 * Fixed-order execution is injected at construction time; the factory
 * wires the canonical order:
 * EmployeeActive → VacationActive → AbsenceActive → WorkSchedule → Geofence.
 *
 * Short-circuit semantics:
 * - first REJECT wins and aborts (cheap validators first saves DB hits)
 * - APPROVAL_REQUIRED never aborts — accumulates in the approvals array
 * - ACCEPT is the neutral outcome
 */
export class PunchValidationPipeline {
  constructor(private readonly validators: readonly PunchValidator[]) {}

  async run(ctx: PunchValidationContext): Promise<PipelineRunResult> {
    const approvals: Extract<
      PunchValidationDecision,
      { outcome: 'APPROVAL_REQUIRED' }
    >[] = [];

    for (const validator of this.validators) {
      const result = await validator.validate(ctx);

      if (result.outcome === 'REJECT') {
        return { decision: 'REJECT', rejection: result, approvals: [] };
      }
      if (result.outcome === 'APPROVAL_REQUIRED') {
        approvals.push(result);
      }
      // ACCEPT: nothing to do, move on.
    }

    return approvals.length
      ? { decision: 'ACCEPT_WITH_APPROVALS', approvals }
      : { decision: 'ACCEPT', approvals: [] };
  }
}
