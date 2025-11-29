import { ok, throws } from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { ActionsSetupNode4 } from "../.ts-actions/imports/index.js";
import { Step } from "../src/core/step.js";
import { Workflow } from "../src/core/workflow.js";
import { synthesize } from "../src/synth/yaml.js";
import { invalidStep } from "./workflows/invalid-step.js";
import { nodeTestWorkflow } from "./workflows/node-test.js";
import { simpleCIWorkflow } from "./workflows/simple-ci.js";
import { simpleDeployWorkflow } from "./workflows/simple-deploy.js";

const TEST_OUTPUT_DIR = join(process.cwd(), "tests", "output");

const INVALID_STEP_ERROR_REGEX =
  /Invalid step: a step cannot have both 'uses' and 'run' properties/;

// Clean up test output directory before tests
if (existsSync(TEST_OUTPUT_DIR)) {
  rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
}

test("synthesize simple CI workflow", () => {
  synthesize(simpleCIWorkflow, TEST_OUTPUT_DIR);

  const expectedFile = join(TEST_OUTPUT_DIR, "simple-ci.yml");
  ok(existsSync(expectedFile), "Output file should exist");

  const yamlContent = readFileSync(expectedFile, "utf-8");

  // Assert key components of the YAML
  ok(yamlContent.includes("name: Simple CI"), "Should contain workflow name");
  ok(yamlContent.includes("on:"), "Should contain 'on' trigger");
  ok(yamlContent.includes("push:"), "Should contain push trigger");
  ok(yamlContent.includes("branches:"), "Should contain branches");
  ok(yamlContent.includes("- main"), "Should contain main branch");
  ok(yamlContent.includes("jobs:"), "Should contain jobs");
  ok(yamlContent.includes("build:"), "Should contain build job");
  ok(yamlContent.includes("runs-on: ubuntu-latest"), "Should contain runs-on");
  ok(yamlContent.includes("Checkout code"), "Should contain checkout step name");
  ok(yamlContent.includes("actions/checkout@v4"), "Should contain checkout action");
  ok(yamlContent.includes("Run tests"), "Should contain test step name");
  ok(yamlContent.includes("npm test"), "Should contain test command");
});

test("synthesize simple Deploy workflow", () => {
  synthesize(simpleDeployWorkflow, TEST_OUTPUT_DIR);

  const expectedFile = join(TEST_OUTPUT_DIR, "simple-deploy.yml");
  ok(existsSync(expectedFile), "Output file should exist");

  const yamlContent = readFileSync(expectedFile, "utf-8");

  // Assert key components of the YAML
  ok(yamlContent.includes("name: Simple Deploy"), "Should contain workflow name");
  ok(yamlContent.includes("on:"), "Should contain 'on' trigger");
  ok(yamlContent.includes("workflow_dispatch:"), "Should contain workflow_dispatch trigger");
  ok(yamlContent.includes("jobs:"), "Should contain jobs");
  ok(yamlContent.includes("deploy:"), "Should contain deploy job");
  ok(yamlContent.includes("runs-on: ubuntu-latest"), "Should contain runs-on");
  ok(yamlContent.includes("Deploy"), "Should contain deploy step name");
  ok(yamlContent.includes("echo 'Deploying application'"), "Should contain deploy command");
});

test("synthesize Node Test workflow", () => {
  synthesize(nodeTestWorkflow, TEST_OUTPUT_DIR);

  const expectedFile = join(TEST_OUTPUT_DIR, "node-test.yml");
  ok(existsSync(expectedFile), "Output file should exist");

  const yamlContent = readFileSync(expectedFile, "utf-8");

  // Assert key components of the YAML
  ok(yamlContent.includes("name: Node Test"), "Should contain workflow name");
  ok(yamlContent.includes("on:"), "Should contain 'on' trigger");
  ok(yamlContent.includes("push:"), "Should contain push trigger");
  ok(yamlContent.includes("branches:"), "Should contain branches");
  ok(yamlContent.includes("- main"), "Should contain main branch");
  ok(yamlContent.includes("jobs:"), "Should contain jobs");
  ok(yamlContent.includes("test:"), "Should contain test job");
  ok(yamlContent.includes("runs-on: ubuntu-latest"), "Should contain runs-on");
  ok(yamlContent.includes("Checkout code"), "Should contain checkout step name");
  ok(yamlContent.includes("actions/checkout@v4"), "Should contain checkout action");
  ok(yamlContent.includes("Setup Node.js"), "Should contain setup node step name");
  ok(yamlContent.includes("actions/setup-node@v4"), "Should contain setup-node action");
  ok(yamlContent.includes("node-version"), "Should contain node-version input");
  ok(
    yamlContent.includes('"20"') || yamlContent.includes("'20'") || yamlContent.includes("20"),
    "Should contain node version 20"
  );
  ok(yamlContent.includes("Run tests"), "Should contain test step name");
  ok(yamlContent.includes("npm run test"), "Should contain npm run test command");
});

test("exported step with both uses and run should only have run (last called)", () => {
  // Test that when a step function calls both uses and run, only the last one is kept
  const workflow = new Workflow("Test Invalid Step")
    .onPush({ branches: ["main"] })
    .addJob("test", (job) => job.runsOn("ubuntu-latest").addStep(invalidStep));

  // Should not throw - the fix prevents the issue by clearing conflicting properties
  synthesize(workflow, TEST_OUTPUT_DIR);

  const expectedFile = join(TEST_OUTPUT_DIR, "test-invalid-step.yml");
  ok(existsSync(expectedFile), "Output file should exist");

  const yamlContent = readFileSync(expectedFile, "utf-8");
  // Should only have run, not uses (since run was called last)
  ok(yamlContent.includes("run:"), "Should contain run property");
  ok(
    !yamlContent.includes("uses:"),
    "Should not contain uses property when run is called after uses"
  );
});

test("step calling run after uses should clear uses property", () => {
  const step = new Step();
  step.uses(ActionsSetupNode4);
  step.run("npm ci");

  // Should not throw - run() clears uses
  const stepJson = step.toJSON();
  ok(stepJson.run === "npm ci", "Should have run property");
  ok(!stepJson.uses, "Should not have uses property after run is called");
});

test("step calling uses after run should clear run property", () => {
  const step = new Step();
  step.run("npm ci");
  step.uses(ActionsSetupNode4);

  // Should not throw - uses() clears run
  const stepJson = step.toJSON();
  ok(stepJson.uses, "Should have uses property");
  ok(!stepJson.run, "Should not have run property after uses is called");
});

test("step with both uses and run set directly should throw error in toJSON", () => {
  // Test the defensive check - if somehow both are set directly, it should throw
  const step = new Step();
  // Manually set both properties to test the defensive validation
  (step as unknown as { step: { uses?: string; run?: string } }).step = {
    uses: "actions/setup-node@v4",
    run: "npm ci",
  };

  throws(
    () => step.toJSON(),
    {
      message: INVALID_STEP_ERROR_REGEX,
    },
    "Should throw error when step has both uses and run set directly"
  );
});
