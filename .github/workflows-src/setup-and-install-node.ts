import { ActionsSetupNode4 } from "../../.ts-actions/imports/index.js";
import type { Step } from "../../src/core/step.js";

export const setupAndInstallNode = (step: Step<string | null>) =>
  step
    .name("Install dependencies")
    .uses(ActionsSetupNode4)
    .with({ "node-version": "24", cache: "npm" });
