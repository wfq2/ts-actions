/**
 * Type definitions for GitHub Actions workflow concepts
 */

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

export interface WorkflowTrigger {
  push?: {
    branches?: string[];
    tags?: string[];
    paths?: string[];
    pathsIgnore?: string[];
  };
  pull_request?: {
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
  };
  workflow_dispatch?: {
    inputs?: Record<
      string,
      {
        description: string;
        required?: boolean;
        default?: string;
        type?: "string" | "choice" | "boolean" | "number" | "environment";
        options?: string[];
      }
    >;
  };
  schedule?: Array<{
    cron: string;
  }>;
  repository_dispatch?: {
    types?: string[];
  };
  workflow_call?: {
    inputs?: Record<
      string,
      {
        description: string;
        required?: boolean;
        default?: string;
        type?: "string" | "boolean" | "number";
      }
    >;
    outputs?: Record<
      string,
      {
        description: string;
        value: string;
      }
    >;
    secrets?: string[];
  };
}

export interface StepWith {
  [key: string]: string | number | boolean;
}

export interface StepEnv {
  [key: string]: string;
}

export interface Step {
  id?: string;
  name?: string;
  uses?: string;
  run?: string;
  with?: StepWith;
  env?: StepEnv;
  "continue-on-error"?: boolean;
  "timeout-minutes"?: number;
  if?: string;
  "working-directory"?: string;
}

export interface JobNeeds {
  [jobId: string]: string[];
}

export interface JobOutputs {
  [key: string]: string;
}

export interface JobEnv {
  [key: string]: string;
}

export interface JobDefaults {
  run?: {
    shell?: string;
    "working-directory"?: string;
  };
}

export interface Job {
  "runs-on": Runner | Runner[];
  needs?: string | string[];
  if?: string;
  steps: Step[];
  outputs?: JobOutputs;
  env?: JobEnv;
  defaults?: JobDefaults;
  "timeout-minutes"?: number;
  strategy?: {
    matrix?: Record<string, (string | number)[]>;
    "fail-fast"?: boolean;
    "max-parallel"?: number;
  };
  "continue-on-error"?: boolean;
  concurrency?: {
    group?: string;
    "cancel-in-progress"?: boolean;
  };
}

export interface WorkflowJobs {
  [jobId: string]: Job;
}

export interface WorkflowConfig {
  name?: string;
  on: WorkflowTrigger;
  jobs: WorkflowJobs;
  env?: Record<string, string>;
  defaults?: {
    run?: {
      shell?: string;
      "working-directory"?: string;
    };
  };
  permissions?: {
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
  };
  "run-name"?: string;
}
