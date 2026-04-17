/**
 * CI Guard — Multi-Tenant Write Isolation
 *
 * Scans `src/repositories/**\/*.ts` (Prisma repositories) for write operations
 * (`update`, `updateMany`, `delete`, `deleteMany`, `upsert`) whose `where`
 * clause contains `id` but does NOT contain `tenantId`. This indicates a
 * potential multi-tenant isolation leak: an authenticated user of tenant A
 * could modify or delete records belonging to tenant B by knowing the target
 * record's ID.
 *
 * The script exits with code 1 if any violation is found, to be run in CI.
 *
 * Models known NOT to be tenant-scoped (globally shared) can be whitelisted
 * via the GLOBAL_MODELS set below.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

type Violation = {
  file: string;
  line: number;
  snippet: string;
  method: string;
};

const REPO_ROOT = new URL('../', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
);

const TARGET_DIRS = ['src/repositories'];

// Models that are intentionally tenant-agnostic (shared globally). Writes
// against these models do not need tenantId in the where clause.
const GLOBAL_MODELS = new Set([
  'user',
  'session',
  'refreshToken',
  'tenant',
  'tenantUser',
  'tenantPlan',
  'tenantFeatureFlag',
  'plan',
  'planModule',
  'module',
  'permission',
  'rolePermission',
  'role',
  'userRole',
  'passwordResetToken',
  'emailVerificationToken',
  'auditLog',
  'outboxEvent',
  'eventLog',
  'ipBlacklist',
  'ipWhitelist',
  'jobStatus',
]);

const WRITE_METHODS = ['update', 'updateMany', 'delete', 'deleteMany', 'upsert'];

async function collectFiles(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) {
      if (entry === 'node_modules' || entry === 'generated') continue;
      await collectFiles(full, acc);
    } else if (
      entry.endsWith('.ts') &&
      !entry.endsWith('.spec.ts') &&
      !entry.endsWith('.e2e.spec.ts') &&
      !entry.endsWith('.d.ts')
    ) {
      acc.push(full);
    }
  }
  return acc;
}

function extractWhereBlock(
  source: string,
  methodCallStart: number,
): { block: string; endIndex: number } | null {
  // Find the first "where" property after the method call opening "("
  const whereKey = /\bwhere\s*:\s*\{/g;
  whereKey.lastIndex = methodCallStart;
  const match = whereKey.exec(source);
  if (!match) return null;
  const openBraceIndex = match.index + match[0].length - 1;
  let depth = 1;
  let i = openBraceIndex + 1;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  if (depth !== 0) return null;
  return {
    block: source.slice(openBraceIndex, i),
    endIndex: i,
  };
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function analyzeFile(filePath: string, source: string): Violation[] {
  const violations: Violation[] = [];

  // Pattern: (prisma|client|tx).MODEL.(update|updateMany|delete|deleteMany|upsert)(
  // Capture model name and method.
  const methodRegex =
    /\b(?:prisma|client|tx|db|this\.prisma|ctx|trx)\.([a-zA-Z][a-zA-Z0-9_]*)\.(update|updateMany|delete|deleteMany|upsert)\s*\(/g;

  let match: RegExpExecArray | null;
  while ((match = methodRegex.exec(source)) !== null) {
    const [, modelName, methodName] = match;
    if (GLOBAL_MODELS.has(modelName)) continue;

    const callStart = match.index + match[0].length - 1; // position of "("
    const whereInfo = extractWhereBlock(source, callStart);
    if (!whereInfo) continue;

    const { block } = whereInfo;
    // Skip if block uses explicit tenantId scoping.
    if (/\btenantId\b/.test(block)) continue;

    // Heuristic: if where uses a composite unique like `modelName_unique: { ... tenantId ... }`,
    // also considered safe. Already handled by the tenantId regex above when tenantId appears anywhere.

    // Skip common safe patterns where id is not present and a relational filter already scopes it
    // (e.g. where: { proposalId: ... } inside a transaction on a child). We still flag these because
    // they may be parent-scoped; rely on GLOBAL_MODELS for exceptions.

    // If there's no `id` reference AND no tenantId, we still flag because write op without scoping
    // is suspicious. But allow pure relational scoping like `employeeId` / `payrollId` only if
    // parent was fetched tenant-scoped — we cannot prove that statically, so we flag with info.

    const hasIdFilter = /\bid\s*:/.test(block);
    const hasRelationalScope =
      /\b(employeeId|payrollId|tenantId|customerId|orderId|companyId|departmentId|positionId|candidateId|applicationId|reviewId|surveyId|objectiveId|keyResultId|meetingId|programId|cycleId|postingId|interviewId|stageId|periodId|splitId|assignmentId|checklistId|warningId|allocationId|enrollmentId|templateId|configurationId|examId|mandateId|memberId|requirementId|riskId|itemId|recipientId|announcementId|receiptId|shiftId|bankId|entryId|contractId|zoneId|reactionId|replyId|actionItemId|talkingPointId|delegationId|pointId|dependantId|requestId|kudosId)\s*:/.test(
        block,
      );
    const hasCompositeUnique = /_unique\s*:/.test(block);

    // We flag only when an id filter is present without tenantId — the highest-risk case.
    // Pure relational scoping (e.g. deleteMany by parent id) is considered OK because the
    // parent fetch is expected to be tenant-scoped upstream.
    if (hasIdFilter) {
      const lineNumber = lineOf(source, match.index);
      const lineText = source.split('\n')[lineNumber - 1]?.trim() ?? '';
      violations.push({
        file: relative(REPO_ROOT, filePath).replace(/\\/g, '/'),
        line: lineNumber,
        snippet: lineText,
        method: `${modelName}.${methodName}`,
      });
    } else if (!hasRelationalScope && !hasCompositeUnique) {
      // Bare write without any scoping — also unsafe
      const lineNumber = lineOf(source, match.index);
      const lineText = source.split('\n')[lineNumber - 1]?.trim() ?? '';
      violations.push({
        file: relative(REPO_ROOT, filePath).replace(/\\/g, '/'),
        line: lineNumber,
        snippet: lineText,
        method: `${modelName}.${methodName}`,
      });
    }
  }

  return violations;
}

async function main(): Promise<void> {
  const allViolations: Violation[] = [];

  for (const dir of TARGET_DIRS) {
    const abs = join(REPO_ROOT, dir);
    try {
      const files = await collectFiles(abs);
      for (const file of files) {
        const source = await readFile(file, 'utf-8');
        const violations = analyzeFile(file, source);
        allViolations.push(...violations);
      }
    } catch (err) {
      console.error(`[check-tenant-scoped-writes] Failed to scan ${dir}:`, err);
      process.exit(2);
    }
  }

  if (allViolations.length === 0) {
    console.log(
      '[check-tenant-scoped-writes] OK — no multi-tenant write leaks found.',
    );
    process.exit(0);
  }

  console.error(
    `[check-tenant-scoped-writes] FOUND ${allViolations.length} potential multi-tenant write leak(s):\n`,
  );

  const byFile = new Map<string, Violation[]>();
  for (const violation of allViolations) {
    const bucket = byFile.get(violation.file) ?? [];
    bucket.push(violation);
    byFile.set(violation.file, bucket);
  }

  const sortedFiles = [...byFile.keys()].sort();
  for (const file of sortedFiles) {
    const violations = byFile.get(file)!;
    console.error(`  ${file} (${violations.length})`);
    for (const v of violations) {
      console.error(`    line ${v.line} [${v.method}]  ${v.snippet}`);
    }
  }

  console.error(
    '\nEvery write to a tenant-scoped model MUST include tenantId in its where clause.\n' +
      'Fix by changing `where: { id }` to `where: { id, tenantId }` or by using\n' +
      '`updateMany`/`deleteMany` with `{ where: { id, tenantId } }`.',
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
