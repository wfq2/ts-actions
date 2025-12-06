import * as ts from "typescript";
import type { GitHubExpression } from "../core/types.js";
import {
  generateEnvVarCode,
  generateFunctionCallCode,
  processArguments,
} from "./argument-processor.js";
import type { ExtractedFunction } from "./function-extractor.js";

export interface TranspiledResult {
  code: string;
  sourceMap?: string;
  dependencies: string[];
}

/**
 * Transpile TypeScript function to JavaScript with bundling support.
 *
 * @param extracted - Extracted function information
 * @param args - Function arguments (may include GitHub expressions)
 * @param options - Transpilation options
 * @returns Transpiled JavaScript code with source map
 */
export async function transpileTypeScriptFunction(
  extracted: ExtractedFunction,
  args: Array<string | number | boolean | GitHubExpression>,
  options?: { bundle?: boolean; nodeVersion?: string }
): Promise<TranspiledResult> {
  const { source, sourceFile } = extracted;
  const bundle = options?.bundle ?? true;

  // Process arguments
  const processedArgs = processArguments(args, "typescript");
  const envVarCode = generateEnvVarCode(args, "typescript");

  if (bundle) {
    // Use esbuild for bundling (if available) or fall back to TypeScript compiler
    return await transpileWithBundling(source, sourceFile, processedArgs, envVarCode, args);
  }
  // Simple transpilation without bundling
  return transpileWithoutBundling(source, sourceFile, processedArgs, envVarCode, args);
}

/**
 * Transpile TypeScript with bundling (using esbuild if available).
 */
async function transpileWithBundling(
  functionSource: string,
  sourceFile: string,
  processedArgs: string[],
  envVarCode: string,
  originalArgs: Array<string | number | boolean | GitHubExpression>
): Promise<TranspiledResult> {
  // Try to use esbuild if available
  try {
    // Dynamic import to avoid requiring esbuild as a hard dependency
    const esbuild = await import("esbuild");

    // Create a temporary entry file that imports the function
    const entryCode = `
${envVarCode}

${functionSource}

// Export for execution
export default ${getFunctionIdentifierFromSource(functionSource)};
`;

    const result = await esbuild.build({
      stdin: {
        contents: entryCode,
        resolveDir: process.cwd(),
        sourcefile: sourceFile,
        loader: "ts",
      },
      bundle: true,
      format: "esm",
      target: "node24",
      platform: "node",
      sourcemap: "inline",
      write: false,
      minify: false,
      keepNames: true,
      banner: {
        js: `
// Error handling wrapper
const originalConsoleError = console.error;
console.error = function(...args) {
  originalConsoleError.apply(console, args);
};
        `.trim(),
      },
    });

    if (result.errors.length > 0) {
      throw new Error(`Transpilation errors:\n${result.errors.map((e) => e.text).join("\n")}`);
    }

    const bundledCode = result.outputFiles[0]?.text || "";
    const executionCode = generateFunctionCallCode(bundledCode, processedArgs, "typescript");

    // Wrap in error handler with source map support
    const finalCode = wrapWithErrorHandler(executionCode, sourceFile);

    return {
      code: finalCode,
      sourceMap: result.outputFiles.find((f) => f.path.endsWith(".map"))?.text,
      dependencies: [], // esbuild bundles everything
    };
  } catch (error) {
    // If esbuild is not available or fails, fall back to TypeScript compiler
    console.warn(
      `esbuild not available, falling back to TypeScript compiler: ${error instanceof Error ? error.message : String(error)}`
    );
    return transpileWithoutBundling(
      functionSource,
      sourceFile,
      processedArgs,
      envVarCode,
      originalArgs
    );
  }
}

/**
 * Transpile TypeScript without bundling (basic transpilation only).
 */
function transpileWithoutBundling(
  functionSource: string,
  sourceFile: string,
  processedArgs: string[],
  envVarCode: string,
  _originalArgs: Array<string | number | boolean | GitHubExpression>
): TranspiledResult {
  // Use TypeScript compiler API
  const result = ts.transpileModule(functionSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      sourceMap: true,
      inlineSourceMap: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    },
    fileName: sourceFile,
  });

  const transpiledCode = result.outputText;
  const executionCode = generateFunctionCallCode(transpiledCode, processedArgs, "typescript");

  const fullCode = `
${envVarCode}

${executionCode}
`;

  const finalCode = wrapWithErrorHandler(fullCode, sourceFile);

  return {
    code: finalCode,
    sourceMap: result.sourceMapText,
    dependencies: extractImports(functionSource),
  };
}

/**
 * Wrap code with error handler that provides clear stack traces.
 */
function wrapWithErrorHandler(code: string, _sourceFile: string): string {
  return `
// Enhanced error handling with source map support
const originalError = Error;
Error.prepareStackTrace = function(error, stack) {
  // Try to map stack traces back to original source
  return stack.map(frame => {
    const fileName = frame.getFileName();
    const lineNumber = frame.getLineNumber();
    const columnNumber = frame.getColumnNumber();
    const functionName = frame.getFunctionName();
    
    // Provide clear error context
    return \`    at \${functionName || '<anonymous>'} (\${fileName}:\${lineNumber}:\${columnNumber})\`;
  }).join('\\n');
};

try {
${code
  .split("\n")
  .map((line) => `  ${line}`)
  .join("\n")}
} catch (error) {
  console.error("Error in TypeScript function:", error.message);
  if (error.stack) {
    console.error("Stack trace:");
    console.error(error.stack);
  }
  process.exit(1);
}
`.trim();
}

/**
 * Extract import statements from source code.
 */
function extractImports(source: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+(?:.+?\s+from\s+)?["']([^"']+)["']/g;
  let match: RegExpExecArray | null = null;

  // biome-ignore lint/suspicious/noAssignInExpressions: regex.exec() pattern is standard
  while ((match = importRegex.exec(source)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Extract function identifier from function source code.
 */
function getFunctionIdentifierFromSource(source: string): string {
  // Try function declaration
  const funcDeclMatch = source.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
  if (funcDeclMatch) {
    return funcDeclMatch[1];
  }

  // Try const/let/var arrow function
  const constMatch = source.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/);
  if (constMatch) {
    return constMatch[1];
  }

  // Try default export
  if (source.includes("export default")) {
    const defaultMatch = source.match(/export\s+default\s+(\w+)/);
    if (defaultMatch) {
      return defaultMatch[1];
    }
  }

  // Fallback: assume the function is already callable
  return `(function() { ${source} })()`;
}
