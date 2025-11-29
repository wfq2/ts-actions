import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { generateActionTypeName, generateTypeDefinition } from "./generator.js";
import { generateTypeRegistry } from "./registry-generator.js";
import type { ActionMetadata, ActionReference } from "./types.js";

const IMPORTS_DIR = ".ts-actions/imports";
const REGISTRY_FILE = join(IMPORTS_DIR, "registry.json");

export interface RegistryEntry {
  owner: string;
  repo: string;
  version: string;
  full: string;
  typeName: string;
  importedAt: string;
}

export interface Registry {
  actions: RegistryEntry[];
}

/**
 * Get the path to the type definition file for an action
 */
export function getTypeFilePath(reference: ActionReference): string {
  return join(IMPORTS_DIR, reference.owner, reference.repo, `${reference.version}.ts`);
}

/**
 * Get the path to the metadata cache file for an action
 */
export function getMetadataFilePath(reference: ActionReference): string {
  return join(IMPORTS_DIR, reference.owner, reference.repo, `${reference.version}.json`);
}

/**
 * Ensure the imports directory structure exists
 */
export function ensureImportsDirectory(reference: ActionReference): void {
  const typeFilePath = getTypeFilePath(reference);
  const dir = dirname(typeFilePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load the registry
 */
export function loadRegistry(): Registry {
  if (!existsSync(REGISTRY_FILE)) {
    return { actions: [] };
  }

  try {
    const content = readFileSync(REGISTRY_FILE, "utf-8");
    return JSON.parse(content) as Registry;
  } catch (error) {
    console.warn("Failed to load registry, starting with empty registry:", error);
    return { actions: [] };
  }
}

/**
 * Save the registry
 */
export function saveRegistry(registry: Registry): void {
  const dir = dirname(REGISTRY_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), "utf-8");
}

/**
 * Check if an action is already imported
 */
export function isActionImported(reference: ActionReference): boolean {
  const registry = loadRegistry();
  return registry.actions.some(
    (entry) =>
      entry.owner === reference.owner &&
      entry.repo === reference.repo &&
      entry.version === reference.version
  );
}

/**
 * Save an imported action to disk
 */
export function saveImportedAction(reference: ActionReference, metadata: ActionMetadata): void {
  ensureImportsDirectory(reference);

  const typeName = generateActionTypeName(reference.owner, reference.repo, reference.version);
  const typeDefinition = generateTypeDefinition(metadata, typeName, reference.full);

  // Save type definition
  const typeFilePath = getTypeFilePath(reference);
  writeFileSync(typeFilePath, typeDefinition, "utf-8");

  // Save metadata cache
  const metadataFilePath = getMetadataFilePath(reference);
  writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2), "utf-8");

  // Update registry
  const registry = loadRegistry();
  const existingIndex = registry.actions.findIndex(
    (entry) =>
      entry.owner === reference.owner &&
      entry.repo === reference.repo &&
      entry.version === reference.version
  );

  const entry: RegistryEntry = {
    owner: reference.owner,
    repo: reference.repo,
    version: reference.version,
    full: reference.full,
    typeName,
    importedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    registry.actions[existingIndex] = entry;
  } else {
    registry.actions.push(entry);
  }

  saveRegistry(registry);

  // Generate type registry for static type checking
  generateTypeRegistry();
}

/**
 * Load an imported action's metadata
 */
export function loadImportedActionMetadata(reference: ActionReference): ActionMetadata | null {
  const metadataFilePath = getMetadataFilePath(reference);
  if (!existsSync(metadataFilePath)) {
    return null;
  }

  try {
    const content = readFileSync(metadataFilePath, "utf-8");
    return JSON.parse(content) as ActionMetadata;
  } catch (error) {
    console.warn(`Failed to load metadata for ${reference.full}:`, error);
    return null;
  }
}

/**
 * Get registry entry for an action
 */
export function getRegistryEntry(reference: ActionReference): RegistryEntry | null {
  const registry = loadRegistry();
  return (
    registry.actions.find(
      (entry) =>
        entry.owner === reference.owner &&
        entry.repo === reference.repo &&
        entry.version === reference.version
    ) || null
  );
}
