import { ActionsCheckout4, ActionsSetupNode4 } from "../../.ts-actions/imports/index.js";
import { Workflow } from "../../src/core/workflow.js";

export const testWorkflow = new Workflow("Test")
  .onPush({ branches: ["main"] })
  .onPullRequest({ branches: ["main"] })
  .addJob("test", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) => step.name("Checkout code").uses(ActionsCheckout4))
      .addStep((step) =>
        step
          .name("Setup Node.js")
          .uses(ActionsSetupNode4)
          .with({ "node-version": "24", cache: "npm" })
      )
      .addStep((step) => step.name("Install dependencies").run("npm ci"))
      .addStep((step) => step.name("Run tests").run("npm run test"))
  );
