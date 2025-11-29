import { resolve } from "node:path";
import { Command } from "commander";
import { fetchActionYml } from "../actions/fetcher.js";
import { generateActionTypeName } from "../actions/generator.js";
import { parseActionReference } from "../actions/parser.js";
import { getRegistryEntry, isActionImported, saveImportedAction } from "../actions/storage.js";

const program = new Command();

program
  .name("ts-actions")
  .description("Synthesize GitHub Actions workflows from TypeScript")
  .version("1.0.0");

program
  .command("synth")
  .description("Synthesize workflows from a TypeScript file")
  .argument("<file>", "Path to TypeScript file containing workflow definitions")
  .option("-o, --output <dir>", "Output directory for YAML files", "dist")
  .action((file: string, options: { output: string }) => {
    try {
      const filePath = resolve(file);

      // Create a temporary module context to evaluate the file
      // In a real implementation, we might use a more sophisticated approach
      // For now, we'll require the user to export workflows
      console.log(`Reading workflow definitions from: ${filePath}`);
      console.log(`Output directory: ${options.output}`);

      // Note: This is a simplified version. In production, you'd want to:
      // 1. Use a proper TypeScript compiler API or ts-node/tsx to execute the file
      // 2. Extract exported workflows
      // 3. Synthesize them
      // For now, we'll provide a basic structure that users can extend

      console.log(
        "Note: The synth command requires workflows to be exported from the TypeScript file."
      );
      console.log("Example: export const myWorkflow = new Workflow('My Workflow')...");
      console.log("For now, please use the library API directly or extend this CLI.");
    } catch (error) {
      console.error("Error synthesizing workflows:", error);
      process.exit(1);
    }
  });

program
  .command("import")
  .description("Import a GitHub Action and generate type definitions")
  .argument("<action>", "Action reference (e.g., actions/checkout@v4)")
  .option("--force", "Force re-import even if already imported", false)
  .action(async (action: string, options: { force: boolean }) => {
    try {
      const reference = parseActionReference(action);

      // Check if already imported
      if (!options.force && isActionImported(reference)) {
        const entry = getRegistryEntry(reference);
        if (entry) {
          console.log(`Action ${action} is already imported (imported at ${entry.importedAt})`);
          console.log(`Type name: ${entry.typeName}`);
          console.log(
            `Type file: .ts-actions/imports/${reference.owner}/${reference.repo}/${reference.version}.ts`
          );
          return;
        }
      }

      console.log(`Fetching action.yml for ${action}...`);
      const metadata = await fetchActionYml(reference);

      console.log("Generating type definitions...");
      saveImportedAction(reference, metadata);

      const typeName = generateActionTypeName(reference.owner, reference.repo, reference.version);

      console.log(`✓ Successfully imported ${action}`);
      console.log(`  Type name: ${typeName}`);
      console.log(
        `  Type file: .ts-actions/imports/${reference.owner}/${reference.repo}/${reference.version}.ts`
      );
      console.log(`  Inputs: ${metadata.inputs ? Object.keys(metadata.inputs).length : 0}`);
      console.log(`  Outputs: ${metadata.outputs ? Object.keys(metadata.outputs).length : 0}`);
    } catch (error) {
      console.error("Error importing action:", error);
      if (error instanceof Error) {
        console.error(error.message);
      }
      process.exit(1);
    }
  });

program.parse();
