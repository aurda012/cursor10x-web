import { GenerateRequestBody } from "@/types";
import { UserAnswers } from "@/types/chat";
import { PackageRequestBody, ErrorResponse } from "@/types";

/**
 * API client utilities for making requests to the backend endpoints
 */

/**
 * Fetch a generated artifact from the API
 *
 * @param artifactType - Type of artifact to generate (blueprint, architecture, guide, tasks)
 * @param userAnswers - User's answers to the agent's questions
 * @param previousContext - Optional previous context for the AI to consider
 * @param sessionId - Optional session ID for maintaining chat context
 * @param options - Optional additional settings for generation
 * @returns A ReadableStream for consuming the response
 */
export async function fetchGeneratedArtifact(
  artifactType: string,
  userAnswers: UserAnswers,
  previousContext?: string,
  sessionId?: string,
  options?: {
    format?: string;
    [key: string]: any;
  }
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`/api/generate/${artifactType}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userAnswers,
      previousContext,
      sessionId,
      options,
    }),
  });

  if (!response.ok) {
    // Try to parse error as JSON first
    let errorMessage = `Failed to generate ${artifactType}`;

    try {
      const errorData = (await response.json()) as ErrorResponse;

      // Handle specific error codes
      if (response.status === 429 && errorData.code === "RATE_LIMIT") {
        throw new Error(
          `${errorData.details || "API rate limit exceeded. Please try again in a few minutes."}`
        );
      }

      // Generic error message from API
      if (errorData.error) {
        errorMessage = `${errorMessage}: ${errorData.error}`;
        if (errorData.details) {
          errorMessage += ` - ${errorData.details}`;
        }
      }
    } catch (parseError) {
      // Fallback to text if not JSON
      const errorText = await response.text();
      errorMessage = `${errorMessage}: ${errorText || `Status ${response.status}`}`;
    }

    throw new Error(errorMessage);
  }

  // Return the stream
  return response.body as ReadableStream<Uint8Array>;
}

/**
 * Fetch a packaged project from the API
 *
 * @param payload - Request payload containing artifacts and project name
 * @returns Response object for handling the zip file
 */
export async function fetchPackage(
  payload: PackageRequestBody
): Promise<Response> {
  const response = await fetch("/api/package", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = "Failed to package project";

    try {
      const errorData = (await response.json()) as ErrorResponse;
      if (errorData.error) {
        errorMessage = `${errorMessage}: ${errorData.error}`;
      }
    } catch (parseError) {
      // If not JSON, use text
      const errorText = await response.text();
      errorMessage = `${errorMessage}: ${errorText || `Status ${response.status}`}`;
    }

    throw new Error(errorMessage);
  }

  return response;
}

// Functions for other API calls will be implemented in subsequent tasks
