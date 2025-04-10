/**
 * API request and response types for Cursor10x Web App
 */
import { UserAnswers } from "./chat";

/**
 * Request body for artifact generation endpoints
 */
export interface GenerateRequestBody {
  /**
   * User's answers to the agent's questions
   */
  userAnswers: UserAnswers;

  /**
   * Optional previous context from generated artifacts
   */
  previousContext?: string;

  /**
   * Optional session ID for maintaining chat context
   */
  sessionId?: string;
}

/**
 * Request body for packaging the generated artifacts
 */
export interface PackageRequestBody {
  /**
   * Collection of generated artifacts
   */
  artifacts: Record<string, string>;

  /**
   * Name of the project
   */
  projectName: string;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  /**
   * Error message
   */
  error: string;

  /**
   * Optional error code
   */
  code?: string;

  /**
   * Optional additional details
   */
  details?: string | Record<string, any>;
}
