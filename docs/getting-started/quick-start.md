# Quick Start

This guide will help you create your first GitHub Actions workflow using ts-actions.

## Basic Workflow

Let's create a simple CI workflow that runs tests on every push:

```typescript
import { Workflow, Job, Step, synthesize } from "ts-actions";

const workflow = new Workflow("CI")
  .onPush({ branches: ["main"] })
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
          .run("npm install")
      )
      .addStep((step) =>
        step
          .name("Run tests")
          .run("npm test")
      )
  );

// Synthesize to YAML file
await synthesize(workflow, ".github/workflows");
```

This will generate a `.github/workflows/ci.yml` file with the following content:

```yaml
name: CI
on:
  push:
    branches:
      - main
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
```

## Adding More Jobs

You can add multiple jobs to a workflow:

```typescript
const workflow = new Workflow("CI")
  .onPush({ branches: ["main"] })
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
  );
```

## Job Dependencies

You can make jobs depend on other jobs:

```typescript
import { needs } from "ts-actions";

const lintJob = new Job("ubuntu-latest")
  .addStep((step) => step.name("Lint").run("npm run lint"));

const testJob = new Job("ubuntu-latest")
  .needs(needs(lintJob))  // Wait for lint to complete
  .addStep((step) => step.name("Test").run("npm test"));

const workflow = new Workflow("CI")
  .onPush({ branches: ["main"] })
  .addJob("lint", lintJob)
  .addJob("test", testJob);
```

## Next Steps

- Check out the [API Reference](../api/workflow.md) for detailed documentation
- See more [Examples](../examples/basic.md) for advanced patterns

