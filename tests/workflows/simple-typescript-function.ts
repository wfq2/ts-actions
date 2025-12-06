import { ActionsCheckout4 } from "../../.ts-actions/imports/index.js";
import { Workflow } from "../../src/core/workflow.js";

// Test with an anonymous arrow function (like in .github/workflows-src/test.ts)
export const simpleTypeScriptFunctionWorkflow = new Workflow("Simple TypeScript Function Test")
  .onPush({ branches: ["main"] })
  .addJob("test", (job) => {
    return job
      .runsOn("ubuntu-latest")
      .addStep((step) => step.name("Checkout code").uses(ActionsCheckout4))
      .addStep((step) =>
        step.name("Run TypeScript function").runTypeScript(() => console.log("Hello, world!"))
      );
  });
