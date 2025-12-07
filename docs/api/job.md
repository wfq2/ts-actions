# Job

The `Job` class represents a GitHub Actions job. Jobs define the steps that run on a specific runner, along with job-level configuration like dependencies, conditions, and environment variables.

## Constructor

### `new Job<TOutputs>(runsOn: Runner | Runner[])`

Creates a new job instance.

**Parameters:**
- `runsOn`: The runner(s) to use for this job. Can be a single runner string or an array of runners. Common values include:
  - `"ubuntu-latest"`, `"ubuntu-22.04"`, `"ubuntu-20.04"`
  - `"windows-latest"`, `"windows-2022"`, `"windows-2019"`
  - `"macos-latest"`, `"macos-14"`, `"macos-13"`
  - Any custom runner label as a string
- `TOutputs` (generic): Optional type parameter for type-safe job outputs

**Returns:** A new `Job` instance

**Example:**

```typescript
const job = new Job("ubuntu-latest");
```

## Methods

### `runsOn(runner: Runner | Runner[]): this`

Sets the runner(s) for this job. Overrides the runner specified in the constructor.

**Parameters:**
- `runner`: The runner(s) to use (same format as constructor)

**Returns:** The job instance for method chaining

**Example:**

```typescript
job.runsOn(["ubuntu-latest", "windows-latest"]);
```

### `name(name: string): this`

Sets a descriptive display name for this job. This appears in the GitHub Actions UI.

**Parameters:**
- `name`: The display name for the job

**Returns:** The job instance for method chaining

**Example:**

```typescript
job.name("Build and Test Application");
```

### `needs(dependencies): this`

Sets job dependencies. This job will wait for the specified jobs to complete before running.

**Parameters:**
- `dependencies`: Can be one of:
  - A single job ID string: `"job-name"`
  - An array of job ID strings: `["job1", "job2"]`
  - A job reference created with `needs()`: `needs(jobInstance)`
  - An array of job references: `[needs(job1), needs(job2)]`

**Returns:** The job instance for method chaining

**Example:**

```typescript
// Using job ID strings
job.needs("lint");
job.needs(["lint", "build"]);

// Using job references (type-safe)
import { needs } from "ts-actions";
const lintJob = new Job("ubuntu-latest") /* ... */;
job.needs(needs(lintJob));
```

### `if(condition: string): this`

Sets a conditional expression for this job. The job will only run if the condition evaluates to true.

**Parameters:**
- `condition`: A GitHub Actions expression that evaluates to a boolean

**Returns:** The job instance for method chaining

**Example:**

```typescript
job.if("github.ref == 'refs/heads/main'");
job.if("github.event.inputs.environment == 'production'");
```

### `addStep(...steps): this`

Adds step(s) to this job. Can accept Step instances or functions that configure steps.

**Parameters:**
- `steps`: One or more steps, where each step can be:
  - A `Step` instance
  - A function that receives a `Step` and returns a configured `Step`
  - An array of steps (which will be flattened)

**Returns:** The job instance for method chaining

**Example:**

```typescript
// Using functions
job.addStep((step) =>
  step.name("Checkout").uses("actions/checkout@v4")
);

// Adding multiple steps
job.addStep(
  (step) => step.name("Step 1").run("echo 'Step 1'"),
  (step) => step.name("Step 2").run("echo 'Step 2'")
);

// Using Step instances
const step1 = new Step().name("Step 1").run("echo 'Step 1'");
job.addStep(step1);
```

### `outputs<TOutputKeys>(outputs: TOutputKeys): Job<TOutputs & TOutputKeys>`

Defines outputs for this job. Outputs can be accessed by other jobs using `needs()`.

**Parameters:**
- `outputs`: An object mapping output names to GitHub Actions expressions that produce their values

**Returns:** A new Job instance with updated output types (for type safety)

**Example:**

```typescript
const job = new Job("ubuntu-latest")
  .outputs({
    version: "${{ steps.get-version.outputs.version }}",
    artifact: "${{ steps.build.outputs.path }}"
  });
```

See [Helper Functions](helpers.md#job-outputs) for more details on using job outputs.

### `env(variables: { [key: string]: string }): this`

Sets environment variables for this job. These will be available to all steps in the job.

**Parameters:**
- `variables`: An object mapping environment variable names to their values

**Returns:** The job instance for method chaining

**Example:**

```typescript
job.env({
  NODE_ENV: "production",
  API_KEY: "${{ secrets.API_KEY }}"
});
```

### `defaults(defaults: IJobDefaults): this`

Sets default values for steps in this job.

**Parameters:**
- `defaults`: Default step settings
  - `run`: Default run settings
    - `shell`: Default shell
    - `working-directory`: Default working directory

**Returns:** The job instance for method chaining

**Example:**

```typescript
job.defaults({
  run: {
    shell: "bash",
    "working-directory": "./src"
  }
});
```

### `timeoutMinutes(minutes: number): this`

Sets the maximum time (in minutes) the job is allowed to run before being cancelled.

**Parameters:**
- `minutes`: Timeout in minutes

**Returns:** The job instance for method chaining

**Example:**

```typescript
job.timeoutMinutes(30);
```

### `strategy(strategy: IJobStrategy): this`

Sets the build matrix strategy for this job. This allows running the job with different variable combinations.

**Parameters:**
- `strategy`: Strategy configuration
  - `matrix`: An object mapping variable names to arrays of values
  - `fail-fast`: Whether to cancel remaining jobs if one fails (default: true)
  - `max-parallel`: Maximum number of jobs to run in parallel

**Returns:** The job instance for method chaining

**Example:**

```typescript
job.strategy({
  matrix: {
    node: ["18", "20", "22"],
    os: ["ubuntu-latest", "windows-latest"]
  },
  "fail-fast": false,
  "max-parallel": 3
});
```

### `continueOnError(continueOnError = true): this`

Sets whether this job should continue even if one of its steps fails.

**Parameters:**
- `continueOnError`: Whether to continue on error (default: true)

**Returns:** The job instance for method chaining

**Example:**

```typescript
job.continueOnError(true);
```

### `concurrency(group: string, cancelInProgress?: boolean): this`

Sets concurrency settings for this job. Jobs in the same concurrency group will be limited to a certain number of concurrent runs.

**Parameters:**
- `group`: The concurrency group name (can include GitHub Actions expressions)
- `cancelInProgress` (optional): Whether to cancel in-progress runs when a new run starts (default: false)

**Returns:** The job instance for method chaining

**Example:**

```typescript
job.concurrency("deployment-${{ github.ref }}", true);
```

### `toJSON(): IJob`

Converts the job to its JSON configuration format. This is used internally by the synthesis functions.

**Returns:** The job configuration object

## Complete Example

```typescript
import { Job, Step, needs } from "ts-actions";

const buildJob = new Job("ubuntu-latest")
  .name("Build Application")
  .outputs({
    artifact: "${{ steps.build.outputs.path }}",
    version: "${{ steps.version.outputs.version }}"
  })
  .env({ NODE_ENV: "production" })
  .timeoutMinutes(30)
  .addStep((step) =>
    step.name("Build").run("npm run build")
  );

const testJob = new Job("ubuntu-latest")
  .name("Run Tests")
  .needs(needs(buildJob)) // Wait for build to complete
  .if("github.ref == 'refs/heads/main'") // Only run on main branch
  .strategy({
    matrix: {
      node: ["18", "20", "22"]
    }
  })
  .addStep((step) =>
    step.name("Test").run("npm test")
  );
```

