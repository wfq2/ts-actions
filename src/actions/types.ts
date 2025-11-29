/**
 * Types for GitHub Actions import system
 */

export interface ActionReference {
  owner: string;
  repo: string;
  version: string;
  full: string; // Original string like "actions/checkout@v4"
}

export interface ActionInput {
  description: string;
  required?: boolean;
  default?: string | number | boolean;
  type?: "string" | "number" | "boolean" | "choice" | "environment";
  options?: string[];
}

export interface ActionOutput {
  description: string;
  value?: string;
}

export interface ActionMetadata {
  name: string;
  description: string;
  inputs?: Record<string, ActionInput>;
  outputs?: Record<string, ActionOutput>;
  runs: {
    using: string;
    main?: string;
    pre?: string;
    post?: string;
  };
}

export interface ImportedAction {
  reference: ActionReference;
  metadata: ActionMetadata;
  typeDefinition: string; // Generated TypeScript type definition
}
