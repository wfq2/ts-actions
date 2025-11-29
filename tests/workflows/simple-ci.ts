import { ActionsCheckout4 } from "../../.ts-actions/imports/index.js";
import { Workflow } from "../../src/core/workflow.js";

export const simpleCIWorkflow = new Workflow("Simple CI")
  .onPush({ branches: ["main"] })
  .addJob("build", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) =>
        step.name("Checkout code").uses(ActionsCheckout4).with({ "fetch-depth": 0 })
      )
      .addStep((step) => step.name("Run tests").run("npm test"))
  );
