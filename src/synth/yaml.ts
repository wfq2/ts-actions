import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";
import type { Workflow } from "../core/workflow.js";

/**
 * Synthesizes a workflow to a YAML file.
 *
 * @param workflow - The workflow to synthesize
 * @param outputDir - The output directory (default: "dist")
 * @stability stable
 */
export function synthesize(workflow: Workflow, outputDir = "dist"): void {
  const config = workflow.toJSON();
  const yamlContent = stringify(config, {
    indent: 2,
  });

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Generate filename from workflow name or use default
  const workflowName = config.name || "workflow";
  const filename = `${workflowName.toLowerCase().replace(/\s+/g, "-")}.yml`;
  const filePath = join(outputDir, filename);

  writeFileSync(filePath, yamlContent, "utf-8");
}

/**
 * Synthesizes multiple workflows to YAML files.
 *
 * @param workflows - Array of workflows with optional filenames
 * @param outputDir - The output directory (default: "dist")
 * @stability stable
 */
export function synthesizeMultiple(
  workflows: Array<{ workflow: Workflow; filename?: string }>,
  outputDir = "dist"
): void {
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  for (const { workflow, filename } of workflows) {
    const config = workflow.toJSON();
    const yamlContent = stringify(config, {
      indent: 2,
    });

    // Use provided filename or generate from workflow name
    const workflowName = filename || config.name || "workflow";
    const finalFilename = workflowName.endsWith(".yml")
      ? workflowName
      : `${workflowName.toLowerCase().replace(/\s+/g, "-")}.yml`;
    const filePath = join(outputDir, finalFilename);

    writeFileSync(filePath, yamlContent, "utf-8");
  }
}
