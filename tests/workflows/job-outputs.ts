import { ActionsCheckout4 } from "../../.ts-actions/imports/index.js";
import { Job, Workflow, needs, setOutput, steps } from "../../src/index.js";

/**
 * Example workflow demonstrating type-safe job output references
 *
 * Benefits:
 * - Type safety: TypeScript will catch typos in job IDs and output names
 * - Autocomplete: IDE will suggest available outputs
 * - Refactoring: Rename job IDs and outputs safely
 * - Readability: Clear intent vs string templates
 */

const firstJob = new Job("ubuntu-latest")
  .runsOn("ubuntu-latest")
  .addStep((step) => step.name("Checkout code").uses(ActionsCheckout4))
  .addStep((step) =>
    step.name("Generate value").id("generate").run(setOutput("value", "Hello from first job"))
  )
  .outputs({ message: steps("generate").outputs.value });

export const jobOutputsWorkflow = new Workflow("Job Outputs Test")
  .onPush({ branches: ["main"] })
  .addJob("first-job", firstJob)
  .addJob("second-job", (job) => {
    // Pass the job directly to needs() - automatic type inference!
    // TypeScript preserves literal keys: "message" is known at compile time
    const firstJobRef = needs(firstJob);
    // Now firstJobRef.outputs.message is fully typed with autocomplete!
    // TypeScript knows "message" exists and will error on typos like "messag"

    return job
      .runsOn("ubuntu-latest")
      .needs(firstJobRef) // Pass the job reference directly
      .addStep((step) => step.name("Checkout code").uses(ActionsCheckout4))
      .addStep((step) =>
        step
          .name("Use output from first job")
          // Type-safe: firstJobRef.outputs.message provides autocomplete and type checking
          // Generates: "echo \"Received: ${{ needs.first-job.outputs.message }}\""
          .run(`echo "Received: ${firstJobRef.outputs.message}"`)
      )
      .env({
        // Type-safe: autocomplete for available outputs
        // Generates: { firstJobMessage: "${{ needs.first-job.outputs.message }}" }
        firstJobMessage: firstJobRef.outputs.message,
      });
  });

/**
 * Alternative syntax ideas (not implemented):
 *
 * 1. Shorter syntax:
 *    const outputs = jobOutputs("first-job");
 *    outputs.message // instead of needs("first-job").outputs.message
 *
 * 2. Builder pattern that tracks jobs:
 *    workflow
 *      .addJob("first-job", job => job.outputs({ message: "..." }))
 *      .addJob("second-job", (job, { jobs }) =>
 *        job.env({ msg: jobs["first-job"].outputs.message })
 *      )
 *
 * 3. Const assertions for better inference:
 *    const outputs = { message: "", version: "" } as const;
 *    needs<typeof outputs>("first-job").outputs.message
 */
