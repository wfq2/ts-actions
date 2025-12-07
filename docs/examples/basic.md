# Basic Examples

This page contains basic examples of using ts-actions to create GitHub Actions workflows.

## Simple CI Workflow

A basic continuous integration workflow that runs on every push:

```typescript
import { Workflow, Job, Step, synthesize } from "ts-actions";

const workflow = new Workflow("CI")
  .onPush({ branches: ["main", "develop"] })
  .addJob("test", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) =>
        step
          .name("Checkout code")
          .uses("actions/checkout@v4")
      )
      .addStep((step) =>
        step
          .name("Setup Node.js")
          .uses("actions/setup-node@v4")
          .with({ "node-version": "20" })
      )
      .addStep((step) =>
        step
          .name("Install dependencies")
          .run("npm ci")
      )
      .addStep((step) =>
        step
          .name("Run tests")
          .run("npm test")
      )
  );

await synthesize(workflow, ".github/workflows");
```

## Multi-Job Workflow

A workflow with multiple jobs that run in parallel:

```typescript
import { Workflow, synthesize } from "ts-actions";

const workflow = new Workflow("Quality Checks")
  .onPullRequest()
  .addJob("lint", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) =>
        step.name("Run linter").run("npm run lint")
      )
  )
  .addJob("test", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) =>
        step.name("Run tests").run("npm test")
      )
  )
  .addJob("type-check", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) =>
        step.name("Type check").run("npm run type-check")
      )
  );

await synthesize(workflow, ".github/workflows");
```

## Job Dependencies

A workflow where jobs depend on each other:

```typescript
import { Workflow, Job, Step, needs, synthesize } from "ts-actions";

const buildJob = new Job("ubuntu-latest")
  .name("Build")
  .addStep((step) =>
    step.name("Build application").run("npm run build")
  );

const testJob = new Job("ubuntu-latest")
  .name("Test")
  .needs(needs(buildJob))
  .addStep((step) =>
    step.name("Run tests").run("npm test")
  );

const deployJob = new Job("ubuntu-latest")
  .name("Deploy")
  .needs(needs(buildJob))
  .addStep((step) =>
    step.name("Deploy").run("npm run deploy")
  );

const workflow = new Workflow("Build and Deploy")
  .onPush({ branches: ["main"] })
  .addJob("build", buildJob)
  .addJob("test", testJob)
  .addJob("deploy", deployJob);

await synthesize(workflow, ".github/workflows");
```

## Matrix Strategy

Running a job with multiple configurations:

```typescript
import { Workflow, synthesize } from "ts-actions";

const workflow = new Workflow("Test Matrix")
  .onPush({ branches: ["main"] })
  .addJob("test", (job) =>
    job
      .runsOn("ubuntu-latest")
      .strategy({
        matrix: {
          node: ["18", "20", "22"],
          os: ["ubuntu-latest", "windows-latest", "macos-latest"]
        },
        "fail-fast": false
      })
      .addStep((step) =>
        step
          .name("Setup Node.js ${{ matrix.node }}")
          .uses("actions/setup-node@v4")
          .with({ "node-version": "${{ matrix.node }}" })
      )
      .addStep((step) =>
        step.name("Run tests").run("npm test")
      )
  );

await synthesize(workflow, ".github/workflows");
```

## Manual Workflow Dispatch

A workflow that can be triggered manually:

```typescript
import { Workflow, synthesize } from "ts-actions";

const workflow = new Workflow("Deploy")
  .onWorkflowDispatch({
    environment: {
      description: "Environment to deploy to",
      required: true,
      type: "choice",
      options: ["staging", "production"]
    },
    version: {
      description: "Version to deploy",
      required: false,
      type: "string"
    }
  })
  .addJob("deploy", (job) =>
    job
      .runsOn("ubuntu-latest")
      .if("github.event.inputs.environment != ''")
      .addStep((step) =>
        step
          .name("Deploy to ${{ github.event.inputs.environment }}")
          .run("echo 'Deploying...'")
      )
  );

await synthesize(workflow, ".github/workflows");
```

## Conditional Steps

Using conditions to control when steps run:

```typescript
import { Workflow, synthesize } from "ts-actions";

const workflow = new Workflow("Conditional Workflow")
  .onPush({ branches: ["main"] })
  .addJob("build", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) =>
        step.name("Build").run("npm run build")
      )
      .addStep((step) =>
        step
          .name("Deploy to staging")
          .if("github.ref == 'refs/heads/main'")
          .run("npm run deploy:staging")
      )
      .addStep((step) =>
        step
          .name("Deploy to production")
          .if("github.ref == 'refs/heads/production'")
          .run("npm run deploy:production")
      )
  );

await synthesize(workflow, ".github/workflows");
```

## Environment Variables

Using environment variables at different levels:

```typescript
import { Workflow, synthesize } from "ts-actions";

const workflow = new Workflow("Environment Example")
  .onPush({ branches: ["main"] })
  .env({
    NODE_ENV: "production",
    LOG_LEVEL: "info"
  })
  .addJob("build", (job) =>
    job
      .runsOn("ubuntu-latest")
      .env({
        BUILD_TARGET: "production"
      })
      .addStep((step) =>
        step
          .name("Build")
          .env({
            DEBUG: "true"
          })
          .run("npm run build")
      )
  );

await synthesize(workflow, ".github/workflows");
```

