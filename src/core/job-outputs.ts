import type { Job } from "./job.js";
import type { JobId } from "./types.js";

/**
 * Type-safe job output references
 *
 * Provides type-safe access to GitHub Actions job and step outputs with
 * full TypeScript support including autocomplete and compile-time validation.
 */

/**
 * JobOutputsRef preserves literal keys and returns expression strings
 * TOutputs should be a const object to preserve literal key types
 */
export type JobOutputsRef<TOutputs extends Record<string, unknown>> = {
  id: JobId; // The job ID for use in .needs()
  outputs: {
    [K in keyof TOutputs]: string; // Returns the GitHub Actions expression string
  };
};

export type StepOutputs<TOutputs extends Record<string, unknown>> = {
  outputs: {
    [K in keyof TOutputs]: string; // Returns the GitHub Actions expression string
  };
};

/**
 * Creates a proxy that generates GitHub Actions expression strings for outputs.
 */
function createOutputsProxy<TOutputs extends Record<string, unknown>>(
  expressionPrefix: string
): { [K in keyof TOutputs]: string } {
  return new Proxy({} as { [K in keyof TOutputs]: string }, {
    get: (_target, prop: string) => `\${{ ${expressionPrefix}.outputs.${prop} }}`,
  });
}

/**
 * Returns a type-safe reference to a job's outputs.
 *
 * @param job - The Job instance (must have an ID set)
 * @returns An object with the job ID and type-safe access to outputs
 *
 * @example
 * ```typescript
 * const firstJob = new Job("ubuntu-latest").outputs({ message: "..." });
 * workflow.addJob("first-job", firstJob);
 * const jobRef = needs(firstJob);
 * // jobRef.outputs.message is fully typed with autocomplete
 * ```
 */
export function needs<TOutputs extends Record<string, string>>(
  job: Job<TOutputs>
): JobOutputsRef<TOutputs>;
/**
 * Returns type-safe references to multiple jobs' outputs.
 *
 * @param jobs - Multiple Job instances (must have IDs set)
 * @returns An array of job output references
 *
 * @example
 * ```typescript
 * const jobRefs = needs(job1, job2, job3);
 * // Use jobRefs[0].outputs.message, etc.
 * ```
 */
export function needs<TOutputs extends Record<string, string>>(
  ...jobs: Job<TOutputs>[]
): JobOutputsRef<TOutputs>[];
export function needs<TOutputs extends Record<string, string>>(
  ...jobs: Job<TOutputs>[]
): JobOutputsRef<TOutputs> | JobOutputsRef<TOutputs>[] {
  if (jobs.length === 1) {
    const job = jobs[0];
    if (!job.id) {
      throw new Error(
        "Job must have an ID set. Make sure to call workflow.addJob() before using needs()."
      );
    }
    return {
      id: job.id,
      outputs: createOutputsProxy<TOutputs>(`needs.${job.id}`),
    };
  }

  return jobs.map((job) => {
    if (!job.id) {
      throw new Error(
        "All jobs must have IDs set. Make sure to call workflow.addJob() before using needs()."
      );
    }
    return {
      id: job.id,
      outputs: createOutputsProxy<TOutputs>(`needs.${job.id}`),
    };
  });
}

/**
 * Returns a type-safe reference to a step's outputs.
 *
 * @param stepId - The step ID
 * @returns An object with type-safe access to step outputs
 *
 * @example
 * ```typescript
 * const stepRef = steps<{ value: string }>("my-step");
 * // stepRef.outputs.value is fully typed
 * ```
 */
export function steps<TOutputs extends Record<string, unknown>>(
  stepId: string
): StepOutputs<TOutputs> {
  return {
    outputs: createOutputsProxy<TOutputs>(`steps.${stepId}`),
  };
}

/**
 * Generates the echo command to set a step output in GitHub Actions.
 *
 * @param name - The output name
 * @param value - The output value (string, number, or boolean)
 * @returns The echo command string
 *
 * @example
 * ```typescript
 * .run(setOutput("version", "1.0.0"))
 * // Generates: echo "version=1.0.0" >> $GITHUB_OUTPUT
 * ```
 */
export function setOutput(name: string, value: string | number | boolean): string {
  // Escapes the value properly for shell output
  // Handles special characters and generates: echo "name=value" >> $GITHUB_OUTPUT
  const escapedValue = String(value).replace(/"/g, '\\"').replace(/\n/g, "\\n");
  return `echo "${name}=${escapedValue}" >> $GITHUB_OUTPUT`;
}
