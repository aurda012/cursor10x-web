import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { GenerateRequestBody, ErrorResponse } from "@/types";
import * as prompts from "@/lib/prompts";

// Configure with higher default memory and longer execution time for AI generation
export const config = {
  runtime: 'edge',
  regions: ['iad1'], // Use the regions closest to your primary user base
  maxDuration: 300, // Reverting to 60 seconds for compatibility with Edge runtime
};

// In-memory store for chat history (in a production app, use a database)
const chatHistories = new Map<string, any[]>();

// Simplified logging function that works in all environments
const forceLog = (message: string) => {
  // Only log in non-production or use error channel in production
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG] ${message}`);
  } else {
    // Error logs are preserved in production
    console.error(`[PROD_LOG] ${message}`);
  }
};

/**
 * Handler for POST requests to the generate/[artifact] endpoint
 *
 * @param request - The incoming request object
 * @param params - The route parameters including the artifact name
 * @returns NextResponse with the generated content or error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { artifact: string } }
) {
  // Get artifact name from params
  const { artifact } = params;
  
  console.log(
    `Received request to generate artifact: ${artifact}`
  );

  try {
    // Parse the request body
    const body = (await request.json()) as GenerateRequestBody;

    // Validate inputs
    if (!body.userAnswers) {
      return NextResponse.json<ErrorResponse>(
        { error: "Missing userAnswers in request body" },
        { status: 400 }
      );
    }

    if (!artifact || typeof artifact !== "string") {
      return NextResponse.json<ErrorResponse>(
        { error: "Invalid artifact name" },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      forceLog("Missing Gemini API key in environment variables");
      return NextResponse.json<ErrorResponse>(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Initialize the Google Generative AI client with the new SDK
    const ai = new GoogleGenAI({ apiKey });
    const modelName = "gemini-2.5-pro-exp-03-25";

    // Generate a unique session ID based on the user's data if not provided
    const sessionId =
      body.sessionId ||
      `session_${Buffer.from(JSON.stringify(body.userAnswers)).toString("base64").substring(0, 10)}`;

    // Get or create chat history
    if (!chatHistories.has(sessionId)) {
      chatHistories.set(sessionId, []);
    }
    const history = chatHistories.get(sessionId) || [];

    // Select the appropriate prompt based on the artifact type - without relying on explicit previousContext
    let promptContent: string;
    const { userAnswers } = body;

    switch (artifact) {
      case "blueprint":
        promptContent = prompts.generateBlueprintPrompt(userAnswers);
        break;

      case "architecture":
        promptContent = prompts.generateArchitecturePrompt(userAnswers);
        break;

      case "guide":
        promptContent = prompts.generateGuidePrompt(userAnswers);
        break;

      case "tasks":
        promptContent = prompts.generateTasksPrompt(userAnswers);
        break;

      default:
        return NextResponse.json<ErrorResponse>(
          { error: `Unknown artifact type: ${artifact}` },
          { status: 400 }
        );
    }

    // Validate that we have a prompt to send
    if (!promptContent) {
      return NextResponse.json<ErrorResponse>(
        { error: "Failed to generate prompt content" },
        { status: 500 }
      );
    }

    try {
      // Make a single request to the Gemini API - NO retries
      forceLog(`Making request to Gemini API for ${artifact} - production mode`);

      let streamingResponse;
      try {
        // Set up generation configuration
        const generationConfig = {
          temperature:
            artifact === "blueprint" || artifact === "tasks" ? 0.6 : 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens:
            artifact === "blueprint" || artifact === "tasks" ? 64000 : 16384,
        };

        // Format chat history for the new API
        let formattedContents = [];

        // Add history if it exists
        if (history.length > 0) {
          console.log(
            `Using existing chat history for ${sessionId} with ${history.length} messages`
          );

          // Convert the history into the correct format for contents
          for (let i = 0; i < history.length; i += 2) {
            if (i + 1 < history.length) {
              // Add a user message
              formattedContents.push({
                role: "user",
                parts: [{ text: history[i] }],
              });

              // Add a model response
              formattedContents.push({
                role: "model",
                parts: [{ text: history[i + 1] }],
              });
            } else {
              // Handle odd number of messages (though this shouldn't happen in practice)
              formattedContents.push({
                role: "user",
                parts: [{ text: history[i] }],
              });
            }
          }
        }

        // Add the current prompt as the final user message
        formattedContents.push({
          role: "user",
          parts: [{ text: promptContent }],
        });

        console.log(
          `Requesting ${artifact} with ${history.length / 2} previous exchanges in context`
        );

        // Use the correct method to stream content
        streamingResponse = await ai.models.generateContentStream({
          model: modelName,
          contents: formattedContents,
          config: generationConfig,
        });
      } catch (error: any) {
        // Check if this is a rate limit error
        if (error.message?.includes("429") || error.status === 429) {
          forceLog(`Gemini API rate limit exceeded for ${artifact} - Returning error to client`);
          return NextResponse.json(
            {
              error: "API rate limit exceeded",
              details:
                "Our AI service is currently receiving too many requests. Please try again in a few minutes.",
              code: "RATE_LIMIT",
            },
            { status: 429 }
          );
        }

        // Not a rate limit error, log and return generic error
        forceLog(`Non-rate limit error calling Gemini API for ${artifact}: ${error.message || "Unknown error"}`);
        forceLog(`Full error details: ${JSON.stringify(error, null, 2)}`);
        return NextResponse.json(
          {
            error: "Failed to generate content with AI",
            details: error.message || "Unknown API error",
          },
          { status: 500 }
        );
      }

      if (!streamingResponse) {
        forceLog(`No response returned from Gemini API for ${artifact}`);
        return NextResponse.json(
          { error: "No response from AI service" },
          { status: 500 }
        );
      }

      // Add the current prompt to history
      history.push(promptContent);

      // Set up the streaming response from the API route
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            let responseText = "";
            let chunkCount = 0;
            let totalBytes = 0;
            let isControllerClosed = false;

            console.log(`Starting to stream ${artifact} response`);

            const safeEnqueue = (data: Uint8Array) => {
              if (isControllerClosed) return false;

              try {
                controller.enqueue(data);
                return true;
              } catch (error) {
                isControllerClosed = true;
                console.warn(
                  `Error enqueueing chunk: ${error instanceof Error ? error.message : String(error)}`
                );
                return false;
              }
            };

            const safeClose = () => {
              if (isControllerClosed) return;

              try {
                controller.close();
                isControllerClosed = true;
                console.log(`Stream controller closed for ${artifact}`);
              } catch (error) {
                console.warn(
                  `Error closing controller: ${error instanceof Error ? error.message : String(error)}`
                );
                isControllerClosed = true;
              }
            };

            // Process each chunk from the Gemini API stream
            try {
              forceLog(`Starting chunk processing for ${artifact}`);
              const chunkTimeStart = Date.now();
              let lastLogTime = Date.now();
              
              for await (const chunk of streamingResponse) {
                const currentTime = Date.now();
                
                if (isControllerClosed) {
                  forceLog(`Controller is closed, stopping streaming for ${artifact}`);
                  break;
                }
                
                // Log progress periodically but less frequently to avoid overwhelming logs
                if (currentTime - lastLogTime > 10000) { // Log every 10 seconds
                  forceLog(`Still processing chunks for ${artifact}, elapsed time: ${Math.floor((currentTime - chunkTimeStart)/1000)}s, chunks: ${chunkCount}`);
                  lastLogTime = currentTime;
                }

                // Get text from the chunk in the new API format
                const text = chunk.text;
                if (text) {
                  // For tasks artifact, strip markdown code block markers if present
                  let processedText = text;
                  if (artifact === "tasks") {
                    // Remove markdown code block markers from beginning and end of chunks
                    if (chunkCount === 0 && processedText.startsWith("```")) {
                      // Remove opening markdown markers from first chunk
                      processedText = processedText.replace(
                        /^```(json)?[\r\n]+/,
                        ""
                      );
                    }
                    if (processedText.endsWith("```")) {
                      // Remove closing markdown markers
                      processedText = processedText.replace(/[\r\n]+```$/, "");
                    }
                  }

                  responseText += processedText;
                  totalBytes += processedText.length;
                  chunkCount++;

                  // Only log key chunks to reduce log volume
                  if (chunkCount === 1 || chunkCount === 10 || chunkCount === 50 || chunkCount % 100 === 0) {
                    forceLog(`Sending chunk ${chunkCount} for ${artifact}, total bytes: ${totalBytes}`);
                  }

                  // Send the chunk to the client
                  if (!safeEnqueue(encoder.encode(processedText))) {
                    forceLog(`Failed to enqueue chunk ${chunkCount} for ${artifact}, stopping.`);
                    break;
                  }
                }
              }
              
              forceLog(`Completed chunk processing for ${artifact}: ${chunkCount} chunks, ${totalBytes} bytes in ${Math.floor((Date.now() - chunkTimeStart)/1000)}s`);
            } catch (streamError) {
              forceLog(`Error processing stream for ${artifact}: ${streamError instanceof Error ? streamError.message : String(streamError)}`);
              console.error(
                `Error processing stream for ${artifact}:`,
                streamError
              );
              if (!isControllerClosed) {
                responseText += `\n\nError: Stream processing was interrupted. ${streamError instanceof Error ? streamError.message : ""}`;
                safeEnqueue(
                  encoder.encode(
                    `\n\nError: Stream processing was interrupted. ${streamError instanceof Error ? streamError.message : ""}`
                  )
                );
                safeClose();
              }
            }

            // After all chunks are processed, add the full response to history
            console.log(
              `Streaming complete for ${artifact}: ${chunkCount} chunks, ${totalBytes} bytes`
            );

            // For tasks artifact, ensure we have valid JSON by removing any remaining markdown
            if (artifact === "tasks") {
              // Clean up any markdown formatting that might be present
              responseText = responseText
                .replace(/^```(json)?[\r\n]+/, "")
                .replace(/[\r\n]+```$/, "");
            }

            history.push(responseText);
            chatHistories.set(sessionId, history);

            // Safely close the controller
            safeClose();
          } catch (error) {
            console.error(
              `Error in streaming response for ${artifact}:`,
              error
            );
            try {
              controller.error(error);
            } catch (controllerError) {
              console.warn(
                `Could not report error to controller: ${controllerError instanceof Error ? controllerError.message : String(controllerError)}`
              );
            }
          }
        },
      });

      // Return a streaming response with the session ID in the headers
      return new NextResponse(customReadable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "X-Content-Type-Options": "nosniff",
          "X-Session-ID": sessionId,
        },
      });
    } catch (error: any) {
      console.error("Error calling Gemini API:", error);

      // Check if it's a rate limit error that escaped our retry logic
      if (error.message?.includes("429") || error.status === 429) {
        return NextResponse.json(
          {
            error: "API rate limit exceeded",
            details:
              "Our AI service is currently receiving too many requests. Please try again in a few minutes.",
            code: "RATE_LIMIT",
          },
          { status: 429 }
        );
      }

      return NextResponse.json<ErrorResponse>(
        { error: "Failed to generate content with AI" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing generate request:", error);
    return NextResponse.json<ErrorResponse>(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
}
