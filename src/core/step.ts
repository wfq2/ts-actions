import type { ActionInputsRegistry } from "../../.ts-actions/imports/registry.d.js";
import { loadActionType } from "../actions/loader.js";
import { parseActionReference } from "../actions/parser.js";
import type { StepEnv, Step as StepType, StepWith } from "./types.js";

// Helper type to get input type for an action
type ActionInputs<TAction extends string> = TAction extends keyof ActionInputsRegistry
  ? ActionInputsRegistry[TAction]
  : Record<string, string | number | boolean>;

export class Step<TAction extends string | null = null> {
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

  uses<TActionRef extends string>(action: TActionRef): Step<TActionRef> {
    this.step.uses = action;
    this.currentActionRef = action;
    return this as Step<TActionRef>;
  }

  run(command: string): Step<null> {
    this.step.run = command;
    this.currentActionRef = null; // Clear action ref when using run
    return this as Step<null>;
  }

  with<TInputs extends ActionInputs<NonNullable<TAction>>>(inputs: TInputs): this {
    // Validate inputs against imported action if available
    if (this.currentActionRef) {
      this.validateActionInputs(inputs as StepWith);
    }

    this.step.with = { ...this.step.with, ...(inputs as StepWith) };
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
    return { ...this.step };
  }
}
