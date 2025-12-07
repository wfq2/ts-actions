# Helper Functions

ts-actions provides several helper functions to make working with workflows easier and more type-safe.

## Job Outputs

### `needs(job: Job<TOutputs>): JobOutputsRef<TOutputs>`
### `needs(...jobs: Job<TOutputs>[]): JobOutputsRef<TOutputs>[]`

Creates a type-safe reference to a job's outputs. This allows you to access job outputs with full TypeScript autocomplete and type checking.

**Parameters:**
- `job` or `jobs`: One or more Job instances that have outputs defined and an ID set

**Returns:** A job output reference object (or array) with:
- `id`: The job ID for use in `.needs()`
- `outputs`: An object with type-safe access to job outputs

**Example:**

```typescript
import { needs } from "ts-actions";

const buildJob = new Job("ubuntu-latest")
  .outputs({
    artifact: "${{ steps.build.outputs.path }}",
    version: "${{ steps.version.outputs.version }}"
  });

// Add job to workflow first
workflow.addJob("build", buildJob);

// Create a reference
const buildRef = needs(buildJob);

// Use in another job
const deployJob = new Job("ubuntu-latest")
  .needs(buildRef) // Type-safe job dependency
  .addStep((step) =>
    step.run(`echo "Deploying version ${buildRef.outputs.version}"`)
  );
```

### `steps<TOutputs>(stepId: string): StepOutputs<TOutputs>`

Creates a type-safe reference to a step's outputs.

**Parameters:**
- `stepId`: The step ID (must match the step's `id()` value)
- `TOutputs` (generic): Type parameter describing the step's outputs

**Returns:** An object with type-safe access to step outputs

**Example:**

```typescript
import { steps } from "ts-actions";

const step = new Step()
  .id("get-version")
  .name("Get Version")
  .run("echo 'version=1.0.0' >> $GITHUB_OUTPUT");

// Later, reference the step outputs
const versionRef = steps<{ version: string }>("get-version");

const nextStep = new Step()
  .name("Use Version")
  .run(`echo "Version is ${versionRef.outputs.version}"`);
```

### `setOutput(name: string, value: string | number | boolean): string`

Generates the shell command to set a step output in GitHub Actions. This is a convenience function that properly escapes values.

**Parameters:**
- `name`: The output name
- `value`: The output value (string, number, or boolean)

**Returns:** The shell command string that sets the output

**Example:**

```typescript
import { setOutput } from "ts-actions";

const step = new Step()
  .id("get-info")
  .name("Get Information")
  .run([
    "VERSION=$(node -p \"require('./package.json').version\")",
    setOutput("version", "$VERSION"),
    setOutput("timestamp", "$(date +%s)"),
    setOutput("deployed", true)
  ].join("\n"));
```

## Run Name Helpers

These functions help create structured and informative GitHub Actions run names.

### `defaultRunName(): GitHubExpression`

Creates a structured run name that includes workflow name, commit message, and actor.

**Returns:** A GitHub Actions expression string

**Example:**

```typescript
import { defaultRunName } from "ts-actions";

workflow.runName(defaultRunName());
// Generates: "${{ github.workflow }}: ${{ github.event.head_commit.message }} by @${{ github.actor }}"
```

### `runNameWithCommit(): GitHubExpression`

Creates a run name with workflow name and commit message only.

**Returns:** A GitHub Actions expression string

**Example:**

```typescript
import { runNameWithCommit } from "ts-actions";

workflow.runName(runNameWithCommit());
// Generates: "${{ github.workflow }} - ${{ github.event.head_commit.message }}"
```

### `runNameWithBranch(): GitHubExpression`

Creates a run name with workflow name, branch, and actor.

**Returns:** A GitHub Actions expression string

**Example:**

```typescript
import { runNameWithBranch } from "ts-actions";

workflow.runName(runNameWithBranch());
// Generates: "${{ github.workflow }} on ${{ github.ref_name }} by @${{ github.actor }}"
```

### `runNameWithSha(): GitHubExpression`

Creates a run name with workflow name, commit SHA (short), and commit message.

**Returns:** A GitHub Actions expression string

**Example:**

```typescript
import { runNameWithSha } from "ts-actions";

workflow.runName(runNameWithSha());
// Generates: "${{ github.workflow }} [${{ github.event.head_commit.id }}] ${{ github.event.head_commit.message }}"
```

### `customRunName(template: string): GitHubExpression`

Creates a custom run name using a template string with GitHub context variables.

**Parameters:**
- `template`: Template string with GitHub Actions expressions

**Returns:** A GitHub Actions expression string

**Example:**

```typescript
import { customRunName } from "ts-actions";

workflow.runName(
  customRunName("${{ github.workflow }} - PR #${{ github.event.pull_request.number }}")
);
```

## Expression Helper

### `expr(value: string): GitHubExpression`

Helper function to create a GitHubExpression from a string. This is useful when passing GitHub Actions expressions to functions that accept typed parameters.

**Parameters:**
- `value`: A string containing a GitHub Actions expression

**Returns:** A typed GitHubExpression

**Example:**

```typescript
import { expr } from "ts-actions";

function processData(input: string): void {
  // ...
}

const step = new Step()
  .runTypeScript(
    processData,
    expr("${{ steps.get-value.outputs.data }}")
  );
```

**Note:** This function is mainly used internally. In most cases, you can pass expression strings directly and TypeScript will accept them.

## Complete Example

```typescript
import {
  Workflow,
  Job,
  Step,
  needs,
  steps,
  setOutput,
  defaultRunName,
  expr
} from "ts-actions";

const workflow = new Workflow("CI/CD")
  .runName(defaultRunName())
  .addJob("build", (job) => {
    const buildStep = new Step()
      .id("build")
      .name("Build")
      .run([
        "npm run build",
        setOutput("artifact", "./dist/app.zip")
      ].join("\n"));

    const versionStep = new Step()
      .id("get-version")
      .name("Get Version")
      .run([
        "VERSION=$(node -p \"require('./package.json').version\")",
        setOutput("version", "$VERSION")
      ].join("\n"));

    return job
      .outputs({
        artifact: "${{ steps.build.outputs.artifact }}",
        version: "${{ steps.get-version.outputs.version }}"
      })
      .addStep(buildStep)
      .addStep(versionStep);
  })
  .addJob("deploy", (job) => {
    const buildRef = needs(/* build job reference */);
    
    return job
      .needs(buildRef)
      .addStep((step) =>
        step
          .name("Deploy")
          .run(`echo "Deploying version ${buildRef.outputs.version}"`)
      );
  });
```

