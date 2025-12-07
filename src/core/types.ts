/**
 * Type definitions for GitHub Actions workflow concepts
 */

/**
 * JobId is a type alias for job identifiers, making the API clearer
 */
export type JobId = string;

export type Runner =
  | "ubuntu-latest"
  | "ubuntu-22.04"
  | "ubuntu-20.04"
  | "windows-latest"
  | "windows-2022"
  | "windows-2019"
  | "macos-latest"
  | "macos-14"
  | "macos-13"
  | string;

export interface IPushTriggerConfig {
  branches?: string[];
  tags?: string[];
  paths?: string[];
  pathsIgnore?: string[];
}

export interface IPullRequestTriggerConfig {
  branches?: string[];
  tags?: string[];
  paths?: string[];
  pathsIgnore?: string[];
  types?: (
    | "opened"
    | "synchronize"
    | "reopened"
    | "closed"
    | "ready_for_review"
    | "labeled"
    | "unlabeled"
  )[];
}

export interface IWorkflowDispatchConfig {
  inputs?: { [key: string]: IWorkflowDispatchInput };
}

export interface IScheduleConfig {
  cron: string;
}

export interface IRepositoryDispatchConfig {
  types?: string[];
}

export interface IWorkflowCallConfig {
  inputs?: { [key: string]: IWorkflowCallInput };
  outputs?: { [key: string]: IWorkflowCallOutput };
  secrets?: string[];
}

export interface IWorkflowTrigger {
  push?: IPushTriggerConfig;
  /** @jsii ignore */
  pull_request?: IPullRequestTriggerConfig;
  /** @jsii ignore */
  workflow_dispatch?: IWorkflowDispatchConfig;
  schedule?: IScheduleConfig[];
  /** @jsii ignore */
  repository_dispatch?: IRepositoryDispatchConfig;
  /** @jsii ignore */
  workflow_call?: IWorkflowCallConfig;
}

// Type alias for backward compatibility
export type WorkflowTrigger = IWorkflowTrigger;

/**
 * @internal
 */
export interface StepWith {
  [key: string]: string | number | boolean;
}

/**
 * @internal
 */
export interface StepEnv {
  [key: string]: string;
}

/**
 * @internal
 */
export interface JobNeeds {
  [jobId: string]: string[];
}

/**
 * @internal
 */
export interface JobOutputs {
  [key: string]: string;
}

/**
 * @internal
 */
export interface JobEnv {
  [key: string]: string;
}

export interface IJobDefaultsRun {
  shell?: string;
  /** @jsii ignore */
  "working-directory"?: string;
}

export interface IJobDefaults {
  run?: IJobDefaultsRun;
}

// Type alias for backward compatibility
export type JobDefaults = IJobDefaults;

export interface IJob {
  /** @jsii ignore */
  "runs-on": Runner | Runner[];
  name?: string;
  needs?: string | string[];
  /** @jsii ignore */
  if?: string;
  steps: IStep[];
  outputs?: { [key: string]: string };
  env?: { [key: string]: string };
  defaults?: IJobDefaults;
  /** @jsii ignore */
  "timeout-minutes"?: number;
  strategy?: IJobStrategy;
  /** @jsii ignore */
  "continue-on-error"?: boolean;
  concurrency?: IJobConcurrency;
}

// Type alias for backward compatibility
export type Job = IJob;

export interface IStepConfig {
  id?: string;
  name?: string;
  uses?: string;
  run?: string;
  with?: { [key: string]: string | number | boolean };
  env?: { [key: string]: string };
  /** @jsii ignore */
  "continue-on-error"?: boolean;
  /** @jsii ignore */
  "timeout-minutes"?: number;
  /** @jsii ignore */
  if?: string;
  /** @jsii ignore */
  "working-directory"?: string;
}

export interface IStep {
  id?: string;
  name?: string;
  uses?: string;
  run?: string;
  with?: { [key: string]: string | number | boolean };
  env?: { [key: string]: string };
  /** @jsii ignore */
  "continue-on-error"?: boolean;
  /** @jsii ignore */
  "timeout-minutes"?: number;
  /** @jsii ignore */
  if?: string;
  /** @jsii ignore */
  "working-directory"?: string;
}

// Type alias for backward compatibility
export type Step = IStep;

/**
 * @internal
 */
export interface WorkflowJobs {
  [jobId: string]: Job;
}

export interface IWorkflowPermissions {
  actions?: "read" | "write" | "none";
  checks?: "read" | "write" | "none";
  contents?: "read" | "write" | "none";
  deployments?: "read" | "write" | "none";
  /** @jsii ignore */
  "id-token"?: "read" | "write" | "none";
  issues?: "read" | "write" | "none";
  discussions?: "read" | "write" | "none";
  packages?: "read" | "write" | "none";
  pages?: "read" | "write" | "none";
  /** @jsii ignore */
  "pull-requests"?: "read" | "write" | "none";
  /** @jsii ignore */
  "repository-projects"?: "read" | "write" | "none";
  /** @jsii ignore */
  "security-events"?: "read" | "write" | "none";
  statuses?: "read" | "write" | "none";
}

export interface IPushTriggerOptions {
  branches?: string[];
  tags?: string[];
  paths?: string[];
  pathsIgnore?: string[];
}

export interface IPullRequestTriggerOptions {
  branches?: string[];
  tags?: string[];
  paths?: string[];
  pathsIgnore?: string[];
  types?: (
    | "opened"
    | "synchronize"
    | "reopened"
    | "closed"
    | "ready_for_review"
    | "labeled"
    | "unlabeled"
  )[];
}

export interface IWorkflowDispatchInput {
  description: string;
  required?: boolean;
  default?: string;
  type?: "string" | "choice" | "boolean" | "number" | "environment";
  options?: string[];
}

export interface IWorkflowCallInput {
  description: string;
  required?: boolean;
  default?: string;
  type?: "string" | "boolean" | "number";
}

export interface IWorkflowCallOutput {
  description: string;
  value: string;
}

export interface IWorkflowCallOptions {
  inputs?: { [key: string]: IWorkflowCallInput };
  outputs?: { [key: string]: IWorkflowCallOutput };
  secrets?: string[];
}

export interface IJobStrategy {
  matrix?: { [key: string]: (string | number)[] };
  /** @jsii ignore */
  "fail-fast"?: boolean;
  /** @jsii ignore */
  "max-parallel"?: number;
}

export interface IJobConcurrency {
  group?: string;
  /** @jsii ignore */
  "cancel-in-progress"?: boolean;
}

export interface IWorkflowConfig {
  name?: string;
  on: IWorkflowTrigger;
  jobs: { [jobId: string]: Job };
  env?: { [key: string]: string };
  defaults?: IJobDefaults;
  permissions?: IWorkflowPermissions;
  /** @jsii ignore */
  "run-name"?: string;
}

// Type alias for backward compatibility
export type WorkflowConfig = IWorkflowConfig;

/**
 * A string that represents a GitHub Actions expression (e.g., "${{ steps.id.outputs.value }}")
 * Using a branded type to prevent automatic widening in union types.
 * @stability stable
 */
export type GitHubExpression = string & { readonly __brand: unique symbol };

/**
 * Helper function to create a GitHubExpression from a string.
 * Use this when you need to pass a GitHub Actions expression to a function parameter.
 *
 * @example
 * ```typescript
 * step.runTypeScript(myFunc, "value", expr("${{ steps.id.outputs.value }}"))
 * ```
 * @stability stable
 */
export function expr(value: string): GitHubExpression {
  return value as GitHubExpression;
}

/**
 * Options for TypeScript step execution
 * @stability stable
 */
export interface ITypeScriptStepOptions {
  /** Node.js version to use (default: "24") */
  nodeVersion?: string;
}

// Type aliases for backward compatibility
export type TypeScriptStepOptions = ITypeScriptStepOptions;

/**
 * Type for TypeScript functions that can be executed in workflow steps.
 * Accepts any function signature to allow users to specify specific input/output types.
 * @internal
 */
// biome-ignore lint/suspicious/noExplicitAny: Intentional use of any to accept any function signature
export type TypeScriptFunction = (...args: any[]) => any;

/**
 * Helper type that allows a parameter type or GitHubExpression.
 * Since GitHubExpression is a branded type, regular strings won't be assignable
 * to non-string parameter types, providing better type safety.
 * @internal
 */
type AllowedArgType<T> = T | GitHubExpression;

/**
 * Helper type to convert a tuple to rest parameters, allowing each element
 * to be the original type or a GitHubExpression (only for string types).
 * @internal
 */
type TupleToRestArgs<T extends readonly unknown[]> = T extends readonly [infer First, ...infer Rest]
  ? [AllowedArgType<First>, ...TupleToRestArgs<Rest>]
  : [];

/**
 * Helper type to validate that arguments match a function's parameter types.
 * Each argument can be the original type or a GitHubExpression.
 * @internal
 */
export type ValidatedTypeScriptArgs<T extends TypeScriptFunction> = TupleToRestArgs<Parameters<T>>;

/**
 * Internal marker for TypeScript function steps
 * @internal
 */
export interface ITypeScriptFunctionStep {
  /** @internal */
  "__ts-actions-type"?: "typescript-function";
  /** @internal */
  "__ts-actions-function"?: TypeScriptFunction;
  /** @internal */
  "__ts-actions-args"?: Array<string | number | boolean | GitHubExpression>;
  /** @internal */
  "__ts-actions-options"?: ITypeScriptStepOptions;
}

// Extend IStep to include internal markers (using intersection types in implementation)
export type IStepWithFunction = IStep & ITypeScriptFunctionStep;
