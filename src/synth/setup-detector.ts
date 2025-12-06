import { Step } from "../core/step.js";
import type { Workflow } from "../core/workflow.js";

export interface SetupAction {
  action: string;
  version?: string;
  with?: Record<string, string>;
}

/**
 * Detect if workflow needs Node.js or Python setup actions.
 * Returns setup actions that should be added if not already present.
 */
export function detectRequiredSetupActions(workflow: Workflow): SetupAction[] {
  const required: SetupAction[] = [];
  const jobInstances = workflow._getJobInstances();

  let needsNode = false;
  let needsPython = false;
  let nodeVersion = "24"; // Default
  let pythonVersion = "3.13"; // Default

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

      // Check for Python function
      const pythonFunction = step._getPythonFunction();
      if (pythonFunction) {
        needsPython = true;
        pythonVersion = pythonFunction.options?.pythonVersion || "3.13";
      }

      // Check if setup-node or setup-python is already used
      const stepJson = step.toJSON();
      if (stepJson.uses) {
        if (stepJson.uses.includes("actions/setup-node")) {
          needsNode = false; // Already present
        }
        if (stepJson.uses.includes("actions/setup-python")) {
          needsPython = false; // Already present
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

  if (needsPython) {
    required.push({
      action: "actions/setup-python@v5",
      with: {
        "python-version": pythonVersion,
      },
    });
  }

  return required;
}

/**
 * Add required setup actions to jobs in a workflow.
 * Adds them as the first step in each job that needs them.
 */
export function addSetupActionsToWorkflow(workflow: Workflow): void {
  const setupActions = detectRequiredSetupActions(workflow);

  if (setupActions.length === 0) {
    return; // No setup actions needed
  }

  const jobInstances = workflow._getJobInstances();

  for (const [, job] of jobInstances.entries()) {
    const stepInstances = job._getStepInstances();

    // Check if job needs setup actions
    let needsNode = false;
    let needsPython = false;
    let nodeVersion = "24";
    let pythonVersion = "3.13";

    for (const step of stepInstances) {
      const tsFunction = step._getTypeScriptFunction();
      if (tsFunction) {
        needsNode = true;
        nodeVersion = tsFunction.options?.nodeVersion || "24";
      }

      const pythonFunction = step._getPythonFunction();
      if (pythonFunction) {
        needsPython = true;
        pythonVersion = pythonFunction.options?.pythonVersion || "3.13";
      }
    }

    // Check if setup actions are already present
    let hasSetupNode = false;
    let hasSetupPython = false;

    for (const step of stepInstances) {
      const stepJson = step.toJSON();
      if (stepJson.uses) {
        if (stepJson.uses.includes("actions/setup-node")) {
          hasSetupNode = true;
        }
        if (stepJson.uses.includes("actions/setup-python")) {
          hasSetupPython = true;
        }
      }
    }

    // Add missing setup actions at the beginning
    const newSteps: Step[] = [];

    if (needsNode && !hasSetupNode) {
      const setupNodeStep = new Step()
        .name("Setup Node.js")
        .uses({ reference: "actions/setup-node@v4" } as any) // Type assertion needed
        .with({ "node-version": nodeVersion });
      newSteps.push(setupNodeStep);
    }

    if (needsPython && !hasSetupPython) {
      const setupPythonStep = new Step()
        .name("Setup Python")
        .uses({ reference: "actions/setup-python@v5" } as any) // Type assertion needed
        .with({ "python-version": pythonVersion });
      newSteps.push(setupPythonStep);
    }

    // Prepend setup steps
    if (newSteps.length > 0) {
      job._setStepInstances([...newSteps, ...stepInstances]);
    }
  }
}
