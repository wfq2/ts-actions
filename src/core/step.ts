import type { ActionInputsRegistry } from "../../.ts-actions/imports/registry.d.js";
import { loadActionType } from "../actions/loader.js";
import { parseActionReference } from "../actions/parser.js";
import type { ActionClassType } from "../actions/types.js";
import type { StepEnv, Step as StepType, StepWith } from "./types.js";

// Helper type to get input type for an action
// This will fail if ActionInputsRegistry cannot be imported
type ActionInputs<TAction extends keyof ActionInputsRegistry> = [
  ValidActionInputsRegistry,
] extends [never]
  ? never
  : ActionInputsRegistry[TAction];

// Type guard to ensure ActionInputsRegistry is properly defined (not any)
// If the import fails, ActionInputsRegistry will be 'any', which we want to reject
// This type ensures we can detect when the registry is missing or is 'any'
// Check if it's 'any' first (when import fails, TypeScript uses 'any')
type IsAny<T> = 0 extends 1 & T ? true : false;
type ValidActionInputsRegistry = IsAny<ActionInputsRegistry> extends true
  ? never // Reject 'any' type
  : [ActionInputsRegistry] extends [Record<string, unknown>]
    ? [keyof ActionInputsRegistry] extends [never]
      ? never // Empty registry
      : ActionInputsRegistry // Valid registry
    : never; // Not a record type

/**
 * Type representing a reusable action step (uses an action reference)
 * This represents an action reference (e.g., "actions/checkout@v4")
 */
declare const __actionReferenceBrand: unique symbol;
export type ActionReference = string & { readonly [__actionReferenceBrand]: true };

/**
 * Type representing a self-defined script step (uses run)
 * This represents a script step that runs custom commands
 */
declare const __scriptStepBrand: unique symbol;
export type ScriptStep = { readonly [__scriptStepBrand]: true };

/**
 * Union type representing the two possible step action types
 */
export type StepActionType = ActionReference | ScriptStep;

export class Step<TAction extends StepActionType = ScriptStep> {
  private step: StepType;
  private currentActionRef: string | null = null;

  constructor(step?: Partial<StepType>) {
    this.step = step || {};
  }

  id(id: string): this {
    this.step.id = id;
    return this;
  }

  name(name: string): this {
    this.step.name = name;
    return this;
  }

  uses<TActionClass extends ActionClassType>(
    action: TActionClass
  ): [TAction] extends [ScriptStep] ? Step<TActionClass["reference"] & ActionReference> : never {
    // Access the reference property from the class constructor or instance
    // This works for both static classes (with static/constructor reference) and instances
    const actionRef = (action as { reference: string }).reference;
    this.step.uses = actionRef;
    this.currentActionRef = actionRef;
    // Clear run property since a step cannot have both uses and run
    this.step.run = undefined;
    // Type assertion: when TAction is ScriptStep, return Step<TActionClass["reference"]>, otherwise never
    return this as unknown as [TAction] extends [ScriptStep]
      ? Step<TActionClass["reference"] & ActionReference>
      : never;
  }

  run(
    ...args: [TAction] extends [ScriptStep] ? [string] : never
  ): [TAction] extends [ScriptStep] ? Step<ScriptStep> : never {
    const [command] = args;
    this.step.run = command;
    this.currentActionRef = null; // Clear action ref when using run
    // Clear uses and with properties since a step cannot have both uses and run
    this.step.uses = undefined;
    this.step.with = undefined;
    // Type assertion: when TAction is ScriptStep, return Step<ScriptStep>, otherwise never
    return this as unknown as [TAction] extends [ScriptStep] ? Step<ScriptStep> : never;
  }

  with(
    inputs: [ValidActionInputsRegistry] extends [never]
      ? { __error: "ActionInputsRegistry is missing. Run: ts-actions import <action>" }
      : TAction extends ActionReference
        ? TAction extends keyof ActionInputsRegistry
          ? ActionInputs<TAction>
          : {
              __error: `Action "${TAction}" is not imported. Run: ts-actions import ${TAction}`;
            }
        : {
            __error: "Cannot use 'with' on a script step. Use 'with' only with action steps (uses).";
          }
  ): this {
    // Validate inputs against imported action if available
    if (this.currentActionRef) {
      this.validateActionInputs(inputs as unknown as StepWith);
    }

    this.step.with = { ...this.step.with, ...(inputs as unknown as StepWith) };
    return this;
  }

  private validateActionInputs(inputs: StepWith): void {
    if (!this.currentActionRef) {
      return;
    }

    try {
      const reference = parseActionReference(this.currentActionRef);
      const metadata = loadActionType(reference);

      if (!metadata?.inputs) {
        return;
      }

      const validKeys = Object.keys(metadata.inputs);
      const inputKeys = Object.keys(inputs);

      // Warn about unknown inputs (but don't fail)
      for (const key of inputKeys) {
        if (!validKeys.includes(key)) {
          console.warn(
            `Warning: Unknown input "${key}" for action ${this.currentActionRef}. Valid inputs: ${validKeys.join(", ")}`
          );
        }
      }

      // Validate required inputs
      for (const [key, input] of Object.entries(metadata.inputs)) {
        if (input.required && !(key in inputs) && input.default === undefined) {
          console.warn(
            `Warning: Required input "${key}" is missing for action ${this.currentActionRef}`
          );
        }
      }
    } catch {
      // If parsing fails, just continue (might be a non-standard action reference)
      // Don't break the API for actions that aren't imported
    }
  }

  env(variables: StepEnv): this {
    this.step.env = { ...this.step.env, ...variables };
    return this;
  }

  continueOnError(continueOnError = true): this {
    this.step["continue-on-error"] = continueOnError;
    return this;
  }

  timeoutMinutes(minutes: number): this {
    this.step["timeout-minutes"] = minutes;
    return this;
  }

  if(condition: string): this {
    this.step.if = condition;
    return this;
  }

  workingDirectory(directory: string): this {
    this.step["working-directory"] = directory;
    return this;
  }

  toJSON(): StepType {
    // Validate that a step doesn't have both uses and run (defensive check)
    if (this.step.uses && this.step.run) {
      throw new Error(
        "Invalid step: a step cannot have both 'uses' and 'run' properties. A step must be either an action step (uses) or a script step (run), not both."
      );
    }
    return { ...this.step };
  }
}
