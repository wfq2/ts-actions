import { Workflow } from "../../src/core/workflow.js";
import { setupAndInstallNode } from "./setup-and-install-node.js";

export const lintWorkflow = new Workflow("Lint")
  .onPush({ branches: ["main"] })
  .onPullRequest({ branches: ["main"] })
  .addJob("lint", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep(setupAndInstallNode)
      .addStep((step) => step.name("Run linting").run("npm run check"))
  );
