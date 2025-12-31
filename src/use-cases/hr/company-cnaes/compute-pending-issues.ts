export function computePendingIssues(input: {
  descriptionProvided?: boolean;
}): string[] {
  const issues: string[] = [];

  if (!input.descriptionProvided) {
    issues.push('description');
  }

  return issues;
}
