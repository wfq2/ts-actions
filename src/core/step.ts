import { loadActionType } from "../actions/loader.js";
import { parseActionReference } from "../actions/parser.js";
import type { IActionClassType } from "../actions/types.js";
import type {
  GitHubExpression,
  ITypeScriptStepOptions,
  TypeScriptFunction,
  ValidatedTypeScriptArgs,
} from "./types.js";
import type { IStep } from "./types.js";

/**
 * A GitHub Actions step definition.
 *
 * @stability stable
 */
export class Step {
  private step: IStep;
  private currentActionRef: string | null = null;
  // Internal storage for TypeScript function steps
  private typescriptFunction: TypeScriptFunction | null = null;
  private typescriptArgs: Array<string | number | boolean | GitHubExpression> = [];
  private typescriptOptions: ITypeScriptStepOptions | undefined;
  private typescriptStackTrace: string | undefined;

  /**
   * Creates a new step.
   *
   * @stability stable
   */
  constructor() {
    this.step = {};
  }

  /**
   * Sets the step ID.
   *
   * @param id - The step ID
   * @stability stable
   */
  id(id: string): this {
    this.step.id = id;
    return this;
  }

  /**
   * Sets the step name.
   *
   * @param name - The step name
   * @stability stable
   */
  name(name: string): this {
    this.step.name = name;
    return this;
  }

  /**
   * Sets the action to use for this step.
   *
   * @param action - The action class to use
   * @stability stable
   */
  uses(action: IActionClassType): this {
    // Access the reference property from the class constructor or instance
    // This works for both static classes (with static/constructor reference) and instances
    const actionRef = (action as { reference: string }).reference;
    this.step.uses = actionRef;
    this.currentActionRef = actionRef;
    // Clear run property since a step cannot have both uses and run
    this.step.run = undefined;
    return this;
  }

  /**
   * Sets the command to run for this step.
   *
   * @param command - The command to run
   * @stability stable
   */
  run(command: string): this {
    this.step.run = command;
    this.currentActionRef = null; // Clear action ref when using run
    // Clear uses and with properties since a step cannot have both uses and run
    this.step.uses = undefined;
    this.step.with = undefined;
    // Clear function references
    this.typescriptFunction = null;
    this.typescriptArgs = [];
    return this;
  }

  /**
   * Runs a TypeScript function in this step.
   * The function source will be extracted and transpiled during synthesis.
   *
   * @param fn - The TypeScript function to execute
   * @param options - Optional configuration (Node.js version)
   * @param args - Arguments to pass to the function (can include GitHub Actions expressions)
   * @stability stable
   * @jsii ignore
   */
  runTypeScript<T extends TypeScriptFunction>(
    fn: T,
    options?: ITypeScriptStepOptions,
    ...args: ValidatedTypeScriptArgs<T>
  ): this;
  /**
   * Runs a TypeScript function in this step.
   * The function source will be extracted and transpiled during synthesis.
   *
   * @param fn - The TypeScript function to execute
   * @param args - Arguments to pass to the function (can include GitHub Actions expressions)
   * @stability stable
   * @jsii ignore
   */
  runTypeScript<T extends TypeScriptFunction>(fn: T, ...args: ValidatedTypeScriptArgs<T>): this;
  runTypeScript(
    fn: TypeScriptFunction,
    optionsOrArg?: ITypeScriptStepOptions | string | number | boolean | GitHubExpression,
    ...restArgs: Array<string | number | boolean | GitHubExpression>
  ): this {
    // Check if first argument is options object
    let options: ITypeScriptStepOptions | undefined;
    let args: Array<string | number | boolean | GitHubExpression>;

    const isOptionsObject = (value: unknown): value is ITypeScriptStepOptions => {
      return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        ("nodeVersion" in value || Object.keys(value).length === 0)
      );
    };

    if (optionsOrArg !== undefined && isOptionsObject(optionsOrArg)) {
      options = optionsOrArg;
      args = restArgs;
    } else {
      options = undefined;
      args =
        optionsOrArg !== undefined
          ? ([optionsOrArg, ...restArgs] as Array<string | number | boolean | GitHubExpression>)
          : restArgs;
    }

    this.typescriptFunction = fn;
    this.typescriptArgs = args;
    this.typescriptOptions = options;
    // Capture stack trace at the call site to help with function extraction
    this.typescriptStackTrace = new Error("TypeScript function step").stack;
    // Clear other step types
    this.step.run = undefined;
    this.step.uses = undefined;
    this.step.with = undefined;
    this.currentActionRef = null;
    return this;
  }

  /**
   * Sets input parameters for the action used in this step.
   *
   * @param inputs - Input parameters for the action
   * @stability stable
   */
  withInputs(inputs: { [key: string]: string | number | boolean }): this {
    // Validate inputs against imported action if available
    if (this.currentActionRef) {
      this.validateActionInputs(inputs);
    }

    this.step.with = { ...this.step.with, ...inputs };
    return this;
  }

  /**
   * Sets input parameters for the action used in this step.
   * Alias for withInputs for backward compatibility.
   *
   * @param inputs - Input parameters for the action
   * @stability stable
   */
  with(inputs: { [key: string]: string | number | boolean }): this {
    return this.withInputs(inputs);
  }

  private validateActionInputs(inputs: { [key: string]: string | number | boolean }): void {
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

  /**
   * Sets environment variables for this step.
   *
   * @param variables - Environment variables
   * @stability stable
   */
  env(variables: { [key: string]: string }): this {
    this.step.env = { ...this.step.env, ...variables };
    return this;
  }

  /**
   * Sets whether this step should continue on error.
   *
   * @param continueOnError - Whether to continue on error (default: true)
   * @stability stable
   */
  continueOnError(continueOnError = true): this {
    this.step["continue-on-error"] = continueOnError;
    return this;
  }

  /**
   * Sets the timeout in minutes for this step.
   *
   * @param minutes - Timeout in minutes
   * @stability stable
   */
  timeoutMinutes(minutes: number): this {
    this.step["timeout-minutes"] = minutes;
    return this;
  }

  /**
   * Sets a conditional expression for this step.
   *
   * @param condition - The conditional expression
   * @stability stable
   */
  ifCondition(condition: string): this {
    this.step.if = condition;
    return this;
  }

  /**
   * Sets a conditional expression for this step.
   * Alias for ifCondition for backward compatibility.
   *
   * @param condition - The conditional expression
   * @stability stable
   */
  if(condition: string): this {
    return this.ifCondition(condition);
  }

  /**
   * Sets the working directory for this step.
   *
   * @param directory - The working directory
   * @stability stable
   */
  workingDirectory(directory: string): this {
    this.step["working-directory"] = directory;
    return this;
  }

  /**
   * Gets TypeScript function data if this step uses TypeScript.
   * @internal
   */
  _getTypeScriptFunction(): {
    fn: TypeScriptFunction;
    args: Array<string | number | boolean | GitHubExpression>;
    options?: ITypeScriptStepOptions;
    stackTrace?: string;
  } | null {
    if (this.typescriptFunction) {
      return {
        fn: this.typescriptFunction,
        args: this.typescriptArgs,
        options: this.typescriptOptions,
        stackTrace: this.typescriptStackTrace,
      };
    }
    return null;
  }

  /**
   * Converts the step to JSON configuration.
   *
   * @returns The step configuration
   * @stability stable
   */
  toJSON(): IStep {
    // Validate that a step doesn't have both uses and run (defensive check)
    if (this.step.uses && this.step.run) {
      throw new Error(
        "Invalid step: a step cannot have both 'uses' and 'run' properties. A step must be either an action step (uses) or a script step (run), not both."
      );
    }
    return { ...this.step };
  }
}
