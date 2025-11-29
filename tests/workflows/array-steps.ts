import { ActionsCheckout4, ActionsSetupNode4 } from "../../.ts-actions/imports/index.js";
import type { Step } from "../../src/core/step.js";
import { Workflow } from "../../src/core/workflow.js";

export const arrayStepsWorkflow = new Workflow("Array Steps Test")
  .onPush({ branches: ["main"] })
  .addJob("build", (job) => {
    // Create an array of steps to combine into the job
    const steps = [
      (step: Step) => step.name("Checkout code").uses(ActionsCheckout4),
      (step: Step) =>
        step.name("Setup Node.js").uses(ActionsSetupNode4).with({ "node-version": "18" }),
      (step: Step) => step.name("Install dependencies").run("npm ci"),
      (step: Step) => step.name("Build project").run("npm run build"),
      (step: Step) => step.name("Run tests").run("npm test"),
    ];

    // Combine the array of steps into the job
    return job.runsOn("ubuntu-latest").addStep(steps);
  });
