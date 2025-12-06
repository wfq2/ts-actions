import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as ts from "typescript";

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
  fn: Function,
  stackTrace?: string
): ExtractedFunction | null {
  try {
    const stack = stackTrace || new Error().stack || "";
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
 * Extract Python function source code from source file.
 * For now, this is a placeholder - Python extraction will be implemented later.
 */
export function extractPythonFunction(
  _fn: Function,
  _stackTrace?: string
): ExtractedFunction | null {
  // TODO: Implement Python function extraction
  console.warn("Python function extraction not yet implemented");
  return null;
}

/**
 * Parse stack trace to find source file and line number.
 */
function parseStackTrace(stack: string): { filePath: string; lineNumber: number } | null {
  const lines = stack.split("\n");

  // Look for stack frames that reference our source files (not node_modules)
  for (const line of lines) {
    // Match patterns like: "    at ... (file:///path/to/file.ts:123:45)"
    // or: "    at ... (/path/to/file.ts:123:45)"
    const match = line.match(/\(([^:]+):(\d+):\d+\)/) || line.match(/([^:]+):(\d+):\d+/);

    if (match) {
      const filePath = resolve(match[1]);
      const lineNumber = Number.parseInt(match[2], 10);

      // Skip node_modules and dist directories
      if (
        !filePath.includes("node_modules") &&
        !filePath.includes("dist") &&
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
 */
function findFunctionInAST(
  sourceFile: ts.SourceFile,
  fn: Function,
  approximateLine: number
): ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | null {
  const functionName = fn.name || null;

  // Walk the AST to find matching functions
  function visit(
    node: ts.Node
  ): ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | null {
    // Check if this is a function node near our target line
    const nodeStart = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

    // Check if node is within reasonable distance of target line (within 50 lines)
    const isNearTargetLine = Math.abs(nodeStart - approximateLine) < 50;

    if (isNearTargetLine) {
      if (ts.isFunctionDeclaration(node)) {
        // Match by name if available, otherwise match by proximity
        if (!functionName || (node.name && node.name.text === functionName)) {
          return node;
        }
      } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        // For anonymous functions, we'll need to match by context
        // For now, return the first arrow function/expression near the target line
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
