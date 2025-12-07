import { join } from "node:path";
import { synthesizeMultiple } from "../../src/synth/yaml.js";
import { docsWorkflow } from "./docs.js";
import { lintWorkflow } from "./lint.js";
import { testWorkflow } from "./test.js";

const OUTPUT_DIR = join(process.cwd(), ".github", "workflows");

// Synthesize all workflows
(async () => {
  await synthesizeMultiple(
    [
      { workflow: testWorkflow, filename: "test.yml" },
      { workflow: lintWorkflow, filename: "lint.yml" },
      { workflow: docsWorkflow, filename: "docs.yml" },
    ],
    OUTPUT_DIR
  );

  console.log(`✓ Synthesized workflows to ${OUTPUT_DIR}`);
})();
