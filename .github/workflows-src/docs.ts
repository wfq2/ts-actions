import { ActionsCheckout4, ActionsSetupPython5 } from "../../.ts-actions/imports/index.js";
import { Workflow } from "../../src/core/workflow.js";

export const docsWorkflow = new Workflow("Deploy Documentation")
  .onPush({ branches: ["main"], paths: ["docs/**", "mkdocs.yml", "requirements.txt"] })
  .onWorkflowDispatch()
  .permissions({
    contents: "write",
  })
  .addJob("build-and-deploy", (job) =>
    job
      .name("Build and Deploy Docs")
      .runsOn("ubuntu-latest")
      .addStep((step) => step.name("Checkout code").uses(ActionsCheckout4))
      .addStep((step) =>
        step.name("Setup Python").uses(ActionsSetupPython5).with({ "python-version": "3.x" })
      )
      .addStep((step) => step.name("Install MkDocs").run("pip install -r requirements.txt"))
      .addStep((step) =>
        step
          .name("Deploy to GitHub Pages")
          .run("mkdocs gh-deploy --force")
          .if("github.ref == 'refs/heads/main'")
      )
  );
