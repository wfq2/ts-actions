import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
// biome-ignore lint/style/noNamespaceImport: TypeScript compiler API requires namespace import
import * as ts from "typescript";
import type { TypeScriptFunction } from "../core/types.js";

// Regex patterns for stack trace parsing (moved to top level for performance)
const STACK_TRACE_PATTERN1 = /\(([^:]+):(\d+):\d+\)/;
const STACK_TRACE_PATTERN2 = /([^:]+):(\d+):\d+/;

export interface ExtractedFunction {
  source: string;
  sourceFile: string;
  functionName: string | null;
  startLine: number;
  endLine: number;
}

/**
 * Extract function source code from TypeScript source file using stack trace and AST parsing.
 *
 * @param fn - The function to extract
 * @param stackTrace - Optional stack trace string (will be generated if not provided)
 * @returns Extracted function information or null if extraction fails
 */
export function extractTypeScriptFunction(
  fn: TypeScriptFunction,
  stackTrace?: string
): ExtractedFunction | null {
  try {
    const stack = stackTrace || new Error("TypeScript function extraction").stack || "";
    const sourceLocation = parseStackTrace(stack);

    if (!sourceLocation) {
      console.warn(
        "Could not determine source location from stack trace. Function extraction may fail."
      );
      return null;
    }

    const { filePath, lineNumber } = sourceLocation;
    const sourceCode = readFileSync(filePath, "utf-8");

    // Find the function in the AST
    const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);

    const functionNode = findFunctionInAST(sourceFile, fn, lineNumber);

    if (!functionNode) {
      console.warn(`Could not find function definition in ${filePath} near line ${lineNumber}`);
      return null;
    }

    // Extract function source
    const source = extractFunctionSource(sourceFile, functionNode);
    const startLine = sourceFile.getLineAndCharacterOfPosition(functionNode.getStart()).line + 1;
    const endLine = sourceFile.getLineAndCharacterOfPosition(functionNode.getEnd()).line + 1;

    return {
      source,
      sourceFile: filePath,
      functionName: getFunctionName(functionNode),
      startLine,
      endLine,
    };
  } catch (error) {
    console.error("Error extracting TypeScript function:", error);
    return null;
  }
}

/**
 * Parse stack trace to find source file and line number.
 */
function parseStackTrace(stack: string): { filePath: string; lineNumber: number } | null {
  const lines = stack.split("\n");

  // Look for stack frames that reference our source files (not node_modules)
  // Skip internal frames from Step class and workflow-processor
  for (const line of lines) {
    // Match patterns like: "    at ... (file:///path/to/file.ts:123:45)"
    // or: "    at ... (/path/to/file.ts:123:45)"
    const match = line.match(STACK_TRACE_PATTERN1) || line.match(STACK_TRACE_PATTERN2);

    if (match) {
      const filePath = resolve(match[1]);
      const lineNumber = Number.parseInt(match[2], 10);

      // Skip node_modules, dist directories, and internal files
      if (
        !filePath.includes("node_modules") &&
        !filePath.includes("dist") &&
        !filePath.includes("src/core/step.ts") &&
        !filePath.includes("src/synth/workflow-processor.ts") &&
        !filePath.includes("src/synth/function-extractor.ts") &&
        existsSync(filePath)
      ) {
        return { filePath, lineNumber };
      }
    }
  }

  return null;
}

/**
 * Find function node in AST based on function reference and approximate line number.
 * This function looks for runTypeScript calls and extracts the function argument.
 */
function findFunctionInAST(
  sourceFile: ts.SourceFile,
  fn: TypeScriptFunction,
  approximateLine: number
): ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | null {
  // First, try to find a runTypeScript call near the target line
  // and extract the function argument from it
  const runTypeScriptCall = findRunTypeScriptCall(sourceFile, approximateLine);
  if (runTypeScriptCall) {
    return runTypeScriptCall;
  }

  // Fallback to the old method for other cases
  const functionName = fn.name || null;

  // Walk the AST to find matching functions
  function visit(
    node: ts.Node
  ): ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | null {
    // Check if this is a function node near our target line
    const nodeStart = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

    // Check if node is within reasonable distance of target line (within 100 lines)
    // Increased range to handle cases where the call site is a few lines away
    const isNearTargetLine = Math.abs(nodeStart - approximateLine) < 100;

    if (isNearTargetLine) {
      if (ts.isFunctionDeclaration(node)) {
        // Match by name if available, otherwise match by proximity
        if (!functionName || (node.name && node.name.text === functionName)) {
          return node;
        }
      } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        // For arrow functions, check if they're assigned to a variable
        // Check parent node for variable declaration
        const parent = node.parent;
        if (parent && ts.isVariableDeclaration(parent)) {
          const varName = parent.name;
          if (ts.isIdentifier(varName)) {
            // If the function name matches the variable name, this is likely it
            if (functionName === varName.text) {
              return node;
            }
          }
        }
        // For anonymous functions or when name doesn't match, return the first one near target
        if (!functionName) {
          return node;
        }
      }
    }

    return ts.forEachChild(node, visit) || null;
  }

  return visit(sourceFile);
}

/**
 * Find a runTypeScript call near the target line and return its function argument.
 */
function findRunTypeScriptCall(
  sourceFile: ts.SourceFile,
  approximateLine: number
): ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | null {
  let foundCall: ts.CallExpression | null = null;

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr) && expr.name.text === "runTypeScript") {
        const callLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        // Check if this call is near our target line (within 10 lines for precision)
        if (Math.abs(callLine - approximateLine) < 10) {
          foundCall = node;
          return;
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // If we found a runTypeScript call, extract the first argument (the function)
  if (foundCall) {
    // TypeScript needs help here - we know foundCall is CallExpression
    const callExpr: ts.CallExpression = foundCall;
    if (callExpr.arguments.length > 0) {
      const arg = callExpr.arguments[0];
      if (
        ts.isFunctionDeclaration(arg) ||
        ts.isArrowFunction(arg) ||
        ts.isFunctionExpression(arg)
      ) {
        return arg;
      }
    }
  }

  return null;
}

/**
 * Extract function source code from AST node.
 */
function extractFunctionSource(
  sourceFile: ts.SourceFile,
  functionNode: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
): string {
  const printer = ts.createPrinter({ removeComments: false });
  return printer.printNode(ts.EmitHint.Unspecified, functionNode, sourceFile);
}

/**
 * Get function name from AST node.
 */
function getFunctionName(
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
): string | null {
  if (ts.isFunctionDeclaration(node) && node.name) {
    return node.name.text;
  }
  // For arrow functions and expressions, we might need to check parent
  // For now, return null for anonymous functions
  return null;
}
