// Import action classes (these will be generated when actions are imported via: ts-actions import <action>)
// Example: ts-actions import actions/checkout@v4
// Example: ts-actions import actions/setup-node@v4
import { ActionsCheckout4, ActionsSetupNode4 } from "../../.ts-actions/imports/index.js";
import { Workflow } from "../../src/core/workflow.js";

export const nodeTestWorkflow = new Workflow("Node Test")
  .onPush({ branches: ["main"] })
  .addJob("test", (job) => {
    // Use static classes directly - no instantiation needed
    // Each class specifies the exact version via its static reference property
    return job
      .runsOn("ubuntu-latest")
      .addStep((step) => step.name("Checkout code").uses(ActionsCheckout4))
      .addStep((step) =>
        step.name("Setup Node.js").uses(ActionsSetupNode4).with({ "node-version": "20" })
      )
      .addStep((step) => step.name("Run tests").run("npm run test"));
  });
