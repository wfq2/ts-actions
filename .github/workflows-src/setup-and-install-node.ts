import { ActionsSetupNode4 } from "../../.ts-actions/imports/index.js";
import type { Step } from "../../src/core/step.js";

export const setupAndInstallNode = (step: Step<string | null>) =>
  step
    .name("Setup Node.js")
    .uses(ActionsSetupNode4)
    .with({ "node-version": "24", cache: "npm" })
    .name("Install dependencies")
    .run("npm ci");
