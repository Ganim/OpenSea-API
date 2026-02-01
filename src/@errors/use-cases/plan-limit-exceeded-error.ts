export class PlanLimitExceededError extends Error {
  constructor(resource: string, limit: number) {
    super(
      `Plan limit exceeded: maximum of ${limit} ${resource} allowed in your current plan. Please upgrade your plan to add more.`,
    );
    this.name = 'PlanLimitExceededError';
  }
}
