import { ActionsCheckout4 } from "../../.ts-actions/imports/index.js";
import { Workflow } from "../../src/core/workflow.js";

// Define a TypeScript function to execute in the workflow
const processData = (inputValue: string, threshold: number): void => {
  const value = Number.parseInt(inputValue, 10);
  if (value > threshold) {
    console.log(`Value ${value} exceeds threshold ${threshold}`);
    process.exit(1);
  }
  console.log(`Value ${value} is within threshold ${threshold}`);
  process.exit(0);
};

export const typescriptFunctionWorkflow = new Workflow("TypeScript Function Test")
  .onPush({ branches: ["main"] })
  .addJob("test", (job) => {
    return job
      .runsOn("ubuntu-latest")
      .addStep((step) => step.name("Checkout code").uses(ActionsCheckout4))
      .addStep((step) =>
        step.name("Run TypeScript function").runTypeScript(processData, "100", 50)
      );
  });
