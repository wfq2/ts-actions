import type { GitHubExpression } from "../core/types.js";

// Regex patterns (moved to top level for performance)
const GITHUB_EXPRESSION_REGEX = /\$\{\{\s*[^}]+\s*\}\}/;
const FUNCTION_DECL_REGEX = /(?:async\s+)?function\s+(\w+)/;
const ARROW_FUNCTION_REGEX = /const\s+(\w+)\s*=\s*(?:async\s*)?\(/;
const ENV_VAR_CLEANUP_REGEX = /[^A-Z0-9_]/g;

/**
 * Checks if a value is a GitHub Actions expression string.
 */
export function isGitHubExpression(value: unknown): value is GitHubExpression {
  if (typeof value !== "string") {
    return false;
  }
  // Match pattern: ${{ ... }}
  return GITHUB_EXPRESSION_REGEX.test(value);
}

/**
 * Serialize a non-expression argument value to code string.
 */
function serializeArgument(
  arg: string | number | boolean,
  language: "typescript" | "python"
): string {
  if (typeof arg === "string") {
    return JSON.stringify(arg);
  }
  if (typeof arg === "number") {
    return String(arg);
  }
  if (typeof arg === "boolean") {
    return language === "typescript" ? String(arg) : arg ? "True" : "False";
  }
  return String(arg);
}

/**
 * Process function arguments for TypeScript/JavaScript execution.
 * Converts GitHub expressions to code that reads from environment variables.
 *
 * @param args - Array of function arguments
 * @param language - Target language ('typescript' or 'python')
 * @returns Processed arguments as code strings
 */
export function processArguments(
  args: Array<string | number | boolean | GitHubExpression>,
  language: "typescript" | "python" = "typescript"
): string[] {
  return args.map((arg, index) => {
    if (isGitHubExpression(arg)) {
      return processGitHubExpression(arg, index, language);
    }
    return serializeArgument(arg, language);
  });
}

/**
 * Process a GitHub Actions expression for use in generated code.
 * Creates code that reads the expression value from environment variables.
 */
function processGitHubExpression(
  expression: GitHubExpression,
  index: number,
  language: "typescript" | "python"
): string {
  // Generate an environment variable name from the expression
  const envVarName = `GITHUB_EXPR_${index}`.toUpperCase().replace(ENV_VAR_CLEANUP_REGEX, "_");

  if (language === "typescript") {
    // For TypeScript, read from environment variable
    // The expression will be evaluated by GitHub Actions and set as env var
    return `process.env.${envVarName} || ${JSON.stringify(expression)}`;
  }
  // For Python
  return `os.environ.get(${JSON.stringify(envVarName)}, ${JSON.stringify(expression)})`;
}

/**
 * Generate code to set environment variables for GitHub expressions.
 * This code will be prepended to the function execution.
 *
 * @param args - Array of function arguments
 * @param language - Target language
 * @returns Code to set environment variables
 */
export function generateEnvVarCode(
  args: Array<string | number | boolean | GitHubExpression>,
  language: "typescript" | "python" = "typescript"
): string {
  const lines: string[] = [];

  if (language === "typescript") {
    args.forEach((arg, index) => {
      if (isGitHubExpression(arg)) {
        const envVarName = `GITHUB_EXPR_${index}`.toUpperCase().replace(ENV_VAR_CLEANUP_REGEX, "_");
        // In GitHub Actions, expressions are evaluated and we can use them directly
        // But for runtime, we'll set them as environment variables
        lines.push(`const ${envVarName} = process.env.${envVarName} || ${JSON.stringify(arg)};`);
      }
    });
  } else {
    lines.push("import os");
    args.forEach((arg, index) => {
      if (isGitHubExpression(arg)) {
        const envVarName = `GITHUB_EXPR_${index}`.toUpperCase().replace(ENV_VAR_CLEANUP_REGEX, "_");
        lines.push(
          `${envVarName} = os.environ.get(${JSON.stringify(envVarName)}, ${JSON.stringify(arg)})`
        );
      }
    });
  }

  return lines.join("\n");
}

/**
 * Generate the wrapper code that executes the function with processed arguments.
 */
export function generateFunctionCallCode(
  functionSource: string,
  processedArgs: string[],
  language: "typescript" | "python" = "typescript"
): string {
  if (language === "typescript") {
    // For TypeScript, we need to wrap the function and call it
    // The function source should be a complete function definition
    return `
${functionSource}

// Execute the function
(async () => {
  try {
    const result = await (${getFunctionIdentifier(functionSource)}(${processedArgs.join(", ")}));
    if (result !== undefined) {
      console.log(result);
    }
    process.exit(0);
  } catch (error) {
    console.error("Error executing function:", error);
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
})();
`;
  }
  // Python
  return `
${functionSource}

# Execute the function
try:
    result = ${getFunctionIdentifier(functionSource)}(${processedArgs.join(", ")})
    if result is not None:
        print(result)
    exit(0)
except Exception as e:
    print(f"Error executing function: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    exit(1)
`;
}

/**
 * Extract function identifier from function source code.
 * This is a simple heuristic - may need improvement.
 */
function getFunctionIdentifier(source: string): string {
  // Try to extract function name
  const funcDeclMatch = source.match(FUNCTION_DECL_REGEX);
  if (funcDeclMatch) {
    return funcDeclMatch[1];
  }

  // Try arrow function assigned to const
  const constMatch = source.match(ARROW_FUNCTION_REGEX);
  if (constMatch) {
    return constMatch[1];
  }

  // Default: assume it's an anonymous function that needs to be wrapped
  return `(function() { return ${source}; })()`;
}
