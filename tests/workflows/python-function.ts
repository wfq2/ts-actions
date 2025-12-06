import { ActionsCheckout4 } from "../../.ts-actions/imports/index.js";
import { Workflow } from "../../src/core/workflow.js";

// Define a Python function to execute in the workflow
// Note: Python function extraction is not fully implemented yet,
// so this is a placeholder that demonstrates the API
const processData = (data: string, threshold: number): void => {
  // Python code will be extracted and processed during synthesis
  // This function body will be converted to Python syntax
  const value = Number.parseInt(data, 10);
  if (value > threshold) {
    console.log(`Value ${value} exceeds threshold ${threshold}`);
    process.exit(1);
  }
  console.log(`Value ${value} is within threshold ${threshold}`);
  process.exit(0);
};

export const pythonFunctionWorkflow = new Workflow("Python Function Test")
  .onPush({ branches: ["main"] })
  .addJob("test", (job) => {
    return job
      .runsOn("ubuntu-latest")
      .addStep((step) => step.name("Checkout code").uses(ActionsCheckout4))
      .addStep((step) => step.name("Run Python function").runPython(processData, "100", 50));
  });
