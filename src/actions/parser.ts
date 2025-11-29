import type { ActionReference } from "./types.js";

const ACTION_REF_REGEX = /^([^/@]+)\/([^/@]+)(?:@(.+))?$/;

/**
 * Parse an action reference string into its components
 * Examples:
 * - "actions/checkout@v4" -> { owner: "actions", repo: "checkout", version: "v4" }
 * - "actions/checkout@main" -> { owner: "actions", repo: "checkout", version: "main" }
 * - "owner/repo@abc123" -> { owner: "owner", repo: "repo", version: "abc123" }
 */
export function parseActionReference(actionRef: string): ActionReference {
  // Match pattern: owner/repo@version or owner/repo
  const match = actionRef.match(ACTION_REF_REGEX);

  if (!match) {
    throw new Error(
      `Invalid action reference format: "${actionRef}". Expected format: "owner/repo@version" or "owner/repo"`
    );
  }

  const [, owner, repo, version = "main"] = match;

  if (!(owner && repo)) {
    throw new Error(`Invalid action reference: "${actionRef}". Owner and repo are required.`);
  }

  return {
    owner,
    repo,
    version,
    full: actionRef,
  };
}

/**
 * Format an ActionReference back into a string
 */
export function formatActionReference(ref: ActionReference): string {
  return `${ref.owner}/${ref.repo}@${ref.version}`;
}
