import { describe, expect, it } from 'vitest';
import { computePendingIssues } from './compute-pending-issues';

describe('computePendingIssues', () => {
  it('should return empty array when description is provided', () => {
    const issues = computePendingIssues({ descriptionProvided: true });
    expect(issues).toHaveLength(0);
  });

  it('should return description issue when not provided', () => {
    const issues = computePendingIssues({ descriptionProvided: false });
    expect(issues).toContain('description');
  });

  it('should return description issue when field is undefined', () => {
    const issues = computePendingIssues({});
    expect(issues).toContain('description');
  });
});
