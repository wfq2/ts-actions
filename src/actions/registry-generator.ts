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
  const imports: string[] = [];
  const entries: string[] = [];

  for (const entry of registry.actions) {
    // Use relative path from registry file
    const relativePath = `./${entry.owner}/${entry.repo}/${entry.version}.js`;

    imports.push(`import type { ${entry.typeName}Inputs } from "${relativePath}";`);

    entries.push(`  "${entry.full}": ${entry.typeName}Inputs;`);
  }

  const registryContent = `/**
 * Type registry for imported GitHub Actions
 * This file is auto-generated - DO NOT EDIT MANUALLY
 * 
 * This registry maps action references to their input types for static type checking.
 */

${imports.join("\n")}

export type ActionInputsRegistry = {
${entries.length > 0 ? entries.join("\n") : "  // No actions imported yet"}
};
`;

  // Ensure directory exists
  const dir = join(IMPORTS_DIR);
  if (!existsSync(dir)) {
    return; // Nothing to generate if imports dir doesn't exist
  }

  writeFileSync(REGISTRY_TYPE_FILE, registryContent, "utf-8");
}
