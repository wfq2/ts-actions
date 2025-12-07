import { Workflow } from "../../src/core/workflow.js";
import { setupAndInstallNode } from "./setup-and-install-node.js";

export const testWorkflow = new Workflow("Test")
  .onPush({ branches: ["main"] })
  .onPullRequest({ branches: ["main"] })
  .addJob("test", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep(...setupAndInstallNode)
      .addStep((step) => step.name("Run tests").run("npm run test"))
  )
  .addJob("test2", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) =>
        step.name("Run TypeScript function").runTypeScript(() => console.log("Hello, world!"))
      )
  );
