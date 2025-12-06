import { Step } from "../core/step.js";
import type { IWorkflowConfig, TypeScriptFunction } from "../core/types.js";
import type { Workflow } from "../core/workflow.js";
import { extractTypeScriptFunction } from "./function-extractor.js";
import { detectRequiredSetupActions } from "./setup-detector.js";
import { transpileTypeScriptFunction } from "./typescript-transpiler.js";

/**
 * Process a workflow to extract and transpile TypeScript functions.
 * This modifies the workflow in place, converting function steps to regular run steps.
 *
 * @param workflow - The workflow to process
 * @returns Processed workflow configuration
 */
export function processWorkflow(workflow: Workflow): IWorkflowConfig {
  const config = workflow.toJSON();

  // We need to process steps before they're converted to JSON
  // So we'll need to access the workflow's internal structure
  // For now, let's process after JSON conversion by modifying the config

  // Note: This is a limitation - we've lost access to Step instances
  // We'll need to process steps differently

  return config;
}

/**
 * Process steps in a workflow by traversing the workflow structure.
 * This function processes TypeScript function steps and replaces them with regular run steps.
 */
export async function processWorkflowSteps(workflow: Workflow): Promise<void> {
  // Detect required setup actions (for documentation/warnings)
  const requiredSetup = detectRequiredSetupActions(workflow);
  if (requiredSetup.length > 0) {
    console.warn(
      `Note: This workflow may require setup actions: ${requiredSetup.map((s) => s.action).join(", ")}. Make sure to add them before function execution steps.`
    );
  }

  const jobInstances = workflow._getJobInstances();

  for (const [, job] of jobInstances.entries()) {
    const stepInstances = job._getStepInstances();
    const processedSteps: Step[] = [];

    for (const step of stepInstances) {
      const processedStep = await processStep(step);
      if (processedStep) {
        processedSteps.push(processedStep);
      } else {
        // Step doesn't need processing, keep as-is
        processedSteps.push(step);
      }
    }

    // Replace steps in job
    job._setStepInstances(processedSteps);
  }
}

/**
 * Process a single step that may contain TypeScript functions.
 * Returns a new step with the function code embedded as a run command.
 */
export async function processStep(step: Step): Promise<Step | null> {
  // Check for TypeScript function
  const tsFunction = step._getTypeScriptFunction();
  if (tsFunction) {
    return await processTypeScriptStep(step, tsFunction);
  }

  // Not a function step, return as-is
  return step;
}

/**
 * Process a TypeScript function step.
 */
async function processTypeScriptStep(
  step: Step,
  tsData: {
    fn: TypeScriptFunction;
    args: Array<string | number | boolean | import("../core/types.js").GitHubExpression>;
    options?: import("../core/types.js").ITypeScriptStepOptions;
    stackTrace?: string;
  }
): Promise<Step> {
  // Extract function source, using the captured stack trace if available
  const extracted = extractTypeScriptFunction(tsData.fn, tsData.stackTrace);

  if (!extracted) {
    throw new Error(
      "Failed to extract TypeScript function source. Make sure the function is defined in a TypeScript source file."
    );
  }

  // Transpile function
  const transpiled = await transpileTypeScriptFunction(extracted, tsData.args, {
    bundle: true,
    nodeVersion: tsData.options?.nodeVersion || "24",
  });

  // Create new step with transpiled code
  const newStep = new Step();

  // Copy all step properties
  const stepJson = step.toJSON();
  if (stepJson.name) newStep.name(stepJson.name);
  if (stepJson.id) newStep.id(stepJson.id);
  if (stepJson.env) newStep.env(stepJson.env);
  if (stepJson.if) newStep.if(stepJson.if);
  if (stepJson["continue-on-error"]) {
    newStep.continueOnError(stepJson["continue-on-error"]);
  }
  if (stepJson["timeout-minutes"]) newStep.timeoutMinutes(stepJson["timeout-minutes"]);
  if (stepJson["working-directory"]) newStep.workingDirectory(stepJson["working-directory"]);

  // Set environment variables for GitHub expression arguments
  const envVars: Record<string, string> = { ...(stepJson.env || {}) };
  tsData.args.forEach((arg, index) => {
    if (typeof arg === "string" && arg.includes("${{")) {
      const envVarName = `GITHUB_EXPR_${index}`;
      envVars[envVarName] = arg; // GitHub expression will be evaluated
    }
  });
  if (Object.keys(envVars).length > 0) {
    newStep.env(envVars);
  }

  // Set the run command with transpiled code
  newStep.run(transpiled.code);

  return newStep;
}
