import type { JobOutputsRef } from "./job-outputs.js";
import { Step } from "./step.js";
import type { IJob, IJobConcurrency, IJobDefaults, IJobStrategy, JobId, Runner } from "./types.js";

/**
 * A GitHub Actions job definition.
 *
 * @stability stable
 */
export class Job<TOutputs extends Record<string, string> = Record<string, never>> {
  private job: IJob;
  private stepInstances: Step[] = []; // Store Step instances for processing
  public id?: JobId;

  /**
   * Creates a new job.
   *
   * @param runsOn - The runner(s) to use for this job
   * @stability stable
   */
  constructor(runsOn: Runner | Runner[]) {
    this.job = {
      "runs-on": runsOn,
      steps: [],
    };
  }

  /**
   * Sets the runner(s) for this job.
   *
   * @param runner - The runner(s) to use
   * @stability stable
   */
  runsOn(runner: Runner | Runner[]): this {
    this.job["runs-on"] = runner;
    return this;
  }

  /**
   * Sets job dependencies.
   *
   * @param dependencies - Job reference(s) that this job depends on (created using needs())
   * @stability stable
   * @jsii ignore
   */
  needs(
    dependencies: JobOutputsRef<Record<string, unknown>> | JobOutputsRef<Record<string, unknown>>[]
  ): this {
    // Handle JobOutputsRef (result of needs() function)
    if (Array.isArray(dependencies)) {
      this.job.needs = dependencies.map((dep) => {
        if (dep && typeof dep === "object" && "id" in dep) {
          return (dep as JobOutputsRef<Record<string, unknown>>).id;
        }
        throw new Error(
          "needs() only accepts job references created using the needs() function. Use needs(job) to create a reference."
        );
      });
    } else if (dependencies && typeof dependencies === "object" && "id" in dependencies) {
      this.job.needs = (dependencies as JobOutputsRef<Record<string, unknown>>).id;
    } else {
      throw new Error(
        "needs() only accepts job references created using the needs() function. Use needs(job) to create a reference."
      );
    }
    return this;
  }

  /**
   * Sets a conditional expression for this job.
   *
   * @param condition - The conditional expression
   * @stability stable
   */
  if(condition: string): this {
    this.job.if = condition;
    return this;
  }

  /**
   * Adds step(s) to this job.
   *
   * @param steps - Step instance(s) or step function(s)
   * @stability stable
   */
  addStep(...steps: Array<Step | ((step: Step) => Step)>): this {
    for (const s of steps) {
      // Handle arrays that might be passed directly (without spreading)
      if (Array.isArray(s)) {
        this.addStep(...s);
        continue;
      }
      if (s instanceof Step) {
        this.stepInstances.push(s);
      } else if (typeof s === "function") {
        const stepInstance = new Step();
        this.stepInstances.push(s(stepInstance));
      } else {
        throw new Error(
          `addStep expects Step instances or step functions, but received: ${typeof s}`
        );
      }
    }
    return this;
  }

  /**
   * Get step instances for processing.
   * @internal
   */
  _getStepInstances(): Step[] {
    return this.stepInstances;
  }

  /**
   * Replace step instances (used during processing).
   * @internal
   */
  _setStepInstances(steps: Step[]): void {
    this.stepInstances = steps;
  }

  /**
   * Sets job outputs.
   *
   * @param outputs - Job output definitions
   * @stability stable
   */
  outputs<TOutputKeys extends Record<string, string>>(
    outputs: TOutputKeys
  ): Job<TOutputs & TOutputKeys> {
    this.job.outputs = { ...this.job.outputs, ...outputs };
    return this as unknown as Job<TOutputs & TOutputKeys>;
  }

  /**
   * Sets environment variables for this job.
   *
   * @param variables - Environment variables
   * @stability stable
   */
  env(variables: { [key: string]: string }): this {
    this.job.env = { ...this.job.env, ...variables };
    return this;
  }

  /**
   * Sets default values for this job.
   *
   * @param defaults - Default values
   * @stability stable
   */
  defaults(defaults: IJobDefaults): this {
    this.job.defaults = defaults;
    return this;
  }

  /**
   * Sets the timeout in minutes for this job.
   *
   * @param minutes - Timeout in minutes
   * @stability stable
   */
  timeoutMinutes(minutes: number): this {
    this.job["timeout-minutes"] = minutes;
    return this;
  }

  /**
   * Sets the build matrix strategy for this job.
   *
   * @param strategy - Build matrix strategy
   * @stability stable
   */
  strategy(strategy: IJobStrategy): this {
    this.job.strategy = strategy;
    return this;
  }

  /**
   * Sets whether this job should continue on error.
   *
   * @param continueOnError - Whether to continue on error (default: true)
   * @stability stable
   */
  continueOnError(continueOnError = true): this {
    this.job["continue-on-error"] = continueOnError;
    return this;
  }

  /**
   * Sets concurrency settings for this job.
   *
   * @param group - Concurrency group name
   * @param cancelInProgress - Whether to cancel in-progress runs
   * @stability stable
   */
  concurrency(group: string, cancelInProgress?: boolean): this {
    this.job.concurrency = {
      group,
      "cancel-in-progress": cancelInProgress,
    } as IJobConcurrency;
    return this;
  }

  /**
   * Converts the job to JSON configuration.
   *
   * @returns The job configuration
   * @stability stable
   */
  toJSON(): IJob {
    // Convert step instances to JSON
    this.job.steps = this.stepInstances.map((step) => step.toJSON());
    return { ...this.job };
  }
}
