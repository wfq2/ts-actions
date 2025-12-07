# Types and Interfaces

This page documents the TypeScript types and interfaces used throughout ts-actions.

## Core Types

### `JobId`

Type alias for job identifiers.

```typescript
type JobId = string;
```

### `Runner`

Union type representing valid GitHub Actions runners.

```typescript
type Runner =
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
```

Custom runner labels can also be used as strings.

### `GitHubExpression`

Branded type for GitHub Actions expression strings. Used to provide type safety when passing expressions to functions.

```typescript
type GitHubExpression = string & { readonly __brand: unique symbol };
```

Create expressions using the `expr()` helper function:

```typescript
import { expr } from "ts-actions";

const expression = expr("${{ steps.id.outputs.value }}");
```

## Workflow Types

### `IWorkflowTrigger`

Configuration for workflow triggers.

```typescript
interface IWorkflowTrigger {
  push?: IPushTriggerConfig;
  pull_request?: IPullRequestTriggerConfig;
  workflow_dispatch?: IWorkflowDispatchConfig;
  schedule?: IScheduleConfig[];
  repository_dispatch?: IRepositoryDispatchConfig;
  workflow_call?: IWorkflowCallConfig;
}
```

### `IPushTriggerOptions`

Options for push triggers.

```typescript
interface IPushTriggerOptions {
  branches?: string[];
  tags?: string[];
  paths?: string[];
  pathsIgnore?: string[];
}
```

### `IPullRequestTriggerOptions`

Options for pull request triggers.

```typescript
interface IPullRequestTriggerOptions {
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
```

### `IWorkflowDispatchInput`

Input definition for workflow dispatch.

```typescript
interface IWorkflowDispatchInput {
  description: string;
  required?: boolean;
  default?: string;
  type?: "string" | "choice" | "boolean" | "number" | "environment";
  options?: string[];
}
```

### `IWorkflowCallOptions`

Options for reusable workflows (workflow_call).

```typescript
interface IWorkflowCallOptions {
  inputs?: { [key: string]: IWorkflowCallInput };
  outputs?: { [key: string]: IWorkflowCallOutput };
  secrets?: string[];
}
```

### `IWorkflowPermissions`

Workflow permission settings.

```typescript
interface IWorkflowPermissions {
  actions?: "read" | "write" | "none";
  checks?: "read" | "write" | "none";
  contents?: "read" | "write" | "none";
  deployments?: "read" | "write" | "none";
  "id-token"?: "read" | "write" | "none";
  issues?: "read" | "write" | "none";
  discussions?: "read" | "write" | "none";
  packages?: "read" | "write" | "none";
  pages?: "read" | "write" | "none";
  "pull-requests"?: "read" | "write" | "none";
  "repository-projects"?: "read" | "write" | "none";
  "security-events"?: "read" | "write" | "none";
  statuses?: "read" | "write" | "none";
}
```

### `IWorkflowConfig`

Complete workflow configuration (output of `workflow.toJSON()`).

```typescript
interface IWorkflowConfig {
  name?: string;
  on: IWorkflowTrigger;
  jobs: { [jobId: string]: Job };
  env?: { [key: string]: string };
  defaults?: IJobDefaults;
  permissions?: IWorkflowPermissions;
  "run-name"?: string;
}
```

## Job Types

### `IJob`

Job configuration.

```typescript
interface IJob {
  "runs-on": Runner | Runner[];
  name?: string;
  needs?: string | string[];
  if?: string;
  steps: IStep[];
  outputs?: { [key: string]: string };
  env?: { [key: string]: string };
  defaults?: IJobDefaults;
  "timeout-minutes"?: number;
  strategy?: IJobStrategy;
  "continue-on-error"?: boolean;
  concurrency?: IJobConcurrency;
}
```

### `IJobDefaults`

Default settings for job steps.

```typescript
interface IJobDefaults {
  run?: {
    shell?: string;
    "working-directory"?: string;
  };
}
```

### `IJobStrategy`

Build matrix strategy configuration.

```typescript
interface IJobStrategy {
  matrix?: { [key: string]: (string | number)[] };
  "fail-fast"?: boolean;
  "max-parallel"?: number;
}
```

### `IJobConcurrency`

Job concurrency settings.

```typescript
interface IJobConcurrency {
  group?: string;
  "cancel-in-progress"?: boolean;
}
```

## Step Types

### `IStep`

Step configuration.

```typescript
interface IStep {
  id?: string;
  name?: string;
  uses?: string;
  run?: string;
  with?: { [key: string]: string | number | boolean };
  env?: { [key: string]: string };
  "continue-on-error"?: boolean;
  "timeout-minutes"?: number;
  if?: string;
  "working-directory"?: string;
}
```

### `ITypeScriptStepOptions`

Options for TypeScript function steps.

```typescript
interface ITypeScriptStepOptions {
  nodeVersion?: string; // Default: "24"
}
```

### `TypeScriptFunction`

Type for TypeScript functions that can be executed in workflow steps.

```typescript
type TypeScriptFunction = (...args: any[]) => any;
```

## Helper Types

### `JobOutputsRef<TOutputs>`

Type-safe reference to job outputs.

```typescript
type JobOutputsRef<TOutputs extends Record<string, unknown>> = {
  id: JobId;
  outputs: {
    [K in keyof TOutputs]: string;
  };
};
```

### `StepOutputs<TOutputs>`

Type-safe reference to step outputs.

```typescript
type StepOutputs<TOutputs extends Record<string, unknown>> = {
  outputs: {
    [K in keyof TOutputs]: string;
  };
};
```

## Type Aliases

For backward compatibility, several interfaces have type aliases:

```typescript
type WorkflowConfig = IWorkflowConfig;
type WorkflowTrigger = IWorkflowTrigger;
type Job = IJob;
type Step = IStep;
type JobDefaults = IJobDefaults;
type TypeScriptStepOptions = ITypeScriptStepOptions;
```

## Using Types in Your Code

Most types are exported from the main package and can be imported:

```typescript
import type {
  IWorkflowConfig,
  IJob,
  IStep,
  Runner,
  JobId
} from "ts-actions";
```

However, most users don't need to import these types directly - the classes handle them internally. Type imports are mainly useful for:
- Type annotations in custom functions
- Creating typed wrappers or utilities
- Advanced type manipulation

