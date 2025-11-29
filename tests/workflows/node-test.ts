import { Workflow } from "../../src/core/workflow.js";

export const nodeTestWorkflow = new Workflow("Node Test")
  .onPush({ branches: ["main"] })
  .addJob("test", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) => step.name("Checkout code").uses("actions/checkout@v4"))
      .addStep((step) =>
        step.name("Setup Node.js").uses("actions/setup-node@v4").with({ "node-version": "20" })
      )
      .addStep((step) => step.name("Run tests").run("npm run test"))
  );
