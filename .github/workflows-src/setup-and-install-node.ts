import { ActionsCheckout4, ActionsSetupNode4 } from "../../.ts-actions/imports/index.js";
import type { Step } from "../../src/core/step.js";

export const setupAndInstallNode = [
  (step: Step<string>) => step.name("Checkout code").uses(ActionsCheckout4),
  (step: Step<string>) =>
    step.name("Setup Node.js").uses(ActionsSetupNode4).with({ "node-version": "24", cache: "npm" }),
  (step: Step<string>) => step.name("Install dependencies").run("npm ci"),
];
