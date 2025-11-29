import { Workflow } from "../../src/core/workflow.js";

export const simpleDeployWorkflow = new Workflow("Simple Deploy")
  .onWorkflowDispatch()
  .addJob("deploy", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) => step.name("Deploy").run("echo 'Deploying application'"))
  );
