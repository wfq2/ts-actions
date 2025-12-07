# Advanced Examples

This page contains advanced examples demonstrating complex patterns and features of ts-actions.

## Job Outputs with Type Safety

Using job outputs with full type safety:

```typescript
import {
  Workflow,
  Job,
  Step,
  needs,
  setOutput,
  synthesize
} from "ts-actions";

const buildJob = new Job("ubuntu-latest")
  .name("Build")
  .outputs({
    artifact: "${{ steps.build.outputs.path }}",
    version: "${{ steps.version.outputs.version }}",
    sha: "${{ github.sha }}"
  })
  .addStep((step) =>
    step
      .id("build")
      .name("Build application")
      .run([
        "npm run build",
        setOutput("path", "./dist/app.zip")
      ].join("\n"))
  )
  .addStep((step) =>
    step
      .id("version")
      .name("Get version")
      .run([
        "VERSION=$(node -p \"require('./package.json').version\")",
        setOutput("version", "$VERSION")
      ].join("\n"))
  );

const deployJob = new Job("ubuntu-latest")
  .name("Deploy")
  .needs(needs(buildJob))
  .addStep((step) =>
    step
      .name("Deploy")
      .run(`echo "Deploying version ${needs(buildJob).outputs.version}"`)
  );

const workflow = new Workflow("Build and Deploy")
  .onPush({ branches: ["main"] })
  .addJob("build", buildJob)
  .addJob("deploy", deployJob);

await synthesize(workflow, ".github/workflows");
```

## TypeScript Function Steps

Using TypeScript functions directly in workflow steps:

```typescript
import {
  Workflow,
  Job,
  Step,
  expr,
  synthesize
} from "ts-actions";

function processData(
  input: string,
  multiplier: number,
  prefix?: string
): string {
  const processed = input.repeat(multiplier);
  return prefix ? `${prefix}: ${processed}` : processed;
}

function validateInput(input: string): boolean {
  return input.length > 0 && /^[a-zA-Z0-9]+$/.test(input);
}

const workflow = new Workflow("TypeScript Functions")
  .onPush({ branches: ["main"] })
  .addJob("process", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) =>
        step
          .name("Process Data")
          .runTypeScript(
            processData,
            { nodeVersion: "20" },
            "test",
            3,
            "Result"
          )
      )
      .addStep((step) =>
        step
          .name("Validate")
          .runTypeScript(
            validateInput,
            expr("${{ github.event.inputs.data }}")
          )
      )
  );

await synthesize(workflow, ".github/workflows");
```

## Reusable Workflows

Creating reusable workflows that can be called by other workflows:

```typescript
import { Workflow, synthesize } from "ts-actions";

const reusableWorkflow = new Workflow("Reusable Deploy")
  .onWorkflowCall({
    inputs: {
      environment: {
        description: "Environment to deploy to",
        required: true,
        type: "string"
      },
      version: {
        description: "Version to deploy",
        required: false,
        type: "string",
        default: "latest"
      }
    },
    secrets: ["DEPLOY_KEY", "API_TOKEN"]
  })
  .addJob("deploy", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) =>
        step
          .name("Deploy")
          .run(
            `echo "Deploying version ${{ inputs.version }} to ${{ inputs.environment }}"`
          )
      )
  );

await synthesize(reusableWorkflow, ".github/workflows");
```

## Scheduled Workflows

Creating workflows that run on a schedule:

```typescript
import { Workflow, synthesize } from "ts-actions";

const workflow = new Workflow("Scheduled Backup")
  .onSchedule("0 2 * * *") // Daily at 2 AM
  .addJob("backup", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) =>
        step
          .name("Backup Database")
          .run("npm run backup:database")
      )
  );

await synthesize(workflow, ".github/workflows");
```

## Concurrency Control

Using concurrency to prevent overlapping runs:

```typescript
import { Workflow, synthesize } from "ts-actions";

const workflow = new Workflow("Deploy")
  .onPush({ branches: ["main"] })
  .addJob("deploy", (job) =>
    job
      .runsOn("ubuntu-latest")
      .concurrency("deployment-${{ github.ref }}", true)
      .addStep((step) =>
        step.name("Deploy").run("npm run deploy")
      )
  );

await synthesize(workflow, ".github/workflows");
```

## Custom Run Names

Using helper functions to create informative run names:

```typescript
import {
  Workflow,
  defaultRunName,
  runNameWithSha,
  customRunName,
  synthesize
} from "ts-actions";

// Using default run name
const workflow1 = new Workflow("CI")
  .runName(defaultRunName())
  .onPush({ branches: ["main"] })
  .addJob("test", (job) => /* ... */);

// Using SHA in run name
const workflow2 = new Workflow("CI")
  .runName(runNameWithSha())
  .onPush({ branches: ["main"] })
  .addJob("test", (job) => /* ... */);

// Custom run name
const workflow3 = new Workflow("CI")
  .runName(
    customRunName(
      "${{ github.workflow }} - PR #${{ github.event.pull_request.number }}"
    )
  )
  .onPullRequest()
  .addJob("test", (job) => /* ... */);

await synthesize(workflow1, ".github/workflows");
await synthesize(workflow2, ".github/workflows");
await synthesize(workflow3, ".github/workflows");
```

## Multiple Workflows in One File

Generating multiple workflows from a single file:

```typescript
import {
  Workflow,
  synthesizeMultiple
} from "ts-actions";

const ciWorkflow = new Workflow("CI")
  .onPush({ branches: ["main"] })
  .addJob("test", (job) => /* ... */);

const deployWorkflow = new Workflow("Deploy")
  .onWorkflowDispatch()
  .addJob("deploy", (job) => /* ... */);

const lintWorkflow = new Workflow("Lint")
  .onPullRequest()
  .addJob("lint", (job) => /* ... */);

await synthesizeMultiple(
  [
    { workflow: ciWorkflow },
    { workflow: deployWorkflow, filename: "production-deploy" },
    { workflow: lintWorkflow }
  ],
  ".github/workflows"
);
```

## Complex Matrix Strategy

Advanced matrix strategy with multiple dimensions:

```typescript
import { Workflow, synthesize } from "ts-actions";

const workflow = new Workflow("Cross-Platform Test")
  .onPush({ branches: ["main"] })
  .addJob("test", (job) =>
    job
      .runsOn("${{ matrix.os }}")
      .strategy({
        matrix: {
          os: ["ubuntu-latest", "windows-latest", "macos-latest"],
          node: ["18", "20", "22"],
          test-suite: ["unit", "integration", "e2e"]
        },
        "fail-fast": false,
        "max-parallel": 5
      })
      .addStep((step) =>
        step
          .name("Setup Node.js ${{ matrix.node }}")
          .uses("actions/setup-node@v4")
          .with({ "node-version": "${{ matrix.node }}" })
      )
      .addStep((step) =>
        step
          .name("Run ${{ matrix.test-suite }} tests")
          .run(`npm run test:${{ matrix.test-suite }}`)
      )
  );

await synthesize(workflow, ".github/workflows");
```

## Permissions and Security

Setting specific permissions for workflows:

```typescript
import { Workflow, synthesize } from "ts-actions";

const workflow = new Workflow("Secure Deploy")
  .onPush({ branches: ["main"] })
  .permissions({
    contents: "read",
    packages: "write",
    "pull-requests": "read",
    "id-token": "write" // Required for OIDC
  })
  .addJob("deploy", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) =>
        step
          .name("Authenticate")
          .uses("aws-actions/configure-aws-credentials@v4")
          .with({
            "role-to-assume": "${{ secrets.AWS_ROLE }}",
            "aws-region": "us-east-1"
          })
      )
      .addStep((step) =>
        step.name("Deploy").run("npm run deploy")
      )
  );

await synthesize(workflow, ".github/workflows");
```

