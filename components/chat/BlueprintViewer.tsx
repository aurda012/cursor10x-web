import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ArtifactBadge from "./ArtifactBadge";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface BlueprintViewerProps {
  stream: ReadableStream<Uint8Array>;
  onComplete?: (content: string) => void;
}

const BlueprintViewer: React.FC<BlueprintViewerProps> = ({
  stream,
  onComplete,
}) => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimitError, setIsRateLimitError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = contentContainerRef.current.scrollHeight;
    }
  };

  // Process the stream when the component mounts or when the stream prop changes
  useEffect(() => {
    let isMounted = true;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    // Reset state on new stream
    if (isMounted) {
      setContent("");
      setError(null);
      setIsLoading(true);
      setIsRateLimitError(false);
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
      console.log("Blueprint stream is locked, cannot read");
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
              if (onComplete) onComplete(result);
            }
            break;
          }

          const text = decoder.decode(value, { stream: true });
          result += text;

          if (isMounted) {
            setContent(result);
          }
        }
      } catch (err: any) {
        console.error("Blueprint stream error:", err);

        if (isMounted) {
          const errorMessage = err.message || "Error processing stream";
          setError(errorMessage);

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

  // Handle retry
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

  // Loading indicator
  if (isLoading && !content) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="text-primary mb-2 h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading blueprint...</p>
      </div>
    );
  }

  // Error display with retry option
  if (error) {
    return (
      <div className="p-4">
        <Alert variant={isRateLimitError ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {isRateLimitError
              ? "Rate Limit Exceeded"
              : stream?.locked
                ? "Stream Locked"
                : "Error Loading Blueprint"}
          </AlertTitle>
          <AlertDescription>
            {isRateLimitError
              ? "Our AI service is currently experiencing high demand. Please wait a few minutes and try again."
              : stream?.locked
                ? "The blueprint stream is being read elsewhere. Please wait a moment and try again."
                : error}
          </AlertDescription>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="flex items-center gap-2"
              disabled={stream?.locked}
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  // Content display
  return (
    <div 
      ref={contentContainerRef}
      className="prose dark:prose-invert prose-headings:mt-4 prose-headings:mb-2 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-p:my-2 w-full max-w-full overflow-x-auto p-4 max-h-[500px] overflow-auto"
    >
      <div className="mb-2">
        <ArtifactBadge artifactType="blueprint" />
      </div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <div className="my-4 overflow-hidden rounded">
                <SyntaxHighlighter
                  language={match[1]}
                  style={vscDarkPlus}
                  customStyle={{ maxWidth: "100%" }}
                  wrapLines={true}
                  wrapLongLines={true}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          h1: ({ children }) => (
            <h1 className="mt-6 mb-3 text-2xl font-bold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-5 mb-2 text-xl font-bold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-2 text-lg font-semibold">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-3 mb-1 text-base font-semibold">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="mt-3 mb-1 text-base font-medium">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="mt-3 mb-1 text-sm font-medium">{children}</h6>
          ),
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
};

export default BlueprintViewer;
