import { ActionsSetupNode4 } from "../../.ts-actions/imports/index.js";
import type { Step } from "../../src/core/step.js";

// This exported step function tries to use both uses and run, which should be invalid
export const invalidStep = (step: Step) =>
  step
    .name("Invalid step")
    .uses(ActionsSetupNode4)
    .with({ "node-version": "24" })
    // @ts-expect-error - This should cause an error
    .run("npm ci"); // This should cause an error
