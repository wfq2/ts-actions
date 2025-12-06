import type { IActionClassType } from "../actions/types.js";
import { Step } from "../core/step.js";
import type { Workflow } from "../core/workflow.js";

export interface SetupAction {
  action: string;
  version?: string;
  with?: Record<string, string>;
}

/**
 * Detect if workflow needs Node.js setup actions.
 * Returns setup actions that should be added if not already present.
 */
export function detectRequiredSetupActions(workflow: Workflow): SetupAction[] {
  const required: SetupAction[] = [];
  const jobInstances = workflow._getJobInstances();

  let needsNode = false;
  let nodeVersion = "24"; // Default

  // Check all jobs and steps
  for (const [, job] of jobInstances.entries()) {
    const stepInstances = job._getStepInstances();

    for (const step of stepInstances) {
      // Check for TypeScript function
      const tsFunction = step._getTypeScriptFunction();
      if (tsFunction) {
        needsNode = true;
        nodeVersion = tsFunction.options?.nodeVersion || "24";
      }

      // Check if setup-node is already used
      const stepJson = step.toJSON();
      if (stepJson.uses) {
        if (stepJson.uses.includes("actions/setup-node")) {
          needsNode = false; // Already present
        }
      }
    }
  }

  if (needsNode) {
    required.push({
      action: "actions/setup-node@v4",
      with: {
        "node-version": nodeVersion,
      },
    });
  }

  return required;
}

/**
 * Check if a job needs Node.js setup and return the required version.
 */
function getNodeSetupRequirement(stepInstances: Step[]): {
  needsNode: boolean;
  nodeVersion: string;
} {
  let needsNode = false;
  let nodeVersion = "24";

  for (const step of stepInstances) {
    const tsFunction = step._getTypeScriptFunction();
    if (tsFunction) {
      needsNode = true;
      nodeVersion = tsFunction.options?.nodeVersion || "24";
    }
  }

  return { needsNode, nodeVersion };
}

/**
 * Check if a job already has setup-node action configured.
 */
function hasSetupNode(stepInstances: Step[]): boolean {
  for (const step of stepInstances) {
    const stepJson = step.toJSON();
    if (stepJson.uses?.includes("actions/setup-node")) {
      return true;
    }
  }
  return false;
}

/**
 * Create setup steps for a job that needs them.
 */
function createSetupSteps(needsNode: boolean, hasSetupNode: boolean, nodeVersion: string): Step[] {
  const newSteps: Step[] = [];

  if (needsNode && !hasSetupNode) {
    const setupNodeAction: IActionClassType = { reference: "actions/setup-node@v4" };
    const setupNodeStep = new Step()
      .name("Setup Node.js")
      .uses(setupNodeAction)
      .with({ "node-version": nodeVersion });
    newSteps.push(setupNodeStep);
  }

  return newSteps;
}

/**
 * Add required setup actions to jobs in a workflow.
 * Adds them as the first step in each job that needs them.
 * This function checks each job individually to avoid duplicating setup actions
 * that are already manually added by the user.
 */
export function addSetupActionsToWorkflow(workflow: Workflow): void {
  const jobInstances = workflow._getJobInstances();

  for (const [, job] of jobInstances.entries()) {
    const stepInstances = job._getStepInstances();
    const { needsNode, nodeVersion } = getNodeSetupRequirement(stepInstances);
    const jobHasSetupNode = hasSetupNode(stepInstances);
    const newSteps = createSetupSteps(needsNode, jobHasSetupNode, nodeVersion);

    if (newSteps.length > 0) {
      job._setStepInstances([...newSteps, ...stepInstances]);
    }
  }
}
