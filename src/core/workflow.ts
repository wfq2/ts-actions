import { Job } from "./job.js";
import type { WorkflowConfig, WorkflowTrigger } from "./types.js";

export class Workflow {
  private config: WorkflowConfig;

  constructor(name?: string) {
    this.config = {
      name,
      on: {},
      jobs: {},
    };
  }

  name(name: string): this {
    this.config.name = name;
    return this;
  }

  on(triggers: WorkflowTrigger): this {
    this.config.on = { ...this.config.on, ...triggers };
    return this;
  }

  onPush(options?: {
    branches?: string[];
    tags?: string[];
    paths?: string[];
    pathsIgnore?: string[];
  }): this {
    this.config.on.push = options || {};
    return this;
  }

  onPullRequest(options?: {
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
  }): this {
    this.config.on.pull_request = options || {};
    return this;
  }

  onWorkflowDispatch(
    inputs?: Record<
      string,
      {
        description: string;
        required?: boolean;
        default?: string;
        type?: "string" | "choice" | "boolean" | "number" | "environment";
        options?: string[];
      }
    >
  ): this {
    this.config.on.workflow_dispatch = { inputs };
    return this;
  }

  onSchedule(cron: string): this {
    if (!this.config.on.schedule) {
      this.config.on.schedule = [];
    }
    this.config.on.schedule.push({ cron });
    return this;
  }

  onRepositoryDispatch(types?: string[]): this {
    this.config.on.repository_dispatch = { types };
    return this;
  }

  onWorkflowCall(options?: {
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
  }): this {
    this.config.on.workflow_call = options;
    return this;
  }

  addJob(jobId: string, job: Job | ((job: Job) => Job)): this {
    if (job instanceof Job) {
      this.config.jobs[jobId] = job.toJSON();
    } else {
      const jobInstance = new Job("ubuntu-latest");
      this.config.jobs[jobId] = job(jobInstance).toJSON();
    }
    return this;
  }

  env(variables: Record<string, string>): this {
    this.config.env = { ...this.config.env, ...variables };
    return this;
  }

  defaults(defaults: {
    run?: {
      shell?: string;
      "working-directory"?: string;
    };
  }): this {
    this.config.defaults = defaults;
    return this;
  }

  permissions(permissions: {
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
  }): this {
    this.config.permissions = permissions;
    return this;
  }

  runName(name: string): this {
    this.config["run-name"] = name;
    return this;
  }

  toJSON(): WorkflowConfig {
    return { ...this.config };
  }
}
