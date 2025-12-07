# ts-actions

**TypeScript library for programmatically creating GitHub Actions workflows using a type-safe API**

ts-actions provides a fluent, type-safe API for building GitHub Actions workflows in TypeScript, similar to how cdk8s works for Kubernetes.

## Features

- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Multi-language**: Supports TypeScript/JavaScript and Python (via jsii)
- **Fluent API**: Chainable methods for building workflows
- **YAML Generation**: Automatically generates valid GitHub Actions YAML files
- **CLI Tool**: Command-line interface for synthesizing workflows

## Quick Example

```typescript
import { Workflow, Job, Step, synthesize } from "ts-actions";

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
          .name("Run tests")
          .run("npm test")
      )
  );

// Synthesize to YAML
await synthesize(workflow, ".github/workflows");
```

## Installation

=== "npm"

    ```bash
    npm install ts-actions
    ```

=== "pip"

    ```bash
    pip install ts-actions
    ```

## Getting Started

Ready to get started? Head over to the [Installation](getting-started/installation.md) guide and then check out the [Quick Start](getting-started/quick-start.md) tutorial.

## Documentation

- **[API Reference](api/workflow.md)** - Complete API documentation
- **[Examples](examples/basic.md)** - Code examples and patterns
- **[GitHub Repository](https://github.com/ts-actions/ts-actions)** - Source code and issues

## License

ISC

