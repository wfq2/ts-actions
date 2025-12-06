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
   * @param dependencies - Job reference(s) or job ID(s) that this job depends on
   * @stability stable
   * @jsii ignore
   */
  needs(
    dependencies:
      | JobOutputsRef<Record<string, unknown>>
      | JobOutputsRef<Record<string, unknown>>[]
      | JobId
      | JobId[]
  ): this;
  /**
   * Sets job dependencies.
   *
   * @param dependencies - Job reference(s) or job ID(s) that this job depends on
   * @stability stable
   */
  needs(
    dependencies: JobId | JobId[] | string | string[] | JobOutputsRef<any> | JobOutputsRef<any>[]
  ): this {
    // Handle both JobOutputsRef and plain strings
    if (Array.isArray(dependencies)) {
      this.job.needs = dependencies.map((dep) => {
        if (typeof dep === "string") return dep;
        if (dep && typeof dep === "object" && "id" in dep) {
          return (dep as JobOutputsRef<any>).id;
        }
        return String(dep);
      });
    } else if (typeof dependencies === "string") {
      this.job.needs = dependencies;
    } else if (dependencies && typeof dependencies === "object" && "id" in dependencies) {
      this.job.needs = (dependencies as JobOutputsRef<any>).id;
    } else {
      this.job.needs = String(dependencies);
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
   * Adds a step to this job.
   *
   * @param step - A step instance
   * @stability stable
   */
  addStep(step: Step): this;
  /**
   * Adds a step to this job.
   *
   * @param stepFn - A function that configures a step
   * @stability stable
   */
  addStep(stepFn: (step: Step) => Step): this;
  /**
   * Adds multiple steps to this job.
   *
   * @param steps - An array of steps or step functions
   * @stability stable
   */
  addStep(steps: Array<Step | ((step: Step) => Step)>): this;
  addStep(
    stepOrFnOrArray: Step | ((step: Step) => Step) | Array<Step | ((step: Step) => Step)>
  ): this {
    if (Array.isArray(stepOrFnOrArray)) {
      for (const s of stepOrFnOrArray) {
        if (s instanceof Step) {
          this.stepInstances.push(s);
        } else {
          const stepInstance = new Step();
          this.stepInstances.push(s(stepInstance));
        }
      }
    } else if (stepOrFnOrArray instanceof Step) {
      this.stepInstances.push(stepOrFnOrArray);
    } else {
      const stepInstance = new Step();
      this.stepInstances.push(stepOrFnOrArray(stepInstance));
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
