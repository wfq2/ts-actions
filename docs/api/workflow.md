# Workflow

The `Workflow` class is the main entry point for creating GitHub Actions workflows. It provides a fluent API for configuring workflow triggers, jobs, permissions, and other workflow-level settings.

## Constructor

### `new Workflow(name?: string)`

Creates a new workflow instance.

**Parameters:**
- `name` (optional): The workflow name as it will appear in GitHub Actions

**Returns:** A new `Workflow` instance

**Example:**

```typescript
const workflow = new Workflow("My CI Workflow");
```

## Methods

### `name(name: string): this`

Sets the workflow name.

**Parameters:**
- `name`: The workflow name

**Returns:** The workflow instance for method chaining

**Example:**

```typescript
workflow.name("Updated Workflow Name");
```

### `on(triggers: IWorkflowTrigger): this`

Sets workflow triggers. This method merges triggers with any existing ones.

**Parameters:**
- `triggers`: An object containing trigger configurations (see [Types](types.md) for details)

**Returns:** The workflow instance for method chaining

**Example:**

```typescript
workflow.on({
  push: { branches: ["main"] },
  pull_request: { branches: ["main"] }
});
```

### `onPush(options?: IPushTriggerOptions): this`

Adds a push trigger to the workflow. Replaces any existing push trigger.

**Parameters:**
- `options` (optional): Push trigger options
  - `branches`: Array of branch names to trigger on
  - `tags`: Array of tag names to trigger on
  - `paths`: Array of file paths that must change
  - `pathsIgnore`: Array of file paths to ignore

**Returns:** The workflow instance for method chaining

**Example:**

```typescript
workflow.onPush({
  branches: ["main", "develop"],
  paths: ["src/**", "package.json"]
});
```

### `onPullRequest(options?: IPullRequestTriggerOptions): this`

Adds a pull request trigger to the workflow. Replaces any existing pull request trigger.

**Parameters:**
- `options` (optional): Pull request trigger options
  - `branches`: Array of branch names to trigger on
  - `tags`: Array of tag names to trigger on
  - `paths`: Array of file paths that must change
  - `pathsIgnore`: Array of file paths to ignore
  - `types`: Array of PR event types (e.g., "opened", "synchronize", "closed")

**Returns:** The workflow instance for method chaining

**Example:**

```typescript
workflow.onPullRequest({
  branches: ["main"],
  types: ["opened", "synchronize"]
});
```

### `onWorkflowDispatch(inputs?: { [key: string]: IWorkflowDispatchInput }): this`

Adds a workflow dispatch (manual) trigger to the workflow. This allows the workflow to be triggered manually from the GitHub Actions UI.

**Parameters:**
- `inputs` (optional): Input definitions for manual workflow dispatch
  - Each input should have: `description`, `required`, `default`, `type`, and optionally `options` for choice types

**Returns:** The workflow instance for method chaining

**Example:**

```typescript
workflow.onWorkflowDispatch({
  environment: {
    description: "Environment to deploy to",
    required: true,
    type: "choice",
    options: ["staging", "production"]
  }
});
```

### `onSchedule(cron: string): this`

Adds a schedule trigger to the workflow. Can be called multiple times to add multiple schedules.

**Parameters:**
- `cron`: A cron expression defining when the workflow should run

**Returns:** The workflow instance for method chaining

**Example:**

```typescript
workflow.onSchedule("0 0 * * *"); // Daily at midnight
workflow.onSchedule("0 */6 * * *"); // Every 6 hours
```

### `onRepositoryDispatch(types?: string[]): this`

Adds a repository dispatch trigger to the workflow. This allows external events to trigger the workflow via the GitHub API.

**Parameters:**
- `types` (optional): Array of event type strings to listen for

**Returns:** The workflow instance for method chaining

**Example:**

```typescript
workflow.onRepositoryDispatch(["deploy", "build"]);
```

### `onWorkflowCall(options?: IWorkflowCallOptions): this`

Makes the workflow reusable by other workflows (workflow_call).

**Parameters:**
- `options` (optional): Workflow call options
  - `inputs`: Input definitions for the reusable workflow
  - `outputs`: Output definitions
  - `secrets`: Array of secret names that can be passed

**Returns:** The workflow instance for method chaining

**Example:**

```typescript
workflow.onWorkflowCall({
  inputs: {
    environment: {
      description: "Deployment environment",
      required: true,
      type: "string"
    }
  },
  secrets: ["DEPLOY_KEY"]
});
```

### `addJob<TOutputs>(jobId: JobId, job: Job<TOutputs>): this`
### `addJob<TOutputs>(jobId: JobId, jobFn: (job: Job) => Job<TOutputs>): this`

Adds a job to the workflow. Can accept either a Job instance or a function that configures a Job.

**Parameters:**
- `jobId`: The unique identifier for the job
- `job` or `jobFn`: Either a Job instance or a function that receives a Job and returns a configured Job

**Returns:** The workflow instance for method chaining

**Example:**

```typescript
// Using a function
workflow.addJob("build", (job) =>
  job.runsOn("ubuntu-latest").addStep(/* ... */)
);

// Using a Job instance
const myJob = new Job("ubuntu-latest")
  .addStep(/* ... */);
workflow.addJob("build", myJob);
```

### `env(variables: { [key: string]: string }): this`

Sets environment variables for the workflow. These will be available to all jobs in the workflow.

**Parameters:**
- `variables`: An object mapping environment variable names to their values

**Returns:** The workflow instance for method chaining

**Example:**

```typescript
workflow.env({
  NODE_ENV: "production",
  API_URL: "https://api.example.com"
});
```

### `defaults(defaults: IJobDefaults): this`

Sets default values for jobs in the workflow.

**Parameters:**
- `defaults`: Default job settings
  - `run`: Default run settings
    - `shell`: Default shell
    - `working-directory`: Default working directory

**Returns:** The workflow instance for method chaining

**Example:**

```typescript
workflow.defaults({
  run: {
    shell: "bash",
    "working-directory": "./src"
  }
});
```

### `permissions(permissions: IWorkflowPermissions): this`

Sets permissions for the workflow. This controls what the GitHub token can access.

**Parameters:**
- `permissions`: An object mapping permission names to access levels ("read", "write", or "none")

**Returns:** The workflow instance for method chaining

**Example:**

```typescript
workflow.permissions({
  contents: "read",
  packages: "write",
  "pull-requests": "write"
});
```

### `runName(name: string): this`

Sets the run name for workflow runs. This is what appears in the GitHub Actions UI.

**Parameters:**
- `name`: The run name (can include GitHub Actions expressions)

**Returns:** The workflow instance for method chaining

**Example:**

```typescript
workflow.runName("${{ github.workflow }}: ${{ github.event.head_commit.message }}");
```

See [Run Name Helpers](helpers.md#run-name-helpers) for helper functions.

### `toJSON(): IWorkflowConfig`

Converts the workflow to its JSON configuration format. This is used internally by the synthesis functions.

**Returns:** The workflow configuration object

**Example:**

```typescript
const config = workflow.toJSON();
console.log(config.name); // "My Workflow"
```

## Complete Example

```typescript
import { Workflow, Job, Step } from "ts-actions";

const workflow = new Workflow("CI/CD Pipeline")
  .onPush({ branches: ["main"] })
  .onPullRequest({ branches: ["main"] })
  .onWorkflowDispatch({
    environment: {
      description: "Environment to deploy to",
      required: true,
      type: "choice",
      options: ["staging", "production"]
    }
  })
  .env({ NODE_ENV: "production" })
  .permissions({
    contents: "read",
    packages: "write"
  })
  .addJob("test", (job) =>
    job
      .runsOn("ubuntu-latest")
      .addStep((step) =>
        step.name("Run tests").run("npm test")
      )
  )
  .addJob("deploy", (job) =>
    job
      .runsOn("ubuntu-latest")
      .needs("test")
      .addStep((step) =>
        step.name("Deploy").run("npm run deploy")
      )
  );
```

