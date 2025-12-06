import { Job } from "./job.js";
import type {
  IJobDefaults,
  IPullRequestTriggerOptions,
  IPushTriggerOptions,
  IWorkflowCallOptions,
  IWorkflowConfig,
  IWorkflowDispatchInput,
  IWorkflowPermissions,
  IWorkflowTrigger,
  JobId,
} from "./types.js";

// Type aliases for backward compatibility
export type WorkflowConfig = IWorkflowConfig;
export type WorkflowTrigger = IWorkflowTrigger;

/**
 * A GitHub Actions workflow definition.
 *
 * @stability stable
 */
export class Workflow {
  private config: IWorkflowConfig;

  /**
   * Creates a new workflow.
   *
   * @param name - Optional workflow name
   * @stability stable
   */
  constructor(name?: string) {
    this.config = {
      name,
      on: {},
      jobs: {},
    };
  }

  /**
   * Sets the workflow name.
   *
   * @param name - The workflow name
   * @stability stable
   */
  name(name: string): this {
    this.config.name = name;
    return this;
  }

  /**
   * Sets workflow triggers.
   *
   * @param triggers - The workflow triggers
   * @stability stable
   */
  on(triggers: IWorkflowTrigger): this {
    this.config.on = { ...this.config.on, ...triggers };
    return this;
  }

  /**
   * Adds a push trigger to the workflow.
   *
   * @param options - Push trigger options
   * @stability stable
   */
  onPush(options?: IPushTriggerOptions): this {
    this.config.on.push = options || {};
    return this;
  }

  /**
   * Adds a pull request trigger to the workflow.
   *
   * @param options - Pull request trigger options
   * @stability stable
   */
  onPullRequest(options?: IPullRequestTriggerOptions): this {
    this.config.on.pull_request = options || {};
    return this;
  }

  /**
   * Adds a workflow dispatch trigger to the workflow.
   *
   * @param inputs - Optional workflow dispatch inputs
   * @stability stable
   */
  onWorkflowDispatch(inputs?: { [key: string]: IWorkflowDispatchInput }): this {
    this.config.on.workflow_dispatch = { inputs };
    return this;
  }

  /**
   * Adds a schedule trigger to the workflow.
   *
   * @param cron - Cron expression for the schedule
   * @stability stable
   */
  onSchedule(cron: string): this {
    if (!this.config.on.schedule) {
      this.config.on.schedule = [];
    }
    this.config.on.schedule.push({ cron });
    return this;
  }

  /**
   * Adds a repository dispatch trigger to the workflow.
   *
   * @param types - Optional event types
   * @stability stable
   */
  onRepositoryDispatch(types?: string[]): this {
    this.config.on.repository_dispatch = { types };
    return this;
  }

  /**
   * Adds a workflow call trigger to the workflow.
   *
   * @param options - Workflow call options
   * @stability stable
   */
  onWorkflowCall(options?: IWorkflowCallOptions): this {
    this.config.on.workflow_call = options;
    return this;
  }

  /**
   * Adds a job to the workflow.
   *
   * @param jobId - The job identifier
   * @param job - The job instance
   * @stability stable
   */
  addJob<TOutputs extends Record<string, string>>(jobId: JobId, job: Job<TOutputs>): this;
  /**
   * Adds a job to the workflow.
   *
   * @param jobId - The job identifier
   * @param jobFn - A function that configures a job
   * @stability stable
   */
  addJob<TOutputs extends Record<string, string>>(
    jobId: JobId,
    jobFn: (job: Job<Record<string, never>>) => Job<TOutputs>
  ): this;
  addJob<TOutputs extends Record<string, string>>(
    jobId: JobId,
    jobOrFn: Job<TOutputs> | ((job: Job<Record<string, never>>) => Job<TOutputs>)
  ): this {
    if (jobOrFn instanceof Job) {
      jobOrFn.id = jobId;
      this.config.jobs[jobId] = jobOrFn.toJSON();
    } else {
      const jobInstance = new Job<Record<string, never>>("ubuntu-latest");
      jobInstance.id = jobId;
      this.config.jobs[jobId] = jobOrFn(jobInstance).toJSON();
    }
    return this;
  }

  /**
   * Sets environment variables for the workflow.
   *
   * @param variables - Environment variables
   * @stability stable
   */
  env(variables: { [key: string]: string }): this {
    this.config.env = { ...this.config.env, ...variables };
    return this;
  }

  /**
   * Sets default values for the workflow.
   *
   * @param defaults - Default values
   * @stability stable
   */
  defaults(defaults: IJobDefaults): this {
    this.config.defaults = defaults;
    return this;
  }

  /**
   * Sets permissions for the workflow.
   *
   * @param permissions - Permission settings
   * @stability stable
   */
  permissions(permissions: IWorkflowPermissions): this {
    this.config.permissions = permissions;
    return this;
  }

  /**
   * Sets the run name for the workflow.
   *
   * @param name - The run name
   * @stability stable
   */
  runName(name: string): this {
    this.config["run-name"] = name;
    return this;
  }

  /**
   * Converts the workflow to JSON configuration.
   *
   * @returns The workflow configuration
   * @stability stable
   */
  toJSON(): IWorkflowConfig {
    return { ...this.config };
  }
}
