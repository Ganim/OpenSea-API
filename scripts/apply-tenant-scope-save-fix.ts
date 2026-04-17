/**
 * One-shot codemod to add tenantId scoping to Prisma `save(entity)` methods
 * in HR repositories.
 *
 * Transformation applied:
 *
 *   await prisma.MODEL.update({
 *     where: { id: entity.id.toString() },
 *     data: { ... },
 *   });
 *
 *   =>
 *
 *   await prisma.MODEL.update({
 *     where: {
 *       id: entity.id.toString(),
 *       tenantId: entity.tenantId.toString(),
 *     },
 *     data: { ... },
 *   });
 *
 * The codemod scans HR prisma repository files and, for each method whose
 * body contains `await <client>.<model>.update({ where: { id: <EXPR>.id.toString() ... } })`
 * AND an `<EXPR>.tenantId` is valid (checked via static source heuristics —
 * the `<EXPR>` variable must match an `entity`/`data` parameter that is known
 * to carry tenantId, inferred by grep-matching within the repo file), it
 * injects `tenantId: <EXPR>.tenantId.toString()` into the where clause.
 *
 * This script is safe to re-run; it is a no-op if tenantId is already present.
 *
 * Usage: tsx scripts/apply-tenant-scope-save-fix.ts [--dry-run]
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const REPO_ROOT = new URL('../', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
);

const TARGET_DIR = join(REPO_ROOT, 'src/repositories/hr/prisma');

const DRY_RUN = process.argv.includes('--dry-run');

type Change = {
  file: string;
  occurrences: number;
};

async function collectFiles(
  dir: string,
  acc: string[] = [],
): Promise<string[]> {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) {
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

/**
 * Transforms a single `where: { id: VAR.id.toString() }` block by appending
 * `tenantId: VAR.tenantId.toString()` if `VAR` is a domain Entity parameter
 * whose class exposes `tenantId` as a getter.
 *
 * Domain entities (safe to rewrite): variable name matches a known entity —
 * detected by scanning the file for a parameter declaration of the form
 * `<varName>: <TypeName>` where TypeName is an HR domain entity class name
 * (starts with uppercase, not ending with "Schema" / "Request" / "Response").
 *
 * Update/CreateXxxSchema objects are intentionally skipped because they do
 * not (yet) carry `tenantId` — those need manual interface changes.
 */
const UPDATE_SCHEMA_SUFFIXES = [
  'Schema',
  'Request',
  'Response',
  'DTO',
  'Input',
];

function findVarType(source: string, varName: string): string | null {
  // Look for parameter declarations like `varName: SomeType` or
  // `varName: SomeType,` / `varName: SomeType)` / `varName: SomeType|null`
  const paramPattern = new RegExp(
    `\\b${varName}\\s*:\\s*([A-Z][A-Za-z0-9_]*)\\b`,
  );
  const match = paramPattern.exec(source);
  return match ? match[1] : null;
}

function isDomainEntityType(typeName: string): boolean {
  if (!typeName) return false;
  if (typeName === 'UniqueEntityID') return false;
  if (typeName === 'Date' || typeName === 'String' || typeName === 'Number')
    return false;
  for (const suffix of UPDATE_SCHEMA_SUFFIXES) {
    if (typeName.endsWith(suffix)) return false;
  }
  return true;
}

function transformSource(source: string): { next: string; count: number } {
  let count = 0;
  // Pattern: where: { id: VAR.id.toString() [,other:...] } — we accept the
  // simplest, most common form in HR repos.
  const whereIdOnly =
    /where:\s*\{\s*id:\s*([a-zA-Z_$][\w$]*)\.id\.toString\(\)\s*,?\s*\}/g;

  const next = source.replace(whereIdOnly, (match, varName: string) => {
    // Determine the static type of `varName` inside the file. Only rewrite
    // when the parameter is a domain Entity (which is guaranteed to expose
    // `.tenantId`). UpdateXxxSchema payloads are skipped.
    const varType = findVarType(source, varName);
    if (!varType || !isDomainEntityType(varType)) return match;

    // Also ensure `.tenantId` is a valid property on the variable by grepping
    // it somewhere in the file — acts as an extra safety check.
    const tenantProp = new RegExp(`\\b${varName}\\.tenantId\\b`);
    if (!tenantProp.test(source)) return match;

    count++;
    return `where: { id: ${varName}.id.toString(), tenantId: ${varName}.tenantId.toString() }`;
  });

  return { next, count };
}

async function main(): Promise<void> {
  const files = await collectFiles(TARGET_DIR);
  const changes: Change[] = [];

  for (const file of files) {
    const source = await readFile(file, 'utf-8');
    const { next, count } = transformSource(source);
    if (count === 0) continue;

    changes.push({
      file: relative(REPO_ROOT, file).replace(/\\/g, '/'),
      occurrences: count,
    });

    if (!DRY_RUN) {
      await writeFile(file, next, 'utf-8');
    }
  }

  if (changes.length === 0) {
    console.log('[apply-tenant-scope-save-fix] No changes needed.');
    return;
  }

  const total = changes.reduce((sum, c) => sum + c.occurrences, 0);
  console.log(
    `[apply-tenant-scope-save-fix] ${DRY_RUN ? 'DRY-RUN — would modify' : 'Modified'} ${changes.length} files (${total} occurrences).`,
  );
  for (const c of changes) {
    console.log(`  ${c.file} (${c.occurrences})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
