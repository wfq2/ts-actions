import { Step } from "./step.js";
import type { StepActionType } from "./step.js";
import type { JobDefaults, JobEnv, JobOutputs, Job as JobType, Runner } from "./types.js";

export class Job {
  private job: JobType;

  constructor(runsOn: Runner | Runner[]) {
    this.job = {
      "runs-on": runsOn,
      steps: [],
    };
  }

  runsOn(runner: Runner | Runner[]): this {
    this.job["runs-on"] = runner;
    return this;
  }

  needs(jobIds: string | string[]): this {
    this.job.needs = jobIds;
    return this;
  }

  if(condition: string): this {
    this.job.if = condition;
    return this;
  }

  addStep(step: Step): this;
  addStep<TAction extends StepActionType>(step: (step: Step) => Step<TAction>): this;
  addStep(steps: Array<Step | ((step: Step) => Step<StepActionType>)>): this;
  addStep(
    step:
      | Step
      | ((step: Step) => Step<StepActionType>)
      | Array<Step | ((step: Step) => Step<StepActionType>)>
  ): this {
    if (Array.isArray(step)) {
      for (const s of step) {
        if (s instanceof Step) {
          this.job.steps.push(s.toJSON());
        } else {
          const stepInstance = new Step();
          this.job.steps.push(s(stepInstance).toJSON());
        }
      }
    } else if (step instanceof Step) {
      this.job.steps.push(step.toJSON());
    } else {
      const stepInstance = new Step();
      this.job.steps.push(step(stepInstance).toJSON());
    }
    return this;
  }

  outputs(outputs: JobOutputs): this {
    this.job.outputs = { ...this.job.outputs, ...outputs };
    return this;
  }

  env(variables: JobEnv): this {
    this.job.env = { ...this.job.env, ...variables };
    return this;
  }

  defaults(defaults: JobDefaults): this {
    this.job.defaults = defaults;
    return this;
  }

  timeoutMinutes(minutes: number): this {
    this.job["timeout-minutes"] = minutes;
    return this;
  }

  strategy(strategy: {
    matrix?: Record<string, (string | number)[]>;
    "fail-fast"?: boolean;
    "max-parallel"?: number;
  }): this {
    this.job.strategy = strategy;
    return this;
  }

  continueOnError(continueOnError = true): this {
    this.job["continue-on-error"] = continueOnError;
    return this;
  }

  concurrency(group: string, cancelInProgress?: boolean): this {
    this.job.concurrency = {
      group,
      "cancel-in-progress": cancelInProgress,
    };
    return this;
  }

  toJSON(): JobType {
    return { ...this.job };
  }
}
