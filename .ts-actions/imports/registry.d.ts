/**
 * Type registry for imported GitHub Actions
 * This file is auto-generated - DO NOT EDIT MANUALLY
 *
 * This registry maps action references to their input types for static type checking.
 */

import type { ActionsCheckout4Inputs } from "./actions/checkout/v4.js";
import type { ActionsSetupNode4Inputs } from "./actions/setup-node/v4.js";

export type ActionInputsRegistry = {
  "actions/setup-node@v4": ActionsSetupNode4Inputs;
  "actions/checkout@v4": ActionsCheckout4Inputs;
};
