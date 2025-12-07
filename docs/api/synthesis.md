# Synthesis Functions

The synthesis functions convert workflow definitions into GitHub Actions YAML files. These functions process TypeScript function steps, convert workflows to JSON, and write YAML files to disk.

## Functions

### `synthesize(workflow: Workflow, outputDir?: string): Promise<void>`

Synthesizes a single workflow to a YAML file. The filename is automatically generated from the workflow name.

**Parameters:**
- `workflow`: The workflow instance to synthesize
- `outputDir` (optional): The output directory for the YAML file (default: `"dist"`)

**Returns:** A Promise that resolves when the file has been written

**Example:**

```typescript
import { Workflow, synthesize } from "ts-actions";

const workflow = new Workflow("CI")
  .onPush({ branches: ["main"] })
  .addJob("test", (job) => /* ... */);

// Synthesize to default directory (dist/)
await synthesize(workflow);

// Synthesize to custom directory
await synthesize(workflow, ".github/workflows");
```

The generated filename will be based on the workflow name:
- Workflow name: `"CI"` → Filename: `ci.yml`
- Workflow name: `"Build and Test"` → Filename: `build-and-test.yml`

### `synthesizeMultiple(workflows: Array<{ workflow: Workflow; filename?: string }>, outputDir?: string): Promise<void>`

Synthesizes multiple workflows to YAML files. This is useful when you have multiple workflows in a single file and want to generate them all at once.

**Parameters:**
- `workflows`: An array of objects, each containing:
  - `workflow`: The workflow instance to synthesize
  - `filename` (optional): Custom filename (without `.yml` extension). If not provided, the filename is generated from the workflow name.
- `outputDir` (optional): The output directory for the YAML files (default: `"dist"`)

**Returns:** A Promise that resolves when all files have been written

**Example:**

```typescript
import { Workflow, synthesizeMultiple } from "ts-actions";

const ciWorkflow = new Workflow("CI") /* ... */;
const deployWorkflow = new Workflow("Deploy") /* ... */;

// Synthesize multiple workflows
await synthesizeMultiple([
  { workflow: ciWorkflow },
  { workflow: deployWorkflow, filename: "production-deploy" }
], ".github/workflows");
```

This will generate:
- `ci.yml` (from workflow name)
- `production-deploy.yml` (custom filename)

## How It Works

1. **TypeScript Function Processing**: If the workflow contains steps with `runTypeScript()`, the function source code is extracted and transpiled to JavaScript during synthesis.

2. **JSON Conversion**: The workflow is converted to its JSON representation using `workflow.toJSON()`.

3. **YAML Generation**: The JSON is converted to YAML format with proper indentation.

4. **File Writing**: The YAML content is written to a file in the specified output directory. The directory is created if it doesn't exist.

## Complete Example

```typescript
import {
  Workflow,
  Job,
  Step,
  synthesize,
  synthesizeMultiple
} from "ts-actions";

// Single workflow
const ciWorkflow = new Workflow("CI")
  .onPush({ branches: ["main"] })
  .addJob("test", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) =>
        step.name("Test").run("npm test")
      )
  );

await synthesize(ciWorkflow, ".github/workflows");

// Multiple workflows
const workflows = [
  { workflow: ciWorkflow },
  {
    workflow: new Workflow("Lint")
      .onPullRequest()
      .addJob("lint", (job) => /* ... */),
    filename: "code-quality" // Custom filename
  }
];

await synthesizeMultiple(workflows, ".github/workflows");
```

## Notes

- Both functions are asynchronous and return Promises. Use `await` or `.then()` to wait for completion.
- The output directory will be created automatically if it doesn't exist.
- Filenames are sanitized (converted to lowercase, spaces replaced with hyphens).
- If a filename already includes the `.yml` extension, it won't be duplicated.

