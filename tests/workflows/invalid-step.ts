import { ActionsSetupNode4 } from "../../.ts-actions/imports/index.js";
import type { Step } from "../../src/core/step.js";

// This exported step function tries to use both uses and run, which should be invalid
// Note: The type system no longer prevents this at compile time, but it will fail at runtime
export const invalidStep = (step: Step) =>
  step.name("Invalid step").uses(ActionsSetupNode4).with({ "node-version": "24" }).run("npm ci"); // This will cause a runtime error when toJSON() is called
