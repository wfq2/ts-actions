import { defaultRunName } from "../../src/core/run-name-helpers.js";
import { Workflow } from "../../src/core/workflow.js";
import { setupAndInstallNode } from "./setup-and-install-node.js";

export const testWorkflow = new Workflow("Test")
  .onPush({ branches: ["main"] })
  .onPullRequest({ branches: ["main"] })
  .runName(defaultRunName())
  .addJob("test", (job) =>
    job
      .name("Run Test Suite")
      .runsOn("ubuntu-latest")
      .addStep(...setupAndInstallNode)
      .addStep((step) => step.name("Run tests").run("npm run test"))
  )
  .addJob("test2", (job) =>
    job
      .name("Run TypeScript Function Test")
      .needs("test")
      .addStep((step) =>
        step.name("Run TypeScript function").runTypeScript(() => console.log("Hello, world!"))
      )
  );
