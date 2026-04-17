/**
 * Codemod — Scope HR repository writes by tenantId (defense-in-depth).
 *
 * For every `src/repositories/hr/prisma/prisma-*-repository.ts`:
 *   - Within every `<client>.<model>.<update|updateMany|findFirst|findUnique|upsert>` call,
 *     if the `where` block contains `id` but NOT `tenantId`, inject tenant scoping.
 *     * When the id expression is `data.id.toString()`, soft-scope with
 *       `...(data.tenantId && { tenantId: data.tenantId })`.
 *     * When the id expression is `<entity>.id.toString()` and the enclosing
 *       method is `save(<entity>: SomeEntity)`, hard-scope with
 *       `tenantId: <entity>.tenantId.toString()`.
 *   - Same treatment for `delete` / `deleteMany` using the parameter `tenantId?: string`.
 *
 * For every `src/repositories/hr/*-repository.ts` (interface file):
 *   - Adds `tenantId?: string` to `UpdateXxxSchema` interfaces (idempotent).
 *   - Rewrites the `delete(id, ...)` method signature to accept `tenantId?: string`.
 *
 * For every `src/repositories/hr/in-memory/in-memory-*-repository.ts`:
 *   - Rewrites `delete(id)` signature and body to accept/filter by optional tenantId.
 *   - Rewrites `update(data)` body to filter by `data.tenantId` when provided.
 *
 * Idempotent.
 *
 * Usage: tsx scripts/apply-hr-tenant-scope-writes.ts [--dry-run]
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const REPO_ROOT = new URL('../', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
);

const INTERFACE_DIR = join(REPO_ROOT, 'src/repositories/hr');
const PRISMA_DIR = join(REPO_ROOT, 'src/repositories/hr/prisma');
const IN_MEMORY_DIR = join(REPO_ROOT, 'src/repositories/hr/in-memory');

const DRY_RUN = process.argv.includes('--dry-run');

type FileChange = {
  file: string;
  transforms: string[];
};

const changes: FileChange[] = [];

function record(file: string, transform: string) {
  const existing = changes.find((c) => c.file === file);
  if (existing) {
    existing.transforms.push(transform);
  } else {
    changes.push({
      file: relative(REPO_ROOT, file).replace(/\\/g, '/'),
      transforms: [transform],
    });
  }
}

async function listFiles(dir: string): Promise<string[]> {
  const acc: string[] = [];
  let entries: string[] = [];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const info = await stat(full);
    if (info.isFile() && entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Finds the matching closing brace for an opening brace at index `openIdx`.
 * Returns the index of the closing brace.
 */
function matchBrace(source: string, openIdx: number): number {
  let depth = 1;
  let i = openIdx + 1;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth === 0) return i;
    i++;
  }
  return -1;
}

/**
 * Inserts `scopingLine` at the end of the `where` block body (just before the
 * closing `}`), preserving indentation style of surrounding lines.
 */
function insertIntoWhereBlock(
  source: string,
  whereOpenIdx: number,
  whereCloseIdx: number,
  scopingText: string,
): string {
  const blockBody = source.slice(whereOpenIdx + 1, whereCloseIdx);
  const isInline = !blockBody.includes('\n');

  if (isInline) {
    // e.g. { id: data.id.toString() } or { id: data.id.toString(), x: 1 }
    // Strip trailing spaces, ensure trailing comma, append scoping.
    const trimmed = blockBody.replace(/\s+$/, '');
    const needsComma = trimmed.length > 0 && !trimmed.endsWith(',');
    const comma = needsComma ? ',' : '';
    const leading = blockBody.startsWith(' ') ? '' : ' ';
    const newBody = `${leading}${trimmed}${comma} ${scopingText} `;
    return source.slice(0, whereOpenIdx + 1) + newBody + source.slice(whereCloseIdx);
  }

  // Multi-line: find indent of the first non-empty line, insert new line before closing brace.
  const lines = blockBody.split('\n');
  let indent = '        ';
  for (const line of lines) {
    const m = line.match(/^(\s+)\S/);
    if (m) {
      indent = m[1];
      break;
    }
  }

  // Ensure the last non-empty line ends with a comma.
  let lastNonEmptyIdx = lines.length - 1;
  while (lastNonEmptyIdx >= 0 && lines[lastNonEmptyIdx].trim() === '') {
    lastNonEmptyIdx--;
  }
  if (lastNonEmptyIdx >= 0) {
    const last = lines[lastNonEmptyIdx].replace(/\s+$/, '');
    if (!last.endsWith(',') && !last.endsWith('{')) {
      lines[lastNonEmptyIdx] = last + ',';
    }
  }

  // Insert scoping line right after last non-empty line.
  lines.splice(lastNonEmptyIdx + 1, 0, `${indent}${scopingText}`);

  const newBody = lines.join('\n');
  return source.slice(0, whereOpenIdx + 1) + newBody + source.slice(whereCloseIdx);
}

/**
 * Returns the whole method text containing a given position, heuristically
 * bounded by the previous `async ` keyword and the next matching brace.
 */
function findEnclosingMethodHeader(
  source: string,
  pos: number,
): string {
  const before = source.slice(0, pos);
  const lastAsync = before.lastIndexOf('async ');
  if (lastAsync === -1) return '';
  const headerEnd = source.indexOf('{', lastAsync);
  if (headerEnd === -1) return '';
  return source.slice(lastAsync, headerEnd);
}

const UPDATE_SCHEMA_SUFFIX_RX = /Schema$|Request$|Response$|DTO$|Input$|Filters$/;

function isDomainEntitySaveHeader(header: string): {
  isSave: boolean;
  varName: string | null;
} {
  // Header like: "async save(entity: SomeType, tx?: TransactionClient): Promise<void>"
  const m = header.match(/\bsave\s*\(\s*([a-zA-Z_$][\w$]*)\s*:\s*([A-Z][A-Za-z0-9_]*)/);
  if (!m) return { isSave: false, varName: null };
  const [, varName, typeName] = m;
  if (typeName === 'UniqueEntityID') return { isSave: false, varName: null };
  if (UPDATE_SCHEMA_SUFFIX_RX.test(typeName))
    return { isSave: false, varName: null };
  return { isSave: true, varName };
}

// ---------- Interface transforms ----------

function transformInterfaceSource(filePath: string, source: string): string {
  let next = source;

  // Add `tenantId?: string` to UpdateXxxSchema interfaces that lack it.
  next = next.replace(
    /export interface (Update\w+(?:Schema|Data)) \{\n([\s\S]*?)\n\}/g,
    (match, name: string, body: string) => {
      if (/\btenantId\b/.test(body)) return match;
      if (!/^\s*id\s*[:?]/m.test(body)) return match;
      const lines = body.split('\n');
      const idLineIndex = lines.findIndex((l) => /^\s*id\s*[:?]/.test(l));
      if (idLineIndex === -1) return match;
      const indentMatch = lines[idLineIndex].match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '  ';
      const tenantLines = [
        `${indent}/**`,
        `${indent} * Tenant identifier for multi-tenant write isolation. Optional for backward`,
        `${indent} * compatibility during the defense-in-depth rollout, but callers MUST pass`,
        `${indent} * it so the underlying Prisma \`where\` clause is scoped and cannot update a`,
        `${indent} * record belonging to another tenant.`,
        `${indent} */`,
        `${indent}tenantId?: string;`,
      ];
      lines.splice(idLineIndex + 1, 0, ...tenantLines);
      record(filePath, `added tenantId? to ${name}`);
      return `export interface ${name} {\n${lines.join('\n')}\n}`;
    },
  );

  // Rewrite delete signature in the interface (method declaration, not implementation).
  next = next.replace(
    /\bdelete\s*\(\s*id\s*:\s*(UniqueEntityID|string)\s*\)\s*:\s*Promise<void>/g,
    (_match, typeName: string) => {
      record(filePath, `delete(id: ${typeName}, tenantId?: string)`);
      return `delete(id: ${typeName}, tenantId?: string): Promise<void>`;
    },
  );

  return next;
}

// ---------- Prisma transforms ----------

const WRITE_METHODS = [
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'upsert',
  'findUnique',
  'findFirst',
];

type CallSite = {
  callStart: number;    // position of "("
  method: string;
  whereOpen: number;    // position of "{" after "where:"
  whereClose: number;   // position of matching "}"
};

function findCallSites(source: string): CallSite[] {
  const result: CallSite[] = [];
  const rx = new RegExp(
    `\\b(?:this\\.)?(?:prisma|client|tx|db|ctx|trx)\\.[a-zA-Z][a-zA-Z0-9_]*\\.(${WRITE_METHODS.join('|')})\\s*\\(`,
    'g',
  );
  let m: RegExpExecArray | null;
  while ((m = rx.exec(source)) !== null) {
    const method = m[1];
    const openIdx = m.index + m[0].length - 1;
    // Find matching ")"
    let depth = 1;
    let i = openIdx + 1;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      if (depth === 0) break;
      i++;
    }
    const callEnd = i;
    if (callEnd >= source.length) continue;
    // Find first "where:" within [openIdx, callEnd].
    const call = source.slice(openIdx, callEnd);
    const whereRel = call.search(/\bwhere\s*:\s*\{/);
    if (whereRel === -1) continue;
    // Position of "{" after where:
    const whereKeyAbs = openIdx + whereRel;
    const braceAbs = source.indexOf('{', whereKeyAbs);
    if (braceAbs === -1 || braceAbs >= callEnd) continue;
    const closeBraceAbs = matchBrace(source, braceAbs);
    if (closeBraceAbs === -1) continue;
    result.push({
      callStart: openIdx,
      method,
      whereOpen: braceAbs,
      whereClose: closeBraceAbs,
    });
  }
  return result;
}

function transformPrismaSource(filePath: string, source: string): string {
  // STEP 1 — Rewrite `async delete(id: T): Promise<void>` signatures first so
  // that the subsequent header lookup includes `tenantId?: string` param.
  let next = source.replace(
    /\basync\s+delete\s*\(\s*id\s*:\s*(UniqueEntityID|string)\s*\)\s*:\s*Promise<void>/g,
    (_match, typeName: string) => {
      record(filePath, `delete(id: ${typeName}, tenantId?: string)`);
      return `async delete(id: ${typeName}, tenantId?: string): Promise<void>`;
    },
  );

  // STEP 2 — Rewrite every write-call `where` block that needs tenant scoping.
  // Process call sites from LAST to FIRST so that earlier offsets remain valid.
  const sites = findCallSites(next).sort((a, b) => b.callStart - a.callStart);

  for (const site of sites) {
    const whereBody = next.slice(site.whereOpen + 1, site.whereClose);
    if (/\btenantId\b/.test(whereBody)) continue;

    // Extract id expression pattern:
    //   id: VAR.id.toString()
    //   id: id.toString()
    //   id: <identifier> (e.g. id: employeeId)
    //   id: <shorthand> (just `id` or `id,` inside the object)
    const idDotMatch = whereBody.match(
      /\bid\s*:\s*([a-zA-Z_$][\w$]*)\.id\.toString\(\)/,
    );
    const idToStringSelfMatch =
      !idDotMatch && /\bid\s*:\s*id\.toString\(\)/.test(whereBody);
    const idSimpleVarMatch =
      !idDotMatch && !idToStringSelfMatch
        ? whereBody.match(/\bid\s*:\s*([a-zA-Z_$][\w$]*)\b/)
        : null;
    const idShorthandMatch =
      !idDotMatch && !idToStringSelfMatch && !idSimpleVarMatch
        ? /\bid\s*[,}]/.test(whereBody)
        : false;

    if (
      !idDotMatch &&
      !idToStringSelfMatch &&
      !idSimpleVarMatch &&
      !idShorthandMatch
    ) {
      continue;
    }

    const header = findEnclosingMethodHeader(next, site.callStart);
    const saveInfo = isDomainEntitySaveHeader(header);
    const headerAcceptsTenantId = /\btenantId\s*\??\s*:\s*string\b/.test(header);
    const headerAcceptsDataWithTenant =
      /\bdata\s*:\s*[A-Z][A-Za-z0-9_]*(?:Schema|Data)\b/.test(header);

    let scoping: string | null = null;

    if (idDotMatch) {
      const varName = idDotMatch[1];
      if (varName === 'data') {
        scoping = `...(data.tenantId && { tenantId: data.tenantId }),`;
        record(filePath, `${site.method}: soft-scope by data.tenantId`);
      } else if (saveInfo.isSave && saveInfo.varName === varName) {
        scoping = `tenantId: ${varName}.tenantId.toString(),`;
        record(filePath, `${site.method}: hard-scope by ${varName}.tenantId`);
      } else if (headerAcceptsTenantId) {
        scoping = `...(tenantId && { tenantId }),`;
        record(filePath, `${site.method}: soft-scope via tenantId param`);
      } else if (headerAcceptsDataWithTenant) {
        scoping = `...(data.tenantId && { tenantId: data.tenantId }),`;
        record(filePath, `${site.method}: soft-scope by data.tenantId (fallback)`);
      }
    } else if (idToStringSelfMatch) {
      // delete(id: UniqueEntityID, tenantId?: string) — soft-scope by param.
      if (headerAcceptsTenantId) {
        scoping = `...(tenantId && { tenantId }),`;
        record(filePath, `${site.method}: soft-scope by tenantId param`);
      }
    } else if (idSimpleVarMatch) {
      // e.g. where: { id: employeeId } — inside a method where data.tenantId
      // or tenantId is available.
      if (headerAcceptsDataWithTenant) {
        scoping = `...(data.tenantId && { tenantId: data.tenantId }),`;
        record(filePath, `${site.method}: soft-scope via data.tenantId`);
      } else if (headerAcceptsTenantId) {
        scoping = `...(tenantId && { tenantId }),`;
        record(filePath, `${site.method}: soft-scope via tenantId param`);
      }
    } else if (idShorthandMatch) {
      if (headerAcceptsTenantId) {
        scoping = `...(tenantId && { tenantId }),`;
        record(filePath, `${site.method}: shorthand scope by tenantId`);
      }
    }

    if (!scoping) continue;

    next = insertIntoWhereBlock(
      next,
      site.whereOpen,
      site.whereClose,
      scoping,
    );
  }

  return next;
}

// ---------- In-memory transforms ----------

function transformInMemorySource(filePath: string, source: string): string {
  let next = source;

  // Rewrite delete(id) signature AND body (add tenant filter).
  next = next.replace(
    /async\s+delete\s*\(\s*id\s*:\s*(UniqueEntityID|string)\s*\)\s*:\s*Promise<void>\s*\{([\s\S]*?)\n\s{2}\}/g,
    (match, typeName: string, body: string) => {
      if (/\btenantId\b/.test(body)) return match;
      const rewritten = body.replace(
        /findIndex\(\(item\)\s*=>\s*item\.id\.equals\(id\)\)/g,
        'findIndex(\n      (item) =>\n        item.id.equals(id) &&\n        (!tenantId || item.tenantId.toString() === tenantId),\n    )',
      );
      record(filePath, 'in-memory delete: optional tenantId filter');
      return `async delete(id: ${typeName}, tenantId?: string): Promise<void> {${rewritten}\n  }`;
    },
  );

  // Rewrite update(data) body to respect data.tenantId when provided.
  next = next.replace(
    /async\s+update\s*\(\s*data\s*:\s*(Update\w+(?:Schema|Data))\s*\)\s*:\s*Promise<[\s\S]*?>\s*\{\s*([\s\S]*?\n\s*const\s+index\s*=\s*this\.items\.findIndex\(\(item\)\s*=>\s*item\.id\.equals\(data\.id\)\)\s*;?)/g,
    (match, _typeName: string, _body: string) => {
      if (match.includes('data.tenantId')) return match;
      const replaced = match.replace(
        /findIndex\(\(item\)\s*=>\s*item\.id\.equals\(data\.id\)\)/,
        'findIndex(\n      (item) =>\n        item.id.equals(data.id) &&\n        (!data.tenantId || item.tenantId.toString() === data.tenantId),\n    )',
      );
      record(filePath, 'in-memory update: optional tenantId filter');
      return replaced;
    },
  );

  return next;
}

// ---------- Entry point ----------

async function main() {
  const interfaceFiles = (await listFiles(INTERFACE_DIR)).filter(
    (f) =>
      !f.includes('/prisma/') &&
      !f.includes('/in-memory/') &&
      !f.includes('\\prisma\\') &&
      !f.includes('\\in-memory\\'),
  );
  for (const file of interfaceFiles) {
    const original = await readFile(file, 'utf-8');
    const next = transformInterfaceSource(file, original);
    if (next !== original && !DRY_RUN) {
      await writeFile(file, next, 'utf-8');
    }
  }

  const prismaFiles = await listFiles(PRISMA_DIR);
  for (const file of prismaFiles) {
    const original = await readFile(file, 'utf-8');
    const next = transformPrismaSource(file, original);
    if (next !== original && !DRY_RUN) {
      await writeFile(file, next, 'utf-8');
    }
  }

  const inMemoryFiles = await listFiles(IN_MEMORY_DIR);
  for (const file of inMemoryFiles) {
    const original = await readFile(file, 'utf-8');
    const next = transformInMemorySource(file, original);
    if (next !== original && !DRY_RUN) {
      await writeFile(file, next, 'utf-8');
    }
  }

  if (changes.length === 0) {
    console.log('[apply-hr-tenant-scope-writes] No changes needed.');
    return;
  }

  console.log(
    `[apply-hr-tenant-scope-writes] ${DRY_RUN ? 'DRY-RUN — would modify' : 'Modified'} ${changes.length} files.`,
  );
  for (const c of changes.sort((a, b) => a.file.localeCompare(b.file))) {
    console.log(`  ${c.file}`);
    for (const t of c.transforms) {
      console.log(`    - ${t}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
