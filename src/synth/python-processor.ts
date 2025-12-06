import type { GitHubExpression } from "../core/types.js";
import { generateEnvVarCode, processArguments } from "./argument-processor.js";
import type { ExtractedFunction } from "./function-extractor.js";

export interface ProcessedPythonResult {
  code: string;
  dependencies: string[];
}

/**
 * Process Python function for execution in GitHub Actions.
 *
 * @param extracted - Extracted function information
 * @param args - Function arguments (may include GitHub expressions)
 * @param options - Processing options
 * @returns Processed Python code
 */
export function processPythonFunction(
  extracted: ExtractedFunction,
  args: Array<string | number | boolean | GitHubExpression>,
  _options?: { pythonVersion?: string }
): ProcessedPythonResult {
  const { source } = extracted;

  // Process arguments
  const processedArgs = processArguments(args, "python");
  const envVarCode = generateEnvVarCode(args, "python");

  // Combine everything
  const fullCode = `
import sys
import os
import json

${envVarCode}

${source}

# Execute the function
try:
    result = ${getPythonFunctionIdentifier(source)}(${processedArgs.join(", ")})
    if result is not None:
        print(result)
    sys.exit(0)
except Exception as e:
    print(f"Error executing Python function: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
`.trim();

  // Extract dependencies (imports)
  const dependencies = extractPythonImports(source);

  return {
    code: fullCode,
    dependencies,
  };
}

/**
 * Extract import statements from Python source code.
 */
function extractPythonImports(source: string): string[] {
  const imports: string[] = [];
  const lines = source.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Match various import patterns
    // import module
    // from module import something
    // import module as alias
    const importMatch = trimmed.match(/^(?:import|from)\s+([a-zA-Z0-9_.]+)/);
    if (importMatch) {
      imports.push(importMatch[1]);
    }
  }

  return imports;
}

/**
 * Extract function identifier from Python source code.
 */
function getPythonFunctionIdentifier(source: string): string {
  // Try to extract function name
  const funcMatch = source.match(/^def\s+(\w+)\s*\(/m);
  if (funcMatch) {
    return funcMatch[1];
  }

  // Try lambda
  const lambdaMatch = source.match(/(\w+)\s*=\s*lambda/);
  if (lambdaMatch) {
    return lambdaMatch[1];
  }

  // Default fallback
  return "function";
}
