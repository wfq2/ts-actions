import type { GitHubExpression } from "./types.js";

/**
 * Helper functions for creating structured and informative GitHub Actions run names.
 *
 * @stability stable
 */

/**
 * Creates a structured run name that includes workflow name, commit message, and actor.
 *
 * @example
 * ```typescript
 * workflow.runName(defaultRunName());
 * // Generates: "${{ github.workflow }}: ${{ github.event.head_commit.message }} by @${{ github.actor }}"
 * ```
 *
 * @stability stable
 */
export function defaultRunName(): GitHubExpression {
  return expr(
    "${{ github.workflow }}: ${{ github.event.head_commit.message }} by @${{ github.actor }}"
  );
}

/**
 * Creates a run name with workflow name and commit message only.
 *
 * @example
 * ```typescript
 * workflow.runName(runNameWithCommit());
 * // Generates: "${{ github.workflow }} - ${{ github.event.head_commit.message }}"
 * ```
 *
 * @stability stable
 */
export function runNameWithCommit(): GitHubExpression {
  return expr("${{ github.workflow }} - ${{ github.event.head_commit.message }}");
}

/**
 * Creates a run name with workflow name, branch, and actor.
 *
 * @example
 * ```typescript
 * workflow.runName(runNameWithBranch());
 * // Generates: "${{ github.workflow }} on ${{ github.ref_name }} by @${{ github.actor }}"
 * ```
 *
 * @stability stable
 */
export function runNameWithBranch(): GitHubExpression {
  return expr("${{ github.workflow }} on ${{ github.ref_name }} by @${{ github.actor }}");
}

/**
 * Creates a run name with workflow name, commit SHA (short), and commit message.
 *
 * @example
 * ```typescript
 * workflow.runName(runNameWithSha());
 * // Generates: "${{ github.workflow }} [${{ github.event.head_commit.id }}] ${{ github.event.head_commit.message }}"
 * ```
 *
 * @stability stable
 */
export function runNameWithSha(): GitHubExpression {
  return expr(
    "${{ github.workflow }} [${{ github.event.head_commit.id }}] ${{ github.event.head_commit.message }}"
  );
}

/**
 * Creates a custom run name using a template string with GitHub context variables.
 * The template should use GitHub Actions expression syntax.
 *
 * @param template - Template string with GitHub Actions expressions
 * @example
 * ```typescript
 * workflow.runName(customRunName("${{ github.workflow }} - PR #${{ github.event.pull_request.number }}"));
 * ```
 *
 * @stability stable
 */
export function customRunName(template: string): GitHubExpression {
  return expr(template);
}

/**
 * Helper function to create a GitHubExpression from a string.
 * @internal
 */
function expr(value: string): GitHubExpression {
  return value as GitHubExpression;
}
