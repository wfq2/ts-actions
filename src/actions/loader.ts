import { existsSync } from "node:fs";
import { join } from "node:path";
import { getRegistryEntry, loadImportedActionMetadata } from "./storage.js";
import type { ActionMetadata, ActionReference } from "./types.js";

/**
 * Load type information for an imported action at runtime
 * This is used for type inference in the Step class
 */
export function loadActionType(reference: ActionReference): ActionMetadata | null {
  return loadImportedActionMetadata(reference);
}

/**
 * Check if an action has been imported and has type definitions
 */
export function hasActionType(reference: ActionReference): boolean {
  const entry = getRegistryEntry(reference);
  if (!entry) {
    return false;
  }

  const metadataPath = join(
    ".ts-actions/imports",
    reference.owner,
    reference.repo,
    `${reference.version}.json`
  );

  return existsSync(metadataPath);
}

/**
 * Get the input keys for an imported action
 * Returns null if the action is not imported
 */
export function getActionInputKeys(reference: ActionReference): string[] | null {
  const metadata = loadActionType(reference);
  if (!metadata?.inputs) {
    return null;
  }

  return Object.keys(metadata.inputs);
}

/**
 * Get the type information for a specific input
 */
export function getActionInputType(
  reference: ActionReference,
  inputKey: string
): "string" | "number" | "boolean" | null {
  const metadata = loadActionType(reference);
  if (!metadata?.inputs) {
    return null;
  }

  const input = metadata.inputs[inputKey];
  if (!input) {
    return null;
  }

  if (input.type) {
    switch (input.type) {
      case "boolean":
        return "boolean";
      case "number":
        return "number";
      default:
        return "string";
    }
  }

  // Infer from default value
  if (input.default !== undefined) {
    if (typeof input.default === "boolean") {
      return "boolean";
    }
    if (typeof input.default === "number") {
      return "number";
    }
    return "string";
  }

  return "string";
}
