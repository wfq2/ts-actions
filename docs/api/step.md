# Step

The `Step` class represents a single step within a GitHub Actions job. Steps are the individual tasks that run sequentially within a job.

## Constructor

### `new Step()`

Creates a new step instance.

**Returns:** A new `Step` instance

**Example:**

```typescript
const step = new Step();
```

## Methods

### `id(id: string): this`

Sets a unique identifier for this step. The ID can be used to reference the step's outputs in other steps.

**Parameters:**
- `id`: The step identifier (must be unique within the job)

**Returns:** The step instance for method chaining

**Example:**

```typescript
step.id("build-step");
```

### `name(name: string): this`

Sets the display name for this step. This appears in the GitHub Actions UI.

**Parameters:**
- `name`: The step name

**Returns:** The step instance for method chaining

**Example:**

```typescript
step.name("Build Application");
```

### `uses(action: IActionClassType): this`

Sets the action to use for this step. When using `uses()`, you cannot use `run()` or `runTypeScript()`.

**Parameters:**
- `action`: An action class with a `reference` property (e.g., from imported action types)

**Returns:** The step instance for method chaining

**Example:**

```typescript
// Using action classes (requires importing action types)
step.uses(CheckoutAction);
```

**Note:** Action type imports are an advanced feature. Most users will use action references as strings in `run()` commands or use standard actions directly.

### `run(command: string): this`

Sets the command to run for this step. This is the most common way to execute commands. When using `run()`, you cannot use `uses()` or `runTypeScript()`.

**Parameters:**
- `command`: The shell command to execute

**Returns:** The step instance for method chaining

**Example:**

```typescript
step.run("npm install");
step.run("npm run build && npm test");
```

### `runTypeScript(fn, options?, ...args): this`

Runs a TypeScript function in this step. The function source will be extracted and transpiled during synthesis. This is useful for complex logic that would be difficult to write as shell commands.

**Parameters:**
- `fn`: The TypeScript function to execute
- `options` (optional): Configuration options
  - `nodeVersion`: Node.js version to use (default: "24")
- `args`: Arguments to pass to the function (can include GitHub Actions expressions using `expr()`)

**Returns:** The step instance for method chaining

**Example:**

```typescript
import { expr } from "ts-actions";

function processData(input: string, multiplier: number): string {
  return `${input} processed ${multiplier} times`;
}

step.runTypeScript(processData, {
  nodeVersion: "20"
}, "input-data", expr("${{ steps.get-value.outputs.count }}"));
```

**Note:** TypeScript function steps are processed during synthesis. The function source code is extracted and transpiled to JavaScript, then embedded in the workflow.

### `withInputs(inputs: { [key: string]: string | number | boolean }): this`

Sets input parameters for the action used in this step. This is only valid when using `uses()`.

**Parameters:**
- `inputs`: An object mapping input names to their values

**Returns:** The step instance for method chaining

**Example:**

```typescript
step.uses("actions/setup-node@v4")
  .withInputs({ "node-version": "20" });
```

### `with(inputs: { [key: string]: string | number | boolean }): this`

Alias for `withInputs()`. Provided for backward compatibility and familiarity with GitHub Actions YAML syntax.

**Parameters:**
- `inputs`: An object mapping input names to their values

**Returns:** The step instance for method chaining

**Example:**

```typescript
step.uses("actions/setup-node@v4")
  .with({ "node-version": "20" });
```

### `env(variables: { [key: string]: string }): this`

Sets environment variables for this step.

**Parameters:**
- `variables`: An object mapping environment variable names to their values (can include GitHub Actions expressions)

**Returns:** The step instance for method chaining

**Example:**

```typescript
step.env({
  NODE_ENV: "production",
  API_KEY: "${{ secrets.API_KEY }}"
});
```

### `continueOnError(continueOnError = true): this`

Sets whether this step should continue even if it fails. This prevents the job from failing if this step fails.

**Parameters:**
- `continueOnError`: Whether to continue on error (default: true)

**Returns:** The step instance for method chaining

**Example:**

```typescript
step.continueOnError(true);
```

### `timeoutMinutes(minutes: number): this`

Sets the maximum time (in minutes) the step is allowed to run before being cancelled.

**Parameters:**
- `minutes`: Timeout in minutes

**Returns:** The step instance for method chaining

**Example:**

```typescript
step.timeoutMinutes(10);
```

### `ifCondition(condition: string): this`

Sets a conditional expression for this step. The step will only run if the condition evaluates to true.

**Parameters:**
- `condition`: A GitHub Actions expression that evaluates to a boolean

**Returns:** The step instance for method chaining

**Example:**

```typescript
step.ifCondition("github.ref == 'refs/heads/main'");
```

### `if(condition: string): this`

Alias for `ifCondition()`. Provided for backward compatibility and familiarity with GitHub Actions YAML syntax.

**Parameters:**
- `condition`: A GitHub Actions expression that evaluates to a boolean

**Returns:** The step instance for method chaining

**Example:**

```typescript
step.if("github.ref == 'refs/heads/main'");
```

### `workingDirectory(directory: string): this`

Sets the working directory for this step. Commands will be executed in this directory.

**Parameters:**
- `directory`: The working directory path

**Returns:** The step instance for method chaining

**Example:**

```typescript
step.workingDirectory("./src");
```

### `toJSON(): IStep`

Converts the step to its JSON configuration format. This is used internally by the synthesis functions.

**Returns:** The step configuration object

## Complete Examples

### Basic Step

```typescript
const step = new Step()
  .name("Install Dependencies")
  .run("npm install");
```

### Step with Action

```typescript
const step = new Step()
  .name("Checkout Code")
  .uses("actions/checkout@v4")
  .with({ ref: "main" });
```

### Step with Environment Variables

```typescript
const step = new Step()
  .name("Deploy")
  .run("npm run deploy")
  .env({
    NODE_ENV: "production",
    API_URL: "${{ secrets.API_URL }}"
  })
  .if("github.ref == 'refs/heads/main'");
```

### Step with Outputs

```typescript
import { setOutput } from "ts-actions";

const step = new Step()
  .id("get-version")
  .name("Get Version")
  .run([
    "VERSION=$(node -p \"require('./package.json').version\")",
    setOutput("version", "$VERSION")
  ].join("\n"));
```

### TypeScript Function Step

```typescript
import { expr } from "ts-actions";

function generateConfig(env: string, port: number): string {
  return JSON.stringify({ environment: env, port });
}

const step = new Step()
  .name("Generate Config")
  .runTypeScript(
    generateConfig,
    { nodeVersion: "20" },
    expr("${{ github.event.inputs.environment }}"),
    8080
  );
```

