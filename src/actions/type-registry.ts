/**
 * Type registry for imported GitHub Actions
 * This file is auto-generated - DO NOT EDIT MANUALLY
 */

// Import all action types
// These imports will be added automatically when actions are imported

/**
 * Registry mapping action references to their input types
 */
export type ActionInputsRegistry = {
  // This will be populated by the import command
  [key: string]: Record<string, string | number | boolean>;
};

/**
 * Helper type to get input type for an action
 */
export type ActionInputs<TAction extends string> = TAction extends keyof ActionInputsRegistry
  ? ActionInputsRegistry[TAction]
  : Record<string, string | number | boolean>;
