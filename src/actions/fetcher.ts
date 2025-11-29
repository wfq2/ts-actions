import { parse } from "yaml";
import type { ActionMetadata, ActionReference } from "./types.js";

const ACTION_YML_REGEX = /action\.yml$/;

/**
 * Fetch action.yml from GitHub for a specific action reference
 */
export async function fetchActionYml(reference: ActionReference): Promise<ActionMetadata> {
  const url = `https://raw.githubusercontent.com/${reference.owner}/${reference.repo}/${reference.version}/action.yml`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      // Try action.yaml as fallback
      if (response.status === 404) {
        const yamlUrl = url.replace(ACTION_YML_REGEX, "action.yaml");
        const yamlResponse = await fetch(yamlUrl);

        if (!yamlResponse.ok) {
          throw new Error(
            `Failed to fetch action.yml for ${reference.owner}/${reference.repo}@${reference.version}: ${yamlResponse.status} ${yamlResponse.statusText}`
          );
        }

        const yamlText = await yamlResponse.text();
        const metadata = parse(yamlText) as ActionMetadata;
        return metadata;
      }

      throw new Error(
        `Failed to fetch action.yml for ${reference.owner}/${reference.repo}@${reference.version}: ${response.status} ${response.statusText}`
      );
    }

    const yamlText = await response.text();
    const metadata = parse(yamlText) as ActionMetadata;

    // Validate that we got a valid action.yml structure
    if (!metadata.runs) {
      throw new Error(
        `Invalid action.yml: missing 'runs' section for ${reference.owner}/${reference.repo}@${reference.version}`
      );
    }

    return metadata;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      `Unexpected error fetching action.yml for ${reference.owner}/${reference.repo}@${reference.version}: ${String(error)}`
    );
  }
}
