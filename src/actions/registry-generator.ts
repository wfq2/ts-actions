import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadRegistry } from "./storage.js";

const IMPORTS_DIR = ".ts-actions/imports";
const REGISTRY_TYPE_FILE = join(IMPORTS_DIR, "registry.d.ts");

/**
 * Generate TypeScript type registry file that maps action references to their input types
 */
export function generateTypeRegistry(): void {
  const registry = loadRegistry();
  const typeImports: string[] = [];
  const classImports: string[] = [];
  const typeEntries: string[] = [];
  const classExports: string[] = [];

  for (const entry of registry.actions) {
    // Use relative path from registry file
    const relativePath = `./${entry.owner}/${entry.repo}/${entry.version}.js`;

    typeImports.push(`import type { ${entry.typeName}Inputs } from "${relativePath}";`);
    classImports.push(`export { ${entry.typeName} } from "${relativePath}";`);

    typeEntries.push(`  "${entry.full}": ${entry.typeName}Inputs;`);
    classExports.push(`export { ${entry.typeName} };`);
  }

  const registryContent = `/**
 * Type registry for imported GitHub Actions
 * This file is auto-generated - DO NOT EDIT MANUALLY
 * 
 * This registry maps action references to their input types for static type checking.
 */

${typeImports.join("\n")}

export type ActionInputsRegistry = {
${typeEntries.length > 0 ? typeEntries.join("\n") : "  // No actions imported yet"}
};
`;

  const indexContent = `/**
 * Action classes for imported GitHub Actions
 * This file is auto-generated - DO NOT EDIT MANUALLY
 * 
 * Re-export all action classes for convenient importing.
 */

${classImports.length > 0 ? classImports.join("\n") : "// No actions imported yet"}
`;

  // Ensure directory exists
  const dir = join(IMPORTS_DIR);
  if (!existsSync(dir)) {
    return; // Nothing to generate if imports dir doesn't exist
  }

  writeFileSync(REGISTRY_TYPE_FILE, registryContent, "utf-8");

  // Also generate an index file that exports all action classes
  const indexFile = join(IMPORTS_DIR, "index.ts");
  writeFileSync(indexFile, indexContent, "utf-8");
}
