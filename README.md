# ts-actions

TypeScript library for programmatically creating GitHub Actions workflows using a typesafe API, similar to how cdk8s works for Kubernetes.

## Features

- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Multi-language**: Supports TypeScript and Python (via jsii)
- **Fluent API**: Chainable methods for building workflows
- **YAML Generation**: Automatically generates valid GitHub Actions YAML files
- **CLI Tool**: Command-line interface for synthesizing workflows

## Installation

### TypeScript/JavaScript

```bash
npm install ts-actions
```

### Python

```bash
pip install ts-actions
```

## Usage

### TypeScript Example

```typescript
import { Workflow, Job, Step } from "ts-actions";

const workflow = new Workflow("CI")
  .onPush({ branches: ["main"] })
  .addJob("build", (job) =>
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

// Synthesize to YAML
import { synthesize } from "ts-actions";
synthesize(workflow, "dist");
```

### Python Example

```python
from ts_actions import Workflow, Job, Step, synthesize

workflow = Workflow("CI") \
    .on_push(branches=["main"]) \
    .add_job("build", lambda job: job
        .runs_on("ubuntu-latest")
        .add_step(lambda step: step
            .name("Checkout code")
            .uses("actions/checkout@v4")
        )
        .add_step(lambda step: step
            .name("Setup Node.js")
            .uses("actions/setup-node@v4")
            .with({"node-version": "20"})
        )
        .add_step(lambda step: step
            .name("Install dependencies")
            .run("npm install")
        )
        .add_step(lambda step: step
            .name("Run tests")
            .run("npm test")
        )
    )

# Synthesize to YAML
synthesize(workflow, "dist")
```

### Advanced Example

```typescript
import { Workflow, Job, Step } from "ts-actions";

const workflow = new Workflow("Deploy")
  .onWorkflowDispatch({
    environment: {
      description: "Environment to deploy to",
      required: true,
      type: "choice",
      options: ["staging", "production"],
    },
  })
  .addJob("deploy-staging", (job) =>
    job
      .runsOn("ubuntu-latest")
      .if("github.event.inputs.environment == 'staging'")
      .addStep((step) =>
        step
          .name("Deploy to staging")
          .run("echo 'Deploying to staging'")
      )
  )
  .addJob("deploy-production", (job) =>
    job
      .runsOn("ubuntu-latest")
      .if("github.event.inputs.environment == 'production'")
      .needs("deploy-staging")
      .addStep((step) =>
        step
          .name("Deploy to production")
          .run("echo 'Deploying to production'")
      )
  );

import { synthesize } from "ts-actions";
synthesize(workflow, "dist");
```

## API Reference

### Workflow

The main entry point for creating workflows.

```typescript
const workflow = new Workflow("Workflow Name")
  .onPush({ branches: ["main"] })
  .onPullRequest({ branches: ["main"] })
  .onWorkflowDispatch()
  .addJob("job-id", job => { /* ... */ })
  .env({ KEY: "value" })
  .permissions({ contents: "read" });
```

### Job

Represents a GitHub Actions job.

```typescript
const job = new Job("ubuntu-latest")
  .runsOn("ubuntu-latest")
  .needs(["job1", "job2"])
  .if("condition")
  .addStep(step => { /* ... */ })
  .env({ KEY: "value" })
  .timeoutMinutes(30)
  .strategy({
    matrix: { node: ["18", "20"] },
    "fail-fast": false,
  });
```

### Step

Represents a step within a job.

```typescript
const step = new Step()
  .name("Step name")
  .uses("actions/checkout@v4")
  .run("npm install")
  .with({ key: "value" })
  .env({ KEY: "value" })
  .if("condition")
  .continueOnError()
  .timeoutMinutes(10);
```

## CLI

The CLI tool provides a `synth` command for synthesizing workflows:

```bash
npx ts-actions synth <file> [options]
```

Options:
- `-o, --output <dir>`: Output directory for YAML files (default: `dist`)

## Scripts

- `npm run build` - Compile TypeScript to JavaScript and generate jsii assembly
- `npm run build:ts` - Compile TypeScript to JavaScript only
- `npm run build:jsii` - Generate jsii assembly
- `npm run build:python` - Generate Python package
- `npm run watch` - Watch mode for development
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome
- `npm run check` - Run linter and auto-fix issues
- `npm run synth` - Synthesize workflows (example)

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Make changes to the source code in `src/`
4. Build: `npm run build`
5. Format and lint: `npm run check`

### Building Python Package

To generate the Python package:

```bash
npm run build:python
```

This will create the Python package in the `dist/python` directory.

## License

ISC

