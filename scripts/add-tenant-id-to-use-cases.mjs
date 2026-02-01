/**
 * Script to add tenantId parameter to all tenant-scoped use cases.
 * Phase 12 of multi-tenant implementation.
 *
 * This script:
 * 1. Reads each use case file
 * 2. Adds tenantId: string to the request interface
 * 3. Adds const tenantEntityId = new UniqueEntityID(tenantId) at start of execute()
 * 4. Passes tenantEntityId as first arg to repository calls
 * 5. Adds tenantId to entity creation calls
 * 6. Ensures UniqueEntityID import exists
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

const BASE_DIR = join(process.cwd(), 'src', 'use-cases');

// Directories to SKIP (global, already done, or not tenant-scoped)
const SKIP_DIRS = ['core', 'admin'];

// Skip factory files, spec files, index files
function shouldSkipFile(filePath) {
  const name = basename(filePath);
  if (name.endsWith('.spec.ts')) return true;
  if (name.startsWith('make-')) return true;
  if (name === 'index.ts') return true;
  if (name === 'factories.ts') return true;
  if (filePath.includes('factories/') || filePath.includes('factories\\'))
    return true;
  return false;
}

// Recursively get all .ts files in a directory
function getFilesRecursive(dir) {
  const files = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        // Skip excluded directories at the top level
        if (dir === BASE_DIR && SKIP_DIRS.includes(entry)) continue;
        files.push(...getFilesRecursive(fullPath));
      } else if (entry.endsWith('.ts') && !shouldSkipFile(fullPath)) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Directory might not exist
  }
  return files;
}

function addTenantIdToFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  const originalContent = content;
  const fileName = basename(filePath);

  // Skip if already has tenantId in a request interface
  if (
    content.includes('tenantId: string') ||
    content.includes('tenantId:string')
  ) {
    console.log(`  SKIP (already has tenantId): ${fileName}`);
    return false;
  }

  // Skip if the file doesn't have an interface with a request pattern or a class with execute
  if (!content.includes('async execute')) {
    console.log(`  SKIP (no execute method): ${fileName}`);
    return false;
  }

  // Step 1: Ensure UniqueEntityID import exists
  if (!content.includes("from '@/entities/domain/unique-entity-id'")) {
    // Add import at the top, after the last import line
    const importMatch = content.match(/^(import .+\n)+/m);
    if (importMatch) {
      const lastImportEnd = importMatch.index + importMatch[0].length;
      content =
        content.slice(0, lastImportEnd) +
        "import { UniqueEntityID } from '@/entities/domain/unique-entity-id';\n" +
        content.slice(lastImportEnd);
    } else {
      // No imports found, add at top
      content =
        "import { UniqueEntityID } from '@/entities/domain/unique-entity-id';\n\n" +
        content;
    }
  }

  // Step 2: Find the Request interface and add tenantId
  // Patterns to match:
  // - interface XxxUseCaseRequest { ... }
  // - export interface XxxUseCaseRequest { ... }
  // - interface XxxRequest { ... }
  // - export interface XxxInput { ... }

  const requestInterfaceRegex =
    /((?:export\s+)?interface\s+\w+(?:Request|Input)\s*\{)/;
  const requestMatch = content.match(requestInterfaceRegex);

  if (requestMatch) {
    // Add tenantId as the first field in the interface
    const insertPoint = requestMatch.index + requestMatch[0].length;
    content =
      content.slice(0, insertPoint) +
      '\n  tenantId: string;' +
      content.slice(insertPoint);
  } else {
    // No request interface found - this might be a use case with no request params
    // or with inline destructuring. Check if execute takes no params or just a simple type

    // Check for execute() with no params - need to add a request interface
    const noParamExecute = content.match(/async execute\(\s*\):/);
    if (noParamExecute) {
      // This is a list use case with no params. We need to:
      // 1. Create a request interface
      // 2. Update the execute signature to accept it

      // Find the class name
      const classMatch = content.match(/export class (\w+)/);
      if (!classMatch) {
        console.log(`  SKIP (can't find class): ${fileName}`);
        return false;
      }

      const className = classMatch[1];
      // Derive interface name: e.g. ListProductsUseCase -> ListProductsUseCaseRequest
      const interfaceName = className + 'Request';

      // Find the Response interface or class declaration to insert before
      const classIndex = content.indexOf(`export class ${className}`);

      // Insert the request interface before the class
      const interfaceDecl = `interface ${interfaceName} {\n  tenantId: string;\n}\n\n`;
      content =
        content.slice(0, classIndex) +
        interfaceDecl +
        content.slice(classIndex);

      // Update execute() to accept the request
      // Handle different patterns
      content = content.replace(
        /async execute\(\s*\):/,
        `async execute(\n    request: ${interfaceName},\n  ):`,
      );

      // Add destructuring at the start of execute method body
      const executeBodyRegex = new RegExp(
        `async execute\\([^)]*${interfaceName}[^)]*\\)[^{]*\\{`,
      );
      const executeBodyMatch = content.match(executeBodyRegex);
      if (executeBodyMatch) {
        const bodyStart = executeBodyMatch.index + executeBodyMatch[0].length;
        content =
          content.slice(0, bodyStart) +
          '\n    const { tenantId } = request;\n    const tenantEntityId = new UniqueEntityID(tenantId);\n' +
          content.slice(bodyStart);
      }
    } else {
      // Check for execute with default parameter = {}
      const defaultParamExecute = content.match(
        /async execute\(\s*(?:input|request)\s*:\s*\w+\s*=\s*\{\}/,
      );
      if (defaultParamExecute) {
        // Add tenantId to the existing request interface or create one
        // This is tricky - these have inline interfaces usually declared above
        // Let's try a broader search
        const broadInterfaceRegex = /(interface\s+\w+\s*\{)/;
        const broadMatch = content.match(broadInterfaceRegex);
        if (broadMatch) {
          const insertPoint = broadMatch.index + broadMatch[0].length;
          content =
            content.slice(0, insertPoint) +
            '\n  tenantId: string;' +
            content.slice(insertPoint);
        }
      } else {
        console.log(`  SKIP (no request interface pattern): ${fileName}`);
        return false;
      }
    }
  }

  // Step 3: Add tenantEntityId extraction at the beginning of execute()
  // Find the execute method body and add tenantEntityId conversion

  // Handle various destructuring patterns in execute():

  // Pattern 1: async execute(request: XxxRequest) { const { ... } = request;
  // => Add tenantId to destructuring, add tenantEntityId after

  // Pattern 2: async execute({ field1, field2 }: XxxRequest) {
  // => Add tenantId to destructuring, add tenantEntityId after

  // Pattern 3: async execute(input: XxxInput) { ... input.field ...
  // => Add tenantEntityId = new UniqueEntityID(input.tenantId) at start

  // Let's check if we already added the tenantEntityId
  if (content.includes('tenantEntityId')) {
    // Already handled in the no-param case above, or already present
  } else {
    // Pattern A: Destructuring from named param: const { ... } = request;
    const namedParamDestructure = content.match(
      /async execute\(\s*(?:request|input)\s*:\s*\w+[^)]*\)\s*[^{]*\{([^}]*?)const\s*\{([^}]*)\}\s*=\s*(?:request|input);/s,
    );
    if (namedParamDestructure) {
      const paramName =
        content.match(/async execute\(\s*(request|input)\s*:/)?.[1] ||
        'request';
      const existingFields = namedParamDestructure[2];

      // Add tenantId to destructuring
      content = content.replace(
        new RegExp(
          `const\\s*\\{${escapeRegExp(existingFields)}\\}\\s*=\\s*${paramName};`,
        ),
        `const {tenantId,${existingFields}} = ${paramName};\n    const tenantEntityId = new UniqueEntityID(tenantId);`,
      );
    }
    // Pattern B: Inline destructuring: async execute({ field1, field2 }: XxxRequest)
    else {
      const inlineDestructure = content.match(
        /async execute\(\s*\{([^}]*)\}\s*:\s*(\w+)/s,
      );
      if (inlineDestructure) {
        const existingFields = inlineDestructure[1];
        const typeName = inlineDestructure[2];

        // Add tenantId to the destructured params
        content = content.replace(
          new RegExp(
            `async execute\\(\\s*\\{${escapeRegExp(existingFields)}\\}\\s*:\\s*${typeName}`,
          ),
          `async execute({\n    tenantId,${existingFields}}: ${typeName}`,
        );

        // Add tenantEntityId after the opening brace of execute body
        const executeBodyStart = content.match(
          /async execute\([^)]*\)[^{]*\{/s,
        );
        if (executeBodyStart) {
          const bodyStart = executeBodyStart.index + executeBodyStart[0].length;
          content =
            content.slice(0, bodyStart) +
            '\n    const tenantEntityId = new UniqueEntityID(tenantId);\n' +
            content.slice(bodyStart);
        }
      }
      // Pattern C: Uses input.field pattern (no destructuring)
      else {
        const inputDotPattern = content.match(
          /async execute\(\s*(input|request)\s*:\s*\w+[^)]*\)\s*[^{]*\{/s,
        );
        if (inputDotPattern) {
          const paramName = inputDotPattern[1];
          const bodyStart = inputDotPattern.index + inputDotPattern[0].length;
          content =
            content.slice(0, bodyStart) +
            `\n    const tenantEntityId = new UniqueEntityID(${paramName}.tenantId);\n` +
            content.slice(bodyStart);
        }
      }
    }
  }

  // Step 4: Pass tenantEntityId to repository method calls
  // This is the most complex part. We need to add tenantEntityId as first arg to:
  // - findById, findByName, findBySlug, findByCNPJ, findMany, findManyActive
  // - findByCode, findByOrderNumber, findBySKU, findByBarcode, findByEANCode, findByUPCCode
  // - findByEmail, findManyByItem, findManyByUser, findManyByType, etc.
  // - create, update, delete, save
  // - All repository method calls

  // Actually, for Phase 12, we just need to add tenantEntityId to the execute body
  // and pass it to repository calls. The repository signatures will be updated in a separate phase.
  // For now, we focus on JUST adding tenantId to the request interface and creating tenantEntityId.

  // The repository interfaces haven't necessarily been updated yet, so we should NOT
  // modify the repository calls yet. We just need the use case to accept and extract tenantId.

  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`  MODIFIED: ${fileName}`);
    return true;
  }

  console.log(`  NO CHANGE: ${fileName}`);
  return false;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main execution
console.log(
  '=== Phase 12: Adding tenantId to all tenant-scoped use cases ===\n',
);

const allFiles = getFilesRecursive(BASE_DIR);
console.log(`Found ${allFiles.length} use case files to process.\n`);

let modified = 0;
let skipped = 0;
let errors = 0;

for (const file of allFiles) {
  const relative = file.replace(BASE_DIR, '').replace(/\\/g, '/');
  console.log(`Processing: ${relative}`);
  try {
    const wasModified = addTenantIdToFile(file);
    if (wasModified) modified++;
    else skipped++;
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    errors++;
  }
}

console.log(`\n=== Summary ===`);
console.log(`Modified: ${modified}`);
console.log(`Skipped: ${skipped}`);
console.log(`Errors: ${errors}`);
console.log(`Total: ${allFiles.length}`);
