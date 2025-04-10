import React, { useEffect, useState, useRef } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ArtifactBadge from "./ArtifactBadge";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface TasksViewerProps {
  stream: ReadableStream<Uint8Array>;
  onComplete?: (content: string) => void;
}

const TasksViewer: React.FC<TasksViewerProps> = ({ stream, onComplete }) => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimitError, setIsRateLimitError] = useState<boolean>(false);
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = contentContainerRef.current.scrollHeight;
    }
  };

  // Try to parse JSON safely
  const parseJsonSafely = (text: string) => {
    try {
      // JSON must start with { or [ and must end with matching } or ]
      // Skip parsing if it doesn't look like complete JSON
      const trimmed = text.trim();
      if (!trimmed) return null;
      
      // Check for a valid JSON structure
      const firstChar = trimmed[0];
      const lastChar = trimmed[trimmed.length - 1];
      
      // Ensure we have a complete JSON object or array
      const isObject = firstChar === '{' && lastChar === '}';
      const isArray = firstChar === '[' && lastChar === ']';
      
      if (!isObject && !isArray) return null;
      
      // Try to parse it
      return JSON.parse(trimmed);
    } catch (e) {
      // Only log if we're not processing a streaming response
      if (!isLoading) {
        console.error("Failed to parse JSON:", e);
      }
      return null;
    }
  };

  // Process the stream when component mounts or when retryCount changes
  useEffect(() => {
    let isMounted = true;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    // Reset state on new stream
    if (isMounted) {
      setContent("");
      setError(null);
      setIsLoading(true);
      setIsRateLimitError(false);
      setParsedJson(null);
    }

    if (!stream) {
      if (isMounted) {
        setError("No stream provided");
        setIsLoading(false);
      }
      return;
    }

    // Check if stream is locked
    if (stream.locked) {
      console.log("Tasks stream is locked, cannot read");
      if (isMounted) {
        setError("Stream is already being read elsewhere");
        setIsLoading(false);
      }
      return;
    }

    // Function to read the stream
    const processStream = async () => {
      try {
        reader = stream.getReader();
        const decoder = new TextDecoder();
        let result = "";

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            if (isMounted) {
              setIsLoading(false);

              // Try to parse as JSON one last time
              const finalParsedData = parseJsonSafely(result);
              if (finalParsedData) {
                setParsedJson(finalParsedData);
              }

              if (onComplete) onComplete(result);
            }
            break;
          }

          const text = decoder.decode(value, { stream: true });
          result += text;

          if (isMounted) {
            setContent(result);

            // Only try to parse as JSON if it looks like a complete JSON
            // Avoid trying to parse incomplete JSON during streaming
            if (result.trim().endsWith('}') || result.trim().endsWith(']')) {
              const parsedData = parseJsonSafely(result);
              if (parsedData) {
                setParsedJson(parsedData);
              }
            }
          }
        }
      } catch (err: any) {
        console.error("Tasks stream error:", err);

        if (isMounted) {
          const errorMessage = err.message || "Error processing stream";
          let displayError = errorMessage;

          // Customize error messages for better UX
          if (errorMessage.toLowerCase().includes("network")) {
            displayError =
              "Network error while loading tasks. Please check your connection and try again.";
          } else if (errorMessage.toLowerCase().includes("abort")) {
            displayError = "Request was aborted. Please try again.";
          } else if (errorMessage.toLowerCase().includes("locked")) {
            displayError =
              "The stream is being read elsewhere. Please refresh and try again.";
          }

          setError(displayError);

          // Check if this is a rate limit error
          if (
            errorMessage.toLowerCase().includes("rate limit") ||
            errorMessage.toLowerCase().includes("429") ||
            errorMessage.toLowerCase().includes("too many requests")
          ) {
            setIsRateLimitError(true);
          }

          setIsLoading(false);
        }
      } finally {
        if (reader) {
          try {
            reader.releaseLock();
          } catch (e) {
            console.error("Error releasing reader lock:", e);
          }
        }
      }
    };

    // Start processing the stream
    processStream();

    // Cleanup function
    return () => {
      isMounted = false;
      // Make sure to release the reader lock if the component unmounts
      if (reader) {
        try {
          reader.releaseLock();
        } catch (e) {
          console.error("Error releasing reader lock during cleanup:", e);
        }
      }
    };
  }, [stream, onComplete, retryCount]);

  // Add useEffect to scroll to bottom when content changes
  useEffect(() => {
    scrollToBottom();
  }, [content]);

  const handleRetry = () => {
    if (!stream) return;

    if (stream.locked) {
      setError("Stream is locked and cannot be retried directly");
      setIsLoading(false);
      return;
    }

    // Increment retry count to trigger the useEffect
    setRetryCount((prev) => prev + 1);
  };

  // Render loading state
  if (isLoading && !content) {
    return (
      <div className="bg-background flex min-h-[200px] flex-col items-center justify-center rounded-lg border p-4">
        <ArtifactBadge artifactType="tasks" />
        <Loader2 className="text-primary my-4 h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">
          Generating development tasks...
        </p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {isRateLimitError ? "Rate Limit Exceeded" : "Error"}
        </AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          {isRateLimitError
            ? "The API request was rate limited. Please wait a moment and try again."
            : error}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 self-start"
            onClick={handleRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Render content
  return (
    <div className="flex w-full flex-col">
      <div className="mb-2 flex items-center">
        <ArtifactBadge artifactType="tasks" />
        <h3 className="ml-2 text-sm font-medium">Development Tasks</h3>
      </div>
      <div 
        ref={contentContainerRef} 
        className="bg-card rounded-lg border p-4 max-h-[500px] overflow-auto"
      >
        {parsedJson ? (
          <SyntaxHighlighter
            language="json"
            style={vscDarkPlus}
            customStyle={{ maxWidth: "100%" }}
            wrapLines={true}
            wrapLongLines={true}
          >
            {JSON.stringify(parsedJson, null, 2)}
          </SyntaxHighlighter>
        ) : (
          <pre className="overflow-x-auto text-sm whitespace-pre-wrap">
            <code>{content}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

export default TasksViewer;
